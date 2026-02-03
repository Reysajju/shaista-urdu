import { createGeminiClient } from '@/lib/ai/gemini-client'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { prompt, framework = 'react' } = await req.json()

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: 'Prompt is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const systemPrompt = `You are an expert ${framework} component generator. 
Generate a single, self-contained React component based on the user's description.
Use Tailwind CSS for styling.
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"component": "// Your React component code here as a string", "dependencies": ["list", "of", "npm", "packages", "if", "needed"]}`

        const gemini = createGeminiClient()
        const response = await gemini.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Create a ${framework} component: ${prompt}` },
            ],
            temperature: 0.7,
        })

        // Parse the response as JSON
        let result
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0])
            } else {
                result = { component: response, dependencies: [] }
            }
        } catch {
            // If parsing fails, wrap the response
            result = { component: response, dependencies: [] }
        }

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Generate component error:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to generate component' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
