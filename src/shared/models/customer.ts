import { createOpenAI } from '@ai-sdk/openai'
import { APICallError, CoreMessage, extractReasoningMiddleware, ToolSet, wrapLanguageModel } from 'ai'
import type { AgentCard, MessageContentParts, ProviderModelInfo, StreamTextResult } from '../types'
import type { ModelDependencies } from '../types/adapters'
import { normalizeOpenAIApiHostAndPath } from '../utils/llm_utils'
import AbstractAISDKModel, { CallSettings } from './abstract-ai-sdk'
import type { CallChatCompletionOptions } from './types'
import { createFetchWithProxy, fetchRemoteModels } from './utils/fetch-proxy'
import { ApiError, ChatboxAIAPIError } from './errors'
import { createA2ATransformer } from '../transformer/a2aTransformers'
import { A2AClient, A2AClientInterface } from '../utils/a2a_util'
import { getCurrentSessionMergedSettings } from '@/stores/sessionActions'
import { isEmpty } from 'lodash'
import { Platform } from '@/platform/interfaces'
import platform from '@/platform'
import DesktopPlatform from '@/platform/desktop_platform'

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
    public a2aClient: A2AClientInterface = new A2AClient();
    public platform: Platform = platform;
    public transformer = createA2ATransformer();
    private settings = getCurrentSessionMergedSettings();
    private selectedAgent: AgentCard | null = null;
    constructor(options: Options, dependencies: ModelDependencies) {
        super(options, dependencies)
        const { apiHost } = normalizeOpenAIApiHostAndPath(options)
        this.options = { ...options, apiHost }
        const agentProviders = this.settings.agentProviders;
        console.log("MODEL GENERATED",this.settings);
        console.log(platform instanceof DesktopPlatform, platform.triggerNode)
        this.selectedAgent = agentProviders?.find(item => item.chatboxSettingId === this.settings.agentProviderId && !isEmpty(item.chatboxSettingId)) || null;
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
        console.log("CHAT CALLED");
        // Create a new Error object to capture the current stack trace
        const error = new Error();
        // The 'stack' property contains the call stack as a string
        const callStack = error.stack;
        console.log("Call Stack:");
        console.log(callStack);
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
    private async _callChatCompletionCustom<T extends ToolSet>(
        coreMessages: CoreMessage[],
        options: CallChatCompletionOptions<T>
    ): Promise<StreamTextResult> {
        return this.handleNonStreamingCompletionCustom(null, coreMessages, options, {})
    }
    // chatbox -> chat box messaege -> node red -> transformer -> final  call callback -> result (chat box message format) 
    // choose agent -> logic agent bypass model provider
    // workspace -> choose workspace settings
    // choose workspace path -> path save -> open workspace -> open the path
    private async handleNonStreamingCompletionCustom<T extends ToolSet>(
        model: any, // Using 'any' for LanguageModelV1
        coreMessages: CoreMessage[],
        options: CallChatCompletionOptions<T>,
        callSettings: CallSettings
    ): Promise<StreamTextResult> {
        try {
            //TODO: ADD APP ID
            let nodeRedResult = null;
            const triggerNode = this.selectedAgent?.triggerNodeName;
            if (platform instanceof DesktopPlatform && this.platform.triggerNode && triggerNode && !isEmpty(triggerNode)) {
                console.log("TRIGGERED");
                // callback defined here
                nodeRedResult = await this.platform.triggerNode(triggerNode, {
                    coreMessages: {...coreMessages},
                    options: {
                        sessionId: options.sessionId,
                        // ADD HERE
                    }
                });
                console.log("NODERED SUCCESS", nodeRedResult);
            }
            else {
                //DO SOMETHING ABOUT THIS? -> GO BACK TO MODEL MODE @@
                throw new Error("UNABLE TO TRIGGER NODERED")
            }
            console.log("NODERD", nodeRedResult)
            const a2aOptions = {...options};
            if (nodeRedResult) {
                //@ts-ignore
                a2aOptions.messageMetadata = nodeRedResult;
            }
            const transformedRequest = await this.transformer.transformRequestOut(coreMessages, {
                streaming: this.options.stream || false,
                contextId: options.sessionId,
                ...a2aOptions
            });
            if (!this.selectedAgent || !this.selectedAgent.baseUrl) {
                console.log(this.a2aClient, this.selectedAgent?.baseUrl);
                throw new Error("A2AClient Is Null");
            }
            const result = await this.a2aClient.sendA2AMessageSingle(transformedRequest, this.selectedAgent.baseUrl);
            const convertedResult: StreamTextResult = await this.transformer.transformResponseIn(result);
            options.onResultChange?.({ contentParts: convertedResult.contentParts })
            return convertedResult
        } catch (error) {
            // Handle errors consistently with streaming mode
            console.log(error);
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