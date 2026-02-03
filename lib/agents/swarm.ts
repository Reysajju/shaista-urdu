import { createGeminiClient } from '@/lib/ai/gemini-client'
import EventEmitter from 'eventemitter3'

export interface Agent {
    id: string
    role: string
    systemPrompt: string
    tools: string[]
    llmConfig: {
        model: string
        temperature: number
    }
}

export interface Task {
    id: string
    instruction: string
    context?: Record<string, unknown>
    dependencies?: string[]
}

export interface TaskResult {
    agentId: string
    taskId: string
    output: string
    metadata?: Record<string, unknown>
}

export interface Step {
    id: string
    role: string
    instruction: string
    dependencies: { agentId: string }[]
}

export interface Plan {
    steps: Step[]
}

// Pre-configured agents
export const defaultAgents: Record<string, Agent> = {
    architect: {
        id: 'architect',
        role: 'architect',
        systemPrompt: `You are a system architect. Your responsibilities:
- Design scalable and maintainable solutions
- Create clear architecture diagrams and specifications
- Consider performance, security, and reliability
- Provide technical recommendations`,
        tools: ['diagram_generator', 'tech_stack_analyzer'],
        llmConfig: { model: 'gemini-1.5-flash', temperature: 0.4 },
    },
    coder: {
        id: 'coder',
        role: 'coder',
        systemPrompt: `You are an expert developer. Your responsibilities:
- Write clean, well-documented code
- Follow best practices and design patterns
- Include proper error handling
- Write unit tests when applicable`,
        tools: ['code_writer', 'test_generator', 'linter'],
        llmConfig: { model: 'gemini-1.5-flash', temperature: 0.2 },
    },
    reviewer: {
        id: 'reviewer',
        role: 'reviewer',
        systemPrompt: `You are a code reviewer. Your responsibilities:
- Ensure code quality and best practices
- Identify potential bugs and security issues
- Suggest improvements and optimizations
- Check for maintainability and readability`,
        tools: ['security_scanner', 'performance_analyzer'],
        llmConfig: { model: 'gemini-1.5-flash', temperature: 0.3 },
    },
    researcher: {
        id: 'researcher',
        role: 'researcher',
        systemPrompt: `You are a research specialist. Your responsibilities:
- Gather and analyze information
- Synthesize findings into actionable insights
- Identify trends and patterns
- Provide evidence-based recommendations`,
        tools: ['web_search', 'document_analyzer'],
        llmConfig: { model: 'gemini-1.5-flash', temperature: 0.5 },
    },
}

export class AgentSwarm {
    private agents: Map<string, Agent>
    private messageBus: EventEmitter
    private taskResults: Map<string, TaskResult>

    constructor(agents: Agent[] = Object.values(defaultAgents)) {
        this.agents = new Map(agents.map((a) => [a.id, a]))
        this.messageBus = new EventEmitter()
        this.taskResults = new Map()
    }

    async executeTask(task: Task): Promise<TaskResult[]> {
        // Select appropriate agents
        const selectedAgents = await this.selectAgents(task)

        // Create execution plan
        const plan = await this.createPlan(task, selectedAgents)

        // Execute steps
        const results: TaskResult[] = []

        for (const step of plan.steps) {
            const agent = selectedAgents.find((a) => a.role === step.role)
            if (!agent) continue

            // Gather context from dependencies
            const context = step.dependencies
                .map((dep) => this.taskResults.get(dep.agentId)?.output)
                .filter(Boolean)
                .join('\n\n')

            const result = await this.executeStep(step, agent, context)
            results.push(result)
            this.taskResults.set(agent.id, result)

            // Broadcast to message bus
            this.messageBus.emit(`agent:${agent.id}:output`, result)
        }

        return results
    }

    private async selectAgents(task: Task): Promise<Agent[]> {
        const gemini = createGeminiClient()

        const selectionPrompt = `Given this task, select the most appropriate agents from the available roles.
Task: ${task.instruction}
Available roles: ${Array.from(this.agents.values())
                .map((a) => `${a.role}: ${a.systemPrompt.substring(0, 100)}...`)
                .join('\n')}

Return ONLY a JSON array of role names that should handle this task, no other text.`

        const response = await gemini.chat({
            messages: [{ role: 'user', content: selectionPrompt }],
        })

        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                const roles = JSON.parse(jsonMatch[0])
                return roles
                    .map((role: string) =>
                        Array.from(this.agents.values()).find((a) => a.role === role)
                    )
                    .filter(Boolean)
            }
        } catch {
            // Default to all agents
        }
        return Array.from(this.agents.values())
    }

    private async createPlan(task: Task, agents: Agent[]): Promise<Plan> {
        const steps: Step[] = agents.map((agent, index) => ({
            id: `step-${index}`,
            role: agent.role,
            instruction: task.instruction,
            dependencies: index > 0 ? [{ agentId: agents[index - 1].id }] : [],
        }))

        return { steps }
    }

    private async executeStep(
        step: Step,
        agent: Agent,
        context: string
    ): Promise<TaskResult> {
        const gemini = createGeminiClient(agent.llmConfig.model)

        const response = await gemini.chat({
            messages: [
                { role: 'system', content: agent.systemPrompt },
                {
                    role: 'user',
                    content: context
                        ? `${step.instruction}\n\nContext from other agents:\n${context}`
                        : step.instruction,
                },
            ],
            temperature: agent.llmConfig.temperature,
        })

        return {
            agentId: agent.id,
            taskId: step.id,
            output: response,
            metadata: {
                role: agent.role,
                timestamp: new Date().toISOString(),
            },
        }
    }

    onAgentOutput(
        agentId: string,
        callback: (result: TaskResult) => void
    ): () => void {
        this.messageBus.on(`agent:${agentId}:output`, callback)
        return () => this.messageBus.off(`agent:${agentId}:output`, callback)
    }

    getAgent(id: string): Agent | undefined {
        return this.agents.get(id)
    }

    addAgent(agent: Agent): void {
        this.agents.set(agent.id, agent)
    }
}
