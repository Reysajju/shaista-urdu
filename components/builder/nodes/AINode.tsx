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
        <div className="p-4 space-y-4 bg-slate-800/50 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">✨</span>
                AI Component Generator
            </h3>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the component you want to create..."
                className="w-full h-24 px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
                onClick={generateComponent}
                disabled={isLoading || !prompt.trim()}
                className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
          ${isLoading || !prompt.trim()
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-blue-500/25'
                    }
        `}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Generating...
                    </span>
                ) : (
                    'Generate with AI'
                )}
            </button>
        </div>
    )
}
