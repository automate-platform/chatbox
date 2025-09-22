import { CoreMessage } from "ai";
import { StreamTextResult } from "../types";
import { Transformer, TransformerOptions } from "../types/transformer";
import {
  A2ARequest,
  SendMessageRequest,
  SendStreamingMessageRequest,
  Message,
  Part,
  TextPart,
  MessageSendParams,
  JSONRPCResponse
} from "../types/a2a-protocol";
import { isEmpty } from "lodash";


//TODO:

export class A2ATransformer implements Transformer {

  async transformRequestOut(
    request: CoreMessage[],
    options: TransformerOptions = {}
  ): Promise<A2ARequest> {
    try {
      const requestId = options.requestId || this.generateRequestId();

      const primaryMessage = request[request.length - 1];
      if (!primaryMessage) {
        throw new Error('Request array is empty');
      }

      const messageId = this.generateMessageId();

      const a2aMessage = this.convertToA2AMessage(primaryMessage, messageId, options);

      // TODO: ADD NODE-RED hook

      const isStreaming = options.streaming || false;
      return this.createSendMessageRequest(requestId, a2aMessage, options);

      if (isStreaming) {
        return this.createStreamingMessageRequest(requestId, a2aMessage, options);
      } else {
        return this.createSendMessageRequest(requestId, a2aMessage, options);
      }
    } catch (error: any) {
      throw new Error(`Failed to transform CoreMessage array to A2A format: ${error.message}`);
    }
  }

  private convertToA2AMessage(
    coreMessage: CoreMessage,
    messageId: string,
    options: TransformerOptions
  ): Message {
    const parts = this.convertContentToParts(coreMessage.content);

    return {
      kind: 'message',
      messageId,
      role: coreMessage.role === 'user' ? 'user' : 'agent',
      parts,
      ...(options.contextId && { contextId: options.contextId }),
      ...(options.taskId && { taskId: options.taskId }),
      ...(options.extensions && { extensions: options.extensions }),
      ...(options.referenceTaskIds && { referenceTaskIds: options.referenceTaskIds }),
      ...(options.messageMetadata && { metadata: options.messageMetadata })
    };
  }

  private convertContentToParts(content: CoreMessage['content']): Part[] {
    if (typeof content === 'string') {
      return [this.createTextPart(content)];
    }

    if (Array.isArray(content)) {
      return content.map(part => {
        // TODO: HANDLE TOOLS
        switch (part.type) {
          case 'text':
            return this.createTextPart(part.text);
          case 'image':
            // Convert image to file part
            // Base64
            // TODO: UNIT8ARRAY, ArrayBuffer, and a Buffer
            return {
              kind: 'file',
              file: {
                uri: typeof part.image === 'string' ? part.image : "",
                mimeType: 'image/*'
              }
            } as Part;
          default:
            // Base 64
            // TODO: UNIT8ARRAY, ArrayBuffer, and a Buffer
            return {
              kind: 'data',
              data: { ...part } as Record<string, unknown>
            } as Part;
        }
      });
    }
    return [{
      kind: 'data',
      data: content as Record<string, unknown>
    }];
  }

  private createTextPart(text: string): TextPart {
    return {
      kind: 'text',
      text
    };
  }


  private createSendMessageRequest(
    requestId: string,
    message: Message,
    options: TransformerOptions //TODO: PASS APP ID, USER ID
  ): SendMessageRequest {
    const params: MessageSendParams = {
      message,
      ...(options.configuration && { configuration: options.configuration }),
      ...(options.metadata && { metadata: options.metadata })
    };

    return {
      jsonrpc: '2.0',
      method: 'message/send',
      id: requestId,
      params
    };
  }


  private createStreamingMessageRequest(
    requestId: string,
    message: Message,
    options: TransformerOptions
  ): SendStreamingMessageRequest {
    const params: MessageSendParams = {
      message,
      ...(options.configuration && { configuration: options.configuration }),
      ...(options.metadata && { metadata: options.metadata })
    };

    return {
      jsonrpc: '2.0',
      method: 'message/stream',
      id: requestId,
      params
    };
  }


  async transformResponseIn(
    response: JSONRPCResponse,
    options: TransformerOptions = {}
  ): Promise<StreamTextResult> {
    try {
      const textContent = this.extractTextFromA2AResponse(response);


      // TODO: ADD NODE_RED HOOK

      const streamResult: StreamTextResult = {
        contentParts: [{ type: `text`, text: `${textContent}` }],
        usage: {
          promptTokens: 0,
          completionTokens: textContent.length,
          totalTokens: textContent.length
        },
        finishReason: 'stop'
      };

      return streamResult;
    } catch (error: any) {
      throw new Error(`Failed to transform A2A response to StreamTextResult: ${error.message}`);
    }
  }

  /**
   * Extract text content from A2A JSON-RPC response
   */
  private extractTextFromA2AResponse(response: JSONRPCResponse): string {
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`);
    }
    if ('result' in response) {
      const result = response.result;
      if (typeof result === 'object' && result && 'kind' in result && result.kind === 'message') {
        const message = result as Message;
        return message.parts
          .filter((part): part is TextPart => part.kind === 'text')
          .map(part => part.text)
          .join('\n');
      }

      if (typeof result === 'object' && result && 'kind' in result && result.kind === 'task') {
        const task = result as any;
        let responseText = "";
        if (task.artifacts) {
          const lastArtiffacts = task.artifacts[task.artifacts.length - 1];
            if (lastArtiffacts && lastArtiffacts.parts) {
              responseText = lastArtiffacts.parts
                .filter((part: Part): part is TextPart => part.kind === 'text')
                .map((part: TextPart) => part.text)
                .join('\n');
            }
        }
        if (!isEmpty(responseText)) {
          return responseText;
        } 
        if (task.history && Array.isArray(task.history)) {
          console.log("GET MESSAGE FROM TASK HISTORY");
          const lastMessage = task.history[task.history.length - 1];
          console.log("LAST MESSAGE FROM TASK HISTORY", lastMessage);
          if (lastMessage && lastMessage.parts) {
            return lastMessage.parts
              .filter((part: Part): part is TextPart => part.kind === 'text')
              .map((part: TextPart) => part.text)
              .join('\n');
          }
        }
      }

      if (typeof result === 'string') {
        return result;
      }

      if (typeof result === 'object' && result) {
        return JSON.stringify(result, null, 2);
      }
    }
    return '';
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export function createA2ATransformer(defaultOptions?: TransformerOptions): A2ATransformer {
  const transformer = new A2ATransformer();

  if (defaultOptions) {
    return new Proxy(transformer, {
      get(target, prop: string | symbol) {
        if (prop === 'transformRequestOut') {
          return async (request: CoreMessage[], options: TransformerOptions = {}) => {
            const mergedOptions = { ...defaultOptions, ...options };
            return target.transformRequestOut(request, mergedOptions);
          };
        }
        if (prop === 'transformResponseIn') {
          return async (response: JSONRPCResponse, options: TransformerOptions = {}) => {
            const mergedOptions = { ...defaultOptions, ...options };
            return target.transformResponseIn(response, mergedOptions);
          };
        }
        return Reflect.get(target, prop);
      }
    }) as A2ATransformer;
  }

  return transformer;
}

export const defaultA2ATransformer = createA2ATransformer();

export const streamingA2ATransformer = createA2ATransformer({
  streaming: true,
  priority: 'high'
});

export const systemA2ATransformer = createA2ATransformer({
  priority: 'normal'
});

export default A2ATransformer;