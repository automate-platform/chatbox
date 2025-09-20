#!/usr/bin/env tsx

import { A2AClient } from './a2a_util';
import { A2ARequest } from '../types/a2a-protocol';

/**
 * Manual Test Script for A2AClient
 *
 * This script allows you to test the A2AClient with custom inputs.
 * Modify the requestBody and baseAgentUrl variables below to test with your data.
 */

async function manualTest() {


    // 1. Set agent URL
    const baseAgentUrl = "http://localhost:41242";

    // 2. Configure request body
    const requestBody: A2ARequest = {
        id: "manual-test-1",
        jsonrpc: "2.0",
        method: "message/send",
        params: {
            message: {
                kind: "message",
                messageId: "manual-msg-1",
                role: "user",
                parts: [{
                    kind: "text",
                    text: "Hello! This is a manual test message. Can you respond?"
                }]
            },
            configuration: {
                blocking: true,
                historyLength: 5
            }
        }
    };

    // 3. Optional: Add more test configurations
    const testConfigs = [
        {
            name: "Basic Message Test",
            url: baseAgentUrl,
            request: requestBody
        },
        // Add more test configurations here if needed
        // {
        //     name: "Get Task Test",
        //     url: baseAgentUrl,
        //     request: {
        //         id: "get-task-test",
        //         jsonrpc: "2.0",
        //         method: "tasks/get",
        //         params: {
        //             id: "your-task-id-here",
        //             historyLength: 10
        //         }
        //     } as A2ARequest
        // }
    ];

    // 4. Agent Card Test Configuration
    const agentCardTest = {
        name: "Get Agent Card Test",
        url: baseAgentUrl
    };

    console.log('A2A Client Manual Test');
    console.log('=' .repeat(50));

    const client = new A2AClient();

    for (const config of testConfigs) {
        console.log(`\n Running: ${config.name}`);
        console.log('─' .repeat(30));

        console.log('Request URL:', config.url);
        console.log('Request Body:');
        console.log(JSON.stringify(config.request, null, 2));

        console.log('\nSending request...');

        const startTime = Date.now();

        try {
            const response = await client.sendA2AMessageSingle(config.request, config.url);
            const endTime = Date.now();

            console.log('SUCCESS!');
            console.log(`Response time: ${endTime - startTime}ms`);
            console.log('Response:');
            console.log(JSON.stringify(response, null, 2));

        } catch (error) {
            const endTime = Date.now();

            console.log('ERROR!');
            console.log(`Time: ${endTime - startTime}ms`);
            console.log('Error details:');
            console.error(error);
        }

        console.log('\n' + '=' .repeat(50));
    }

    // Test Agent Card endpoint
    console.log(`\nRunning: ${agentCardTest.name}`);
    console.log('─' .repeat(30));

    console.log('Agent Card URL:', `${agentCardTest.url}/.well-known/agent.json`);
    console.log('\nFetching agent card...');

    const startTime = Date.now();

    try {
        const agentCard = await client.getAgentCard(agentCardTest.url);
        const endTime = Date.now();

        console.log('SUCCESS!');
        console.log(`Response time: ${endTime - startTime}ms`);
        console.log('Agent Card:');
        console.log(JSON.stringify(agentCard, null, 2));

    } catch (error) {
        const endTime = Date.now();

        console.log('ERROR!');
        console.log(`Time: ${endTime - startTime}ms`);
        console.log('Error details:');
        console.error(error);
    }

    console.log('\n' + '=' .repeat(50));
}

// Helper function to create different types of requests
export function createSampleRequests() {
    return {
        sendMessage: (text: string, taskId?: string): A2ARequest => ({
            id: `msg-${Date.now()}`,
            jsonrpc: "2.0",
            method: "message/send",
            params: {
                message: {
                    kind: "message",
                    messageId: `msg-${Date.now()}`,
                    role: "user",
                    parts: [{ kind: "text", text }],
                    ...(taskId && { taskId })
                }
            }
        }),

        getTask: (taskId: string, historyLength = 10): A2ARequest => ({
            id: `get-${Date.now()}`,
            jsonrpc: "2.0",
            method: "tasks/get",
            params: {
                id: taskId,
                historyLength
            }
        }),

        cancelTask: (taskId: string): A2ARequest => ({
            id: `cancel-${Date.now()}`,
            jsonrpc: "2.0",
            method: "tasks/cancel",
            params: {
                id: taskId
            }
        }),

        streamMessage: (text: string, taskId?: string): A2ARequest => ({
            id: `stream-${Date.now()}`,
            jsonrpc: "2.0",
            method: "message/stream",
            params: {
                message: {
                    kind: "message",
                    messageId: `stream-msg-${Date.now()}`,
                    role: "user",
                    parts: [{ kind: "text", text }],
                    ...(taskId && { taskId })
                }
            }
        }),

        sendFileMessage: (text: string, fileName: string, mimeType: string, base64Content: string): A2ARequest => ({
            id: `file-${Date.now()}`,
            jsonrpc: "2.0",
            method: "message/send",
            params: {
                message: {
                    kind: "message",
                    messageId: `file-msg-${Date.now()}`,
                    role: "user",
                    parts: [
                        { kind: "text", text },
                        {
                            kind: "file",
                            file: {
                                name: fileName,
                                mimeType,
                                bytes: base64Content
                            }
                        }
                    ]
                }
            }
        })
    };
}

// Quick test function you can call with your own data
export async function quickTest(requestBody: A2ARequest, baseAgentUrl: string) {
    console.log('Quick A2A Test');
    console.log('URL:', baseAgentUrl);
    console.log('Request:', JSON.stringify(requestBody, null, 2));

    const client = new A2AClient();

    try {
        const response = await client.sendA2AMessageSingle(requestBody, baseAgentUrl);
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.log('Error:', error);
        throw error;
    }
}

// Quick test function for agent card
export async function quickTestAgentCard(baseAgentUrl: string) {
    console.log('Quick Agent Card Test');
    console.log('URL:', `${baseAgentUrl}/.well-known/agent.json`);

    const client = new A2AClient();

    try {
        const agentCard = await client.getAgentCard(baseAgentUrl);
        console.log('Agent Card:', JSON.stringify(agentCard, null, 2));
        return agentCard;
    } catch (error) {
        console.log('Error:', error);
        throw error;
    }
}

// Usage examples in comments for easy copy-paste
/*
USAGE EXAMPLES:

1. Basic test:
```typescript
import { quickTest, quickTestAgentCard, createSampleRequests } from './manual-test';

const samples = createSampleRequests();
const request = samples.sendMessage("Hello, how are you?");
await quickTest(request, "https://your-agent.com/api");
```

2. Agent Card test:
```typescript
// Test fetching agent card from /.well-known/agent-card.info
await quickTestAgentCard("http://localhost:41242");
```

3. File upload test:
```typescript
const fileRequest = samples.sendFileMessage(
    "Please analyze this file",
    "data.json",
    "application/json",
    "base64-encoded-content-here"
);
await quickTest(fileRequest, "https://your-agent.com/api");
```

4. Task management:
```typescript
const getTaskReq = samples.getTask("task-123");
await quickTest(getTaskReq, "https://your-agent.com/api");

const cancelTaskReq = samples.cancelTask("task-123");
await quickTest(cancelTaskReq, "https://your-agent.com/api");
```

5. Streaming:
```typescript
const streamReq = samples.streamMessage("Start streaming response", "task-123");
await quickTest(streamReq, "https://your-agent.com/api");
```
*/

// Run the manual test if this file is executed directly
if (require.main === module) {
    manualTest().catch(console.error);
}