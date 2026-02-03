import { createGeminiClient } from '@/lib/ai/gemini-client'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes for deep research

interface ResearchProgress {
    phase: string
    step: number
    totalSteps: number
    message: string
}

export async function POST(req: Request) {
    try {
        const { query, depth = 3, breadth = 5 } = await req.json()

        if (!query) {
            return new Response(
                JSON.stringify({ error: 'Query is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const sendProgress = (progress: ResearchProgress) => {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ progress })}\n\n`)
                    )
                }

                const gemini = createGeminiClient()

                // Phase 1: Query decomposition
                sendProgress({
                    phase: 'decomposition',
                    step: 1,
                    totalSteps: 4,
                    message: 'Breaking down your query into sub-questions...',
                })

                const decompositionPrompt = `Break down this research query into ${breadth} specific sub-questions that would help thoroughly answer it:
Query: "${query}"
Return ONLY a JSON array of strings with the sub-questions, no other text.`

                const subQueriesResponse = await gemini.chat({
                    messages: [{ role: 'user', content: decompositionPrompt }],
                })

                let subQueries: string[] = []
                try {
                    // Extract JSON from response
                    const jsonMatch = subQueriesResponse.match(/\[[\s\S]*\]/)
                    if (jsonMatch) {
                        subQueries = JSON.parse(jsonMatch[0])
                    }
                } catch {
                    subQueries = [query]
                }

                // Phase 2: Research each sub-query
                sendProgress({
                    phase: 'research',
                    step: 2,
                    totalSteps: 4,
                    message: `Researching ${subQueries.length} areas...`,
                })

                const findings: string[] = []

                for (let i = 0; i < Math.min(subQueries.length, breadth); i++) {
                    const sq = subQueries[i]
                    sendProgress({
                        phase: 'research',
                        step: 2,
                        totalSteps: 4,
                        message: `Researching: ${sq.substring(0, 50)}...`,
                    })

                    const researchResponse = await gemini.chat({
                        messages: [
                            { role: 'system', content: 'You are a research assistant. Provide detailed, factual information.' },
                            { role: 'user', content: sq },
                        ],
                    })

                    findings.push(`## ${sq}\n${researchResponse}`)
                }

                // Phase 3: Deep dive
                if (depth > 1) {
                    sendProgress({
                        phase: 'deep-dive',
                        step: 3,
                        totalSteps: 4,
                        message: 'Performing deep analysis...',
                    })

                    const deepDivePrompt = `Based on these findings, identify any gaps or areas that need deeper research:
${findings.join('\n\n')}
Return ONLY a JSON array of follow-up questions, no other text.`

                    const followUpResponse = await gemini.chat({
                        messages: [{ role: 'user', content: deepDivePrompt }],
                    })

                    try {
                        const jsonMatch = followUpResponse.match(/\[[\s\S]*\]/)
                        if (jsonMatch) {
                            const followUps = JSON.parse(jsonMatch[0])
                            for (let i = 0; i < Math.min(followUps.length, 2); i++) {
                                const fu = followUps[i]
                                const deepResponse = await gemini.chat({
                                    messages: [{ role: 'user', content: fu }],
                                })
                                findings.push(`## Deep Dive: ${fu}\n${deepResponse}`)
                            }
                        }
                    } catch {
                        // Skip if parsing fails
                    }
                }

                // Phase 4: Synthesis
                sendProgress({
                    phase: 'synthesis',
                    step: 4,
                    totalSteps: 4,
                    message: 'Synthesizing final report...',
                })

                const synthesisPrompt = `Create a comprehensive research report based on these findings.
You are "Shaista" (Shaista Ai Urdu Model). YOU MUST WRITE THE REPORT IN URDU (Urdu script).
If the user's original query was in Roman Urdu, you may use Roman Urdu, otherwise default to Urdu Script.

Original Query: "${query}"

Findings:
${findings.join('\n\n---\n\n')}

Create a well-structured report with:
1. Executive Summary (خلاصہ)
2. Key Findings (اہم دریافتیں)
3. Detailed Analysis (تفصیلی تجزیہ)
4. Conclusions (نتائج)
5. Recommendations (سفارشات)`

                const finalReport = await gemini.chat({
                    messages: [{ role: 'user', content: synthesisPrompt }],
                })

                // Send final result
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            result: {
                                query,
                                report: finalReport,
                                subQueries,
                                findingsCount: findings.length,
                            },
                        })}\n\n`
                    )
                )

                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Research API error:', error)
        return new Response(
            JSON.stringify({ error: 'Research failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
