import { A2AClient } from './a2a_util';
import { A2ARequest, JSONRPCResponse } from '../types/a2a-protocol';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('A2AClient', () => {
    let client: A2AClient;

    beforeEach(() => {
        client = new A2AClient();
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('sendA2AMessageSingle', () => {
        it('should send a successful message/send request', async () => {
            // Test input data
            const testRequest: A2ARequest = {
                id: "test-123",
                jsonrpc: "2.0",
                method: "message/send",
                params: {
                    message: {
                        kind: "message",
                        messageId: "msg-123",
                        role: "user",
                        parts: [{
                            kind: "text",
                            text: "Hello, this is a test message!"
                        }]
                    }
                }
            };

            const testUrl = "https://example-agent.com/api";

            const mockResponse: JSONRPCResponse = {
                id: "test-123",
                jsonrpc: "2.0",
                result: {
                    kind: "task",
                    id: "task-456",
                    contextId: "ctx-789",
                    status: {
                        state: "completed",
                        timestamp: "2023-12-01T10:00:00Z"
                    }
                }
            };

            // Mock successful response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                status: 200,
                statusText: 'OK'
            } as Response);

            const result = await client.sendA2AMessageSingle(testRequest, testUrl);

            expect(mockFetch).toHaveBeenCalledWith(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testRequest)
            });

            expect(result).toEqual(mockResponse);
        });

        it('should handle HTTP errors correctly', async () => {
            const testRequest: A2ARequest = {
                id: "test-error",
                jsonrpc: "2.0",
                method: "message/send",
                params: {
                    message: {
                        kind: "message",
                        messageId: "msg-error",
                        role: "user",
                        parts: [{
                            kind: "text",
                            text: "This will fail"
                        }]
                    }
                }
            };

            const testUrl = "https://bad-agent.com/api";

            // Mock HTTP error response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            } as Response);

            await expect(client.sendA2AMessageSingle(testRequest, testUrl))
                .rejects.toThrow('Failed to send A2A message: HTTP error! status: 404');
        });

        it('should handle network errors correctly', async () => {
            const testRequest: A2ARequest = {
                id: "test-network-error",
                jsonrpc: "2.0",
                method: "message/send",
                params: {
                    message: {
                        kind: "message",
                        messageId: "msg-network-error",
                        role: "user",
                        parts: [{
                            kind: "text",
                            text: "Network will fail"
                        }]
                    }
                }
            };

            const testUrl = "https://unreachable-agent.com/api";

            // Mock network error
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(client.sendA2AMessageSingle(testRequest, testUrl))
                .rejects.toThrow('Failed to send A2A message: Network error');
        });

        // it('should handle JSON parsing errors', async () => {
        //     const testRequest: A2ARequest = {
        //         id: "test-json-error",
        //         jsonrpc: "2.0",
        //         method: "message/send",
        //         params: {
        //             message: {
        //                 kind: "message",
        //                 messageId: "msg-json-error",
        //                 role: "user",
        //                 parts: [{
        //                     kind: "text",
        //                     text: "JSON will be invalid"
        //                 }]
        //             }
        //         }
        //     };

        //     const testUrl = "https://bad-json-agent.com/api";

        //     // Mock response with invalid JSON
        //     mockFetch.mockResolvedValueOnce({
        //         ok: true,
        //         json: async () => {
        //             throw new Error('Invalid JSON');
        //         },
        //         status: 200,
        //         statusText: 'OK',
        //         headers: new Headers(),
        //         redirected: false,
        //         type: 'basic',
        //         url: testUrl,
        //         body: null,
        //         bodyUsed: false,
        //         clone: jest.fn(),
        //         arrayBuffer: jest.fn(),
        //         blob: jest.fn(),
        //         formData: jest.fn(),
        //         text: jest.fn()
        //     } as Response);

        //     await expect(client.sendA2AMessageSingle(testRequest, testUrl))
        //         .rejects.toThrow('Failed to send A2A message: Invalid JSON');
        // });

        it('should send different types of A2A requests', async () => {
            // Test GetTaskRequest
            const getTaskRequest: A2ARequest = {
                id: "get-task-123",
                jsonrpc: "2.0",
                method: "tasks/get",
                params: {
                    id: "task-456",
                    historyLength: 10
                }
            };

            const testUrl = "https://example-agent.com/api";

            const mockResponse: JSONRPCResponse = {
                id: "get-task-123",
                jsonrpc: "2.0",
                result: {
                    kind: "task",
                    id: "task-456",
                    contextId: "ctx-789",
                    status: {
                        state: "completed"
                    },
                    history: []
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                status: 200,
                statusText: 'OK'
            } as Response);

            const result = await client.sendA2AMessageSingle(getTaskRequest, testUrl);

            expect(mockFetch).toHaveBeenCalledWith(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(getTaskRequest)
            });

            expect(result).toEqual(mockResponse);
        });
    });
});

// Interactive test helper function for manual testing
export async function testA2AClientInteractive(
    requestBody: A2ARequest,
    baseAgentUrl: string
): Promise<void> {
    console.log('🚀 Testing A2AClient with:');
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('🌐 Base Agent URL:', baseAgentUrl);
    console.log('⏳ Sending request...\n');

    const client = new A2AClient();

    try {
        const startTime = Date.now();
        const response = await client.sendA2AMessageSingle(requestBody, baseAgentUrl);
        const endTime = Date.now();

        console.log('✅ Success!');
        console.log('⏱️  Response Time:', `${endTime - startTime}ms`);
        console.log('📥 Response:', JSON.stringify(response, null, 2));
    } catch (error) {
        console.log('❌ Error occurred:');
        console.error(error);
    }
}

// Example usage function with sample data
export function runExampleTests(): void {
    console.log('Running example A2A tests...\n');

    console.log('💡 Example requests you can use:');
    console.log('1. SendMessage request:');
    console.log(JSON.stringify({
        id: "example-1",
        jsonrpc: "2.0",
        method: "message/send",
        params: {
            message: {
                kind: "message",
                messageId: "msg-example-1",
                role: "user",
                parts: [{
                    kind: "text",
                    text: "Hello! Can you help me with a task?"
                }]
            },
            configuration: {
                blocking: true,
                historyLength: 5
            }
        }
    }, null, 2));

    console.log('\n2. GetTask request:');
    console.log(JSON.stringify({
        id: "example-2",
        jsonrpc: "2.0",
        method: "tasks/get",
        params: {
            id: "task-123",
            historyLength: 10
        }
    }, null, 2));

    console.log('\n💡 Example URLs to test with:');
    console.log('- https://your-agent.example.com/api');
    console.log('- http://localhost:3000/api/a2a');

    console.log('\n💡 To test manually, call:');
    console.log('testA2AClientInteractive(requestObject, "YOUR_AGENT_URL")');
}