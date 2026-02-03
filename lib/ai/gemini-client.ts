import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export interface ChatOptions {
    model?: string
    messages: { role: string; content: string }[]
    temperature?: number
}

export class GeminiClient {
    private genAI: GoogleGenerativeAI
    private model: GenerativeModel

    constructor(apiKey: string, modelName = 'gemini-2.0-flash') {
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({ model: modelName })
    }

    async streamChat(options: ChatOptions): Promise<ReadableStream> {
        const encoder = new TextEncoder()

        // Convert messages to Gemini format
        const history = options.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }))

        // Get system instruction from messages
        const systemMessage = options.messages.find((m) => m.role === 'system')
        const systemInstruction = systemMessage?.content

        // Create chat session
        const chat = this.model.startChat({
            history: history.slice(0, -1), // All except last message
            generationConfig: {
                temperature: options.temperature ?? 0.7,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
            ],
            ...(systemInstruction && { systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] } }),
        })

        // Get the last user message
        const lastMessage = history[history.length - 1]
        if (!lastMessage || lastMessage.role !== 'user') {
            throw new Error('Last message must be from user')
        }

        // Stream the response
        const result = await chat.sendMessageStream(lastMessage.parts[0].text)

        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text()
                        if (text) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
                            )
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error) {
                    console.error('Stream error:', error)
                    controller.error(error)
                }
            },
        })
    }

    async chat(options: ChatOptions): Promise<string> {
        // Convert messages to Gemini format
        const history = options.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }))

        // Get system instruction
        const systemMessage = options.messages.find((m) => m.role === 'system')
        const systemInstruction = systemMessage?.content

        const chat = this.model.startChat({
            history: history.slice(0, -1),
            generationConfig: {
                temperature: options.temperature ?? 0.7,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
            ],
            ...(systemInstruction && { systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] } }),
        })

        const lastMessage = history[history.length - 1]
        if (!lastMessage || lastMessage.role !== 'user') {
            throw new Error('Last message must be from user')
        }

        const result = await chat.sendMessage(lastMessage.parts[0].text)
        return result.response.text()
    }
}

export function createGeminiClient(modelName?: string): GeminiClient {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    return new GeminiClient(apiKey, modelName)
}
