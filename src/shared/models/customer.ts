import { createOpenAI } from '@ai-sdk/openai'
import { APICallError, CoreMessage, extractReasoningMiddleware, ToolSet, wrapLanguageModel } from 'ai'
import type { MessageContentParts, ProviderModelInfo, StreamTextResult } from '../types'
import type { ModelDependencies } from '../types/adapters'
import { normalizeOpenAIApiHostAndPath } from '../utils/llm_utils'
import AbstractAISDKModel, { CallSettings } from './abstract-ai-sdk'
import type { CallChatCompletionOptions } from './types'
import { createFetchWithProxy, fetchRemoteModels } from './utils/fetch-proxy'
import { ApiError, ChatboxAIAPIError } from './errors'
import { createA2ATransformer } from '../transformer/a2aTransformers'

interface Options {
    apiKey: string
    apiHost: string
    model: ProviderModelInfo
    dalleStyle: 'vivid' | 'natural'
    temperature?: number
    topP?: number
    maxTokens?: number
    injectDefaultMetadata: boolean
    useProxy: boolean
    stream?: boolean
}

export default class Custom extends AbstractAISDKModel {
    public name = 'Custom'
    public options: Options
    public transformer = createA2ATransformer();
    constructor(options: Options, dependencies: ModelDependencies) {
        super(options, dependencies)
        const { apiHost } = normalizeOpenAIApiHostAndPath(options)
        this.options = { ...options, apiHost }
    }

    static isSupportTextEmbedding() {
        return true
    }

    protected getProvider() {
        return createOpenAI({
            apiKey: this.options.apiKey,
            baseURL: this.options.apiHost,
            fetch: createFetchWithProxy(this.options.useProxy, this.dependencies),
            headers: this.options.apiHost.includes('openrouter.ai')
                ? {
                    'HTTP-Referer': 'https://chatboxai.app',
                    'X-Title': 'Chatbox AI',
                }
                : undefined,
        })
    }

    protected getChatModel() {
        const provider = this.getProvider()
        return wrapLanguageModel({
            model: provider.chat(this.options.model.modelId),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        })
    }

    protected getImageModel() {
        const provider = this.getProvider()
        return provider.image('dall-e-3')
    }

    protected getCallSettings(options: CallChatCompletionOptions) {
        const isModelSupportReasoning = this.isSupportReasoning()
        let providerOptions = {}
        if (isModelSupportReasoning) {
            providerOptions = {
                openai: options.providerOptions?.openai || {},
            }
        }

        return {
            temperature: this.options.temperature,
            topP: this.options.topP,
            maxTokens: this.options.maxTokens,
            providerOptions,
        }
    }

    public listModels() {
        return fetchRemoteModels(
            {
                apiHost: this.options.apiHost,
                apiKey: this.options.apiKey,
                useProxy: this.options.useProxy,
            },
            this.dependencies
        )
    }
    public async chat(messages: CoreMessage[], options: CallChatCompletionOptions): Promise<StreamTextResult> {
        try {
            return await this._callChatCompletionCustom(messages, options)
        } catch (e) {
            if (e instanceof ChatboxAIAPIError) {
                throw e
            }
            // 如果当前模型不支持图片输入，抛出对应的错误
            if (
                e instanceof ApiError &&
                e.message.includes('Invalid content type. image_url is only supported by certain models.')
            ) {
                // 根据当前 IP，判断是否在错误中推荐 Chatbox AI 4
                const remoteConfig = this.dependencies.getRemoteConfig()
                if (remoteConfig.setting_chatboxai_first) {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image')
                } else {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image_2')
                }
            }

            // 添加请求信息到 Sentry
            this.dependencies.sentry.withScope((scope) => {
                scope.setTag('provider_name', this.name)
                scope.setExtra('messages', JSON.stringify(messages))
                scope.setExtra('options', JSON.stringify(options))
                this.dependencies.sentry.captureException(e)
            })
            throw e
        }
    }
    /**
     * Send a POST request to an LLM provider endpoint
     * @param endpoint - The LLM provider endpoint URL
     * @param messages - Array of CoreMessage objects to send
     * @param options - Additional request options
     * @returns Promise<Response> - The response from the LLM provider
     */
    public async sendLLMRequest(
        endpoint: string,
        messages: CoreMessage[],
        options: {
            apiKey?: string;
            headers?: Record<string, string>;
            timeout?: number;
            useProxy?: boolean;
        } = {}
    ): Promise<Response> {
        try {
            // Transform messages to A2A format using the transformer
            const transformedRequest = await this.transformer.transformRequestOut(messages, {
                streaming: this.options.stream || false,
                ...options
            });

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Add API key if provided
            if (options.apiKey) {
                headers['Authorization'] = `Bearer ${options.apiKey}`;
            }

            // Create fetch function with or without proxy
            const fetchFn = createFetchWithProxy(
                options.useProxy ?? this.options.useProxy,
                this.dependencies
            );

            // Create abort controller for timeout
            const controller = new AbortController();
            if (options.timeout) {
                setTimeout(() => controller.abort(), options.timeout);
            }

            // Send the POST request
            const response = await fetchFn(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(transformedRequest),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new ApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    await response.text()
                );
            }

            return response;

        } catch (error) {
            this.handleErrorCustom(error, ` when sending request to ${endpoint}`);
        }
    }
    private async _callChatCompletionCustom<T extends ToolSet>(
        coreMessages: CoreMessage[],
        options: CallChatCompletionOptions<T>
      ): Promise<StreamTextResult> {
        const model = this.getChatModel()
        const callSettings = this.getCallSettings(options)
        return this.handleNonStreamingCompletionCustom(model, coreMessages, options, callSettings)
        // if (this.options.stream === false) {
        //   return this.handleNonStreamingCompletionCustom(model, coreMessages, options, callSettings)
        // }
    
        // return this.handleStreamingCompletion(model, coreMessages, options, callSettings)
      }

    private async handleNonStreamingCompletionCustom<T extends ToolSet>(
        model: any, // Using 'any' for LanguageModelV1
        coreMessages: CoreMessage[],
        options: CallChatCompletionOptions<T>,
        callSettings: CallSettings
    ): Promise<StreamTextResult> {
        const contentParts: MessageContentParts = []

        try {
            const response = await this.sendLLMRequest(
                "http://localhost:1880/v1/chat/completions",
                coreMessages,
                {
                    apiKey: this.options.apiKey,
                    useProxy: this.options.useProxy
                }
            );

            const result = await response.json();
            //TODO: ADD SESSION ID, USER ID, APP ID
            const convertedResult:StreamTextResult = await this.transformer.transformResponseIn(result);
            options.onResultChange?.({ contentParts: convertedResult.contentParts })
            return convertedResult
        } catch (error) {
            // Handle errors consistently with streaming mode
            this.handleErrorCustom(error)
        }
    }
    protected handleErrorCustom(error: unknown, context: string = ''): never {
        if (APICallError.isInstance(error)) {
            throw new ApiError(`Error from ${this.name}${context}`, error.responseBody)
        }
        if (error instanceof ApiError) {
            throw error
        }
        if (error instanceof ChatboxAIAPIError) {
            throw error
        }
        throw new ApiError(`Error from ${this.name}${context}: ${error}`)
    }
}