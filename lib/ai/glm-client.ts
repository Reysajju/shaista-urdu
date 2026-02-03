import OpenAI from 'openai'
import jwt from 'jsonwebtoken'

const GLM_API_KEY = process.env.GLM_API_KEY || ''

export class GLMClient {
    private client: OpenAI
    private model: string

    constructor(model: string = 'glm-4') {
        this.model = model
        const token = this.generateToken(GLM_API_KEY)
        this.client = new OpenAI({
            apiKey: token,
            baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
        })
    }

    private generateToken(apiKey: string): string {
        const [id, secret] = apiKey.split('.')
        if (!id || !secret) {
            throw new Error('Invalid GLM_API_KEY')
        }

        const payload = {
            api_key: id,
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
            timestamp: Math.floor(Date.now() / 1000),
        }

        // @ts-ignore - jsonwebtoken types might complain about header but it's valid
        return jwt.sign(payload, secret, {
            algorithm: 'HS256',
            header: {
                alg: 'HS256',
                sign_type: 'SIGN',
            },
        })
    }

    async streamChat(options: {
        messages: { role: string; content: string }[]
        temperature?: number
    }): Promise<ReadableStream> {
        const encoder = new TextEncoder()

        const response = await this.client.chat.completions.create({
            model: this.model,
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
                        const content = chunk.choices[0]?.delta?.content || ''
                        if (content) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                            )
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error) {
                    console.error('GLM Stream error:', error)
                    controller.error(error)
                }
            },
        })
    }
}

export function createGLMClient(model: string = 'glm-4') {
    return new GLMClient(model)
}
