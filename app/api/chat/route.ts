import { createClient } from '@/utils/supabase/server'
import { createGeminiClient } from '@/lib/ai/gemini-client'
import { createGLMClient } from '@/lib/ai/glm-client'
import { createOpenRouterClient } from '@/lib/ai/openrouter-client'

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        const { messages, conversationId, provider = 'glm', model = 'glm-4.7-flash', isGuest = false } = await req.json()

        // Validate input
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: 'Messages are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        const isSuperAdmin = ['sajjjad.rasool@gmail.com', 'sajjad.rasool@gmail.com'].includes(user?.email || '')

        // --- CONCURRENCY CONTROL ---
        if (user && !isSuperAdmin) {
            const { count: activeCount } = await supabase
                .from('request_queue')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'processing')

            if (activeCount !== null && activeCount >= 5) {
                const { data: queueItem } = await supabase
                    .from('request_queue')
                    .insert({
                        user_id: user.id,
                        provider,
                        model,
                        status: 'pending'
                    })
                    .select('id')
                    .single()

                const waitTime = (activeCount + 1) * 10

                return new Response(
                    JSON.stringify({
                        queued: true,
                        queueId: queueItem?.id,
                        message: `سرور مصروف ہے۔ تخمینی انتظار: ${waitTime} سیکنڈ`,
                        waitTime
                    }),
                    { status: 202, headers: { 'Content-Type': 'application/json' } }
                )
            }

            await supabase
                .from('request_queue')
                .insert({
                    user_id: user.id,
                    provider,
                    model,
                    status: 'processing'
                })
        }

        // --- RATE LIMITING (1000 words/day) ---
        if (user && !isSuperAdmin) {
            const today = new Date().toISOString().split('T')[0]
            const { data: dailyMessages } = await supabase
                .from('messages')
                .select('content')
                .eq('role', 'assistant')
                .gte('created_at', `${today}T00:00:00Z`)
                .lt('created_at', `${today}T23:59:59Z`)

            let wordCount = 0
            dailyMessages?.forEach(msg => {
                wordCount += msg.content.split(/\s+/).length
            })

            if (wordCount > 1000) {
                return new Response(
                    JSON.stringify({ error: 'روزانہ کی حد ختم۔ پرو پلان جلد۔' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                )
            }
        }

        // --- CREATE/GET CONVERSATION ---
        let activeConversationId = conversationId

        if (user && !activeConversationId) {
            // Create new conversation with user_id and provider info
            const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                    user_id: user.id,
                    model: model,
                    title: messages[0]?.content?.substring(0, 50) || 'نئی گفتگو',
                })
                .select('id')
                .single()

            if (convError) {
                console.error('Failed to create conversation:', convError)
            } else if (newConv) {
                activeConversationId = newConv.id
            }
        }

        // --- SAVE USER MESSAGE ---
        if (user && activeConversationId) {
            const userContent = messages[messages.length - 1]?.content || ''
            await supabase
                .from('messages')
                .insert({
                    conversation_id: activeConversationId,
                    role: 'user',
                    content: userContent,
                })
        }

        // --- BUILD SYSTEM PROMPT ---
        const systemPrompt = `You are "Shaista" (شائستہ), an elegant, polite, and sophisticated AI assistant for Urdu speakers.

CRITICAL LANGUAGE RULES:
- You MUST primarily respond in **Urdu script (اردو)** - this is your default mode.
- Use beautiful, formal Urdu with proper vocabulary and grammar.
- Only use Roman Urdu if the user explicitly writes in Roman Urdu first.
- You may include English technical terms when necessary, but wrap explanations in Urdu.
- Your tone should be refined, cultured, and "shaista" (elegant/polished).

PERSONALITY:
- Be warm yet dignified - like a learned host welcoming a guest.
- Use respectful forms of address (آپ، جناب، محترم).
- Avoid overly casual or slang expressions unless the user uses them.
${isGuest ? '- Keep responses under 500 words to be concise.' : ''}
${isSuperAdmin ? '- Note: Speaking to Super Admin. Full capabilities enabled.' : ''}

Current user: ${user?.email || 'مہمان (Guest)'}
Provider: ${provider}`

        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages,
        ]

        // --- SELECT AI CLIENT ---
        let client
        if (provider === 'glm') {
            client = createGLMClient('glm-4.7-flash')
        } else if (provider === 'openrouter') {
            client = createOpenRouterClient()
        } else {
            // Fallback to GLM
            client = createGLMClient('glm-4.7-flash')
        }

        // --- STREAM RESPONSE ---
        const stream = await client.streamChat({
            messages: allMessages,
            temperature: 0.7,
        })

        // --- CAPTURE & SAVE ASSISTANT RESPONSE ---
        const decoder = new TextDecoder()
        let assistantContent = ''

        const transformStream = new TransformStream({
            transform(chunk, controller) {
                const decoded = decoder.decode(chunk, { stream: true })

                // Capture content for DB
                const lines = decoded.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim()
                        if (data !== '[DONE]') {
                            try {
                                const json = JSON.parse(data)
                                if (json.content) {
                                    assistantContent += json.content
                                }
                            } catch { }
                        }
                    }
                }
                controller.enqueue(chunk)
            },
            async flush() {
                // Save assistant message when stream completes
                if (user && activeConversationId && assistantContent) {
                    try {
                        await supabase
                            .from('messages')
                            .insert({
                                conversation_id: activeConversationId,
                                role: 'assistant',
                                content: assistantContent,
                            })

                        // Update conversation title if first exchange
                        await supabase
                            .from('conversations')
                            .update({
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', activeConversationId)

                        // Mark queue as completed
                        await supabase
                            .from('request_queue')
                            .update({ status: 'completed', updated_at: new Date().toISOString() })
                            .eq('user_id', user.id)
                            .eq('status', 'processing')
                            .order('created_at', { ascending: false })
                            .limit(1)

                    } catch (err) {
                        console.error('Failed to save assistant message:', err)
                    }
                } else if (user) {
                    // Mark as failed if empty response
                    await supabase
                        .from('request_queue')
                        .update({ status: 'failed', updated_at: new Date().toISOString() })
                        .eq('user_id', user.id)
                        .eq('status', 'processing')
                        .order('created_at', { ascending: false })
                        .limit(1)
                }
            }
        })

        return new Response(stream.pipeThrough(transformStream), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Conversation-Id': activeConversationId || '',
            },
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(
            JSON.stringify({ error: `خطا: ${error instanceof Error ? error.message : String(error)}` }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}
