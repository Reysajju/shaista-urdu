export interface ChatOptions {
    model: string
    messages: { role: string; content: string }[]
    temperature?: number
    tools?: unknown[]
    onToolCall?: (tool: unknown) => Promise<unknown>
}

export class KimiClient {
    private apiKey: string
    private baseUrl = 'https://api.moonshot.cn/v1'

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    async streamChat(options: ChatOptions): Promise<ReadableStream> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options.model,
                messages: options.messages,
                stream: true,
                temperature: options.temperature ?? 0.7,
                tools: options.tools,
            }),
        })

        if (!response.ok) {
            throw new Error(`Kimi API error: ${response.status} ${response.statusText}`)
        }

        return this.handleStream(response, options.onToolCall)
    }

    private handleStream(
        response: Response,
        onToolCall?: (tool: unknown) => Promise<unknown>
    ): ReadableStream {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()

        return new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader()
                if (!reader) {
                    controller.close()
                    return
                }

                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim()
                            if (data === '[DONE]') continue

                            try {
                                const json = JSON.parse(data)
                                const delta = json.choices?.[0]?.delta

                                if (delta?.content) {
                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                                    )
                                }

                                // Handle tool calls
                                if (delta?.tool_calls && onToolCall) {
                                    for (const toolCall of delta.tool_calls) {
                                        const result = await onToolCall(toolCall)
                                        controller.enqueue(
                                            encoder.encode(`data: ${JSON.stringify({ toolResult: result })}\n\n`)
                                        )
                                    }
                                }

                                if (json.choices?.[0]?.finish_reason === 'stop') {
                                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
                controller.close()
            },
        })
    }

    async chat(options: Omit<ChatOptions, 'onToolCall'>): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options.model,
                messages: options.messages,
                stream: false,
                temperature: options.temperature ?? 0.7,
                tools: options.tools,
            }),
        })

        if (!response.ok) {
            throw new Error(`Kimi API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
    }
}

export function createKimiClient(): KimiClient {
    const apiKey = process.env.KIMI_API_KEY
    if (!apiKey) {
        throw new Error('KIMI_API_KEY environment variable is not set')
    }
    return new KimiClient(apiKey)
}
