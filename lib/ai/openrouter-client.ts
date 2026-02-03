import OpenAI from 'openai'

export class OpenRouterClient {
    private client: OpenAI | null = null

    constructor() {
        // Delayed initialization
    }

    private getClient(): OpenAI {
        if (this.client) return this.client

        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY is not set')
        }

        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://shaista.app',
                'X-Title': 'Shaista AI',
            },
        })
        return this.client
    }

    async streamChat(options: {
        messages: { role: string; content: string }[]
        temperature?: number
        model?: string
    }): Promise<ReadableStream> {
        const encoder = new TextEncoder()

        // List of CURRENTLY verified free models (Feb 2025)
        const freeModels = [
            'google/gemini-2.0-flash-exp:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'google/gemma-2-9b-it:free',
            'deepseek/deepseek-r1-distill-llama-70b:free',
            'qwen/qwen-2.5-72b-instruct:free',
            'openrouter/free', // Final smart router fallback
        ]

        const tryModel = async (modelIndex: number): Promise<ReadableStream> => {
            const currentModel = options.model || freeModels[modelIndex]

            try {
                const client = this.getClient()
                const response = await client.chat.completions.create({
                    model: currentModel,
                    messages: options.messages.map((m) => ({
                        role: m.role as 'user' | 'assistant' | 'system',
                        content: m.content,
                    })),
                    temperature: options.temperature ?? 0.7,
                    stream: true,
                })

                return new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of response) {
                                const content = chunk.choices[0]?.delta?.content
                                if (content) {
                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                                    )
                                }
                            }
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                            controller.close()
                        } catch (error) {
                            console.error(`Stream error for model ${currentModel}:`, error)
                            controller.error(error)
                        }
                    },
                })
            } catch (error: any) {
                console.warn(`OpenRouter model ${currentModel} failed (Attempt ${modelIndex + 1}):`, error?.message || error)

                // If it's a 404, 403, or other provider error, try the next model in the list
                const isProviderError = error?.message?.includes('404') ||
                    error?.message?.includes('endpoints') ||
                    error?.message?.includes('provider')

                if (modelIndex < freeModels.length - 1 && !options.model) {
                    return tryModel(modelIndex + 1)
                }

                // If all failed, return error stream
                const errorMsg = error?.message || 'تمام فری ماڈلز مصروف ہیں۔'
                return new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: `خطا: شائستہ کے رابطہ میں مسئلہ (Error: ${errorMsg})` })}\n\n`))
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                        controller.close()
                    },
                })
            }
        }

        // Start with the requested model or the first one in our verified list
        return tryModel(0)
    }
}

export function createOpenRouterClient(): OpenRouterClient {
    return new OpenRouterClient()
}
