import { AgentCard } from "../types";
import { A2ARequest, JSONRPCResponse } from "@a2a-js/sdk";

export interface A2AClientInterface {
    sendA2AMessageSingle: (a2aRequest: A2ARequest, baseAgentUrl: string) => Promise<JSONRPCResponse>
    getAgentCard: (baseAgentUrl: string) => Promise<AgentCard>
}


export class A2AClient implements A2AClientInterface {
    public sendA2AMessageSingle = async (req: A2ARequest, baseAgentUrl: string): Promise<JSONRPCResponse> => {
        try {
            const response = await fetch(baseAgentUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            return jsonResponse as JSONRPCResponse;
        } catch (error) {
            throw new Error(`Failed to send A2A message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    public getAgentCard = async (baseAgentUrl: string): Promise<AgentCard> => {
        try {
            // Construct the well-known endpoint URL
            const url = new URL(baseAgentUrl);
            url.pathname = '/.well-known/agent-card.json';

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const agentCard = await response.json();
            return agentCard as AgentCard;
        } catch (error) {
            throw new Error(`Failed to get agent card: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}