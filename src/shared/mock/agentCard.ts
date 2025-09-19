import { AgentCard } from "../types";

export const agentCard: AgentCard = {
    id: "assistant-001",
    name: "Code Assistant",
    description: "An intelligent coding assistant that helps with development tasks, code review, and debugging",
    baseUrl: "https://api.example.com/agents/code-assistant",
    capabilities: [
        {
            name: "code_generation",
            description: "Generate code snippets and complete functions"
        },
        {
            name: "code_review",
            description: "Review code for bugs, performance issues, and best practices"
        },
        {
            name: "debugging",
            description: "Help identify and fix bugs in code"
        },
        {
            name: "documentation",
            description: "Generate documentation for code and APIs"
        }
    ],
    contact: {
        email: "support@example.com",
        url: "https://example.com/support"
    },
    specVersion: "1.0.0",
    lastUpdated: "2024-09-18T00:00:00Z"
}