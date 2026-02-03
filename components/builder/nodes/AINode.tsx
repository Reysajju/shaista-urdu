'use client'

import { useState } from 'react'
import { useNodeStore } from '@/stores/nodeStore'

export function AIGenerateNode() {
    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { addNode } = useNodeStore()

    const generateComponent = async () => {
        if (!prompt.trim() || isLoading) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/ai/generate-component', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, framework: 'react' }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate component')
            }

            const { component } = await response.json()

            // Add the generated component as a custom node
            addNode({
                type: 'custom',
                props: {
                    code: component,
                    prompt,
                },
                position: { x: 100, y: 100 },
                size: { width: 300, height: 200 },
            })

            setPrompt('')
        } catch (error) {
            console.error('Failed to generate:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-[#141B2D]/60 backdrop-blur-md rounded-2xl border border-[#A68A56]/20 shadow-2xl">
            <h3 className="text-sm md:text-lg font-serif font-bold text-[#A68A56] flex items-center gap-2 uppercase tracking-widest">
                <span className="text-xl md:text-2xl">✨</span>
                AI Artisan
            </h3>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your architectural vision..."
                className="w-full h-24 md:h-32 px-4 py-3 bg-[#1E2638]/50 border border-[#A68A56]/10 rounded-xl text-[#E0DCD3] placeholder-[#8A8680]/40 focus:outline-none focus:border-[#A68A56] transition-all resize-none font-serif text-sm md:text-base"
            />

            <button
                onClick={generateComponent}
                disabled={isLoading || !prompt.trim()}
                className={`
                    w-full py-3 md:py-4 px-6 rounded-xl font-serif font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl
                    ${isLoading || !prompt.trim()
                        ? 'bg-[#1E2638] text-[#8A8680] border border-[#A68A56]/10 cursor-not-allowed opacity-50'
                        : 'bg-[#A68A56] text-[#141B2D] hover:bg-[#C5A059] active:scale-[0.98]'
                    }
                `}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Manifesting...
                    </span>
                ) : (
                    'Forge Component'
                )}
            </button>
        </div>
    )
}
