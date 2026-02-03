'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface ChatPanelProps {
    isGuest?: boolean
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

// Old Money Dark Palette (The Study)
const colors = {
    background: '#141B2D',      // Oxford Blue
    surface: '#1E2638',         // Charcoal Slate
    surfaceHover: '#252F45',    // Lighter slate for hover
    text: '#E0DCD3',            // Soft Bone
    textMuted: '#8A8680',       // Muted text
    accent1: '#3E5242',         // Deep Forest
    accent2: '#A68A56',         // Antique Brass
    border: '#2A3548',          // Subtle border
}

export function ChatPanel({
    isGuest = false,
    conversationId: initialConversationId,
    onConversationCreated
}: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [localConversationId, setLocalConversationId] = useState<string | null>(initialConversationId)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const supabase = createClient()

    // Model selection state
    const [provider, setProvider] = useState<'gemini' | 'glm' | 'openrouter'>('glm')
    const [model, setModel] = useState('glm-4.7-flash')

    // Guest tracking
    const [guestCount, setGuestCount] = useState(0)
    const [showLimitModal, setShowLimitModal] = useState(false)

    // Sync local ID with prop ID (for history selection)
    useEffect(() => {
        setLocalConversationId(initialConversationId)
        if (initialConversationId) {
            loadHistory(initialConversationId)
        } else {
            setMessages([])
        }
    }, [initialConversationId])

    const loadHistory = async (id: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setMessages(data.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content
            })))
        }
        setIsLoading(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (isGuest) {
            const count = parseInt(localStorage.getItem('shaista_guest_count') || '0')
            setGuestCount(count)
        }
    }, [isGuest])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
        }
    }, [input])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        if (isGuest && guestCount >= 2) {
            setShowLimitModal(true)
            return
        }

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        if (isGuest) {
            const newCount = guestCount + 1
            setGuestCount(newCount)
            localStorage.setItem('shaista_guest_count', newCount.toString())
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    conversationId: localConversationId,
                    isGuest,
                    provider,
                    model,
                }),
            })

            // Capture Conversation ID from header
            const newConvId = response.headers.get('X-Conversation-Id')
            if (newConvId && newConvId !== localConversationId) {
                setLocalConversationId(newConvId)
                onConversationCreated(newConvId)
            }

            if (response.status === 429) {
                const errorData = await response.json()
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}-limit`,
                        role: 'assistant',
                        content: errorData.error || 'روزانہ کی حد ختم ہو گئی۔',
                    },
                ])
                return
            }

            if (response.status === 202) {
                const queueData = await response.json()
                const waitTime = queueData.waitTime || 10
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}-queue`,
                        role: 'assistant',
                        content: `⏳ آپ قطار میں ہیں۔ تخمینی انتظار: ${waitTime} سیکنڈ۔ براہ کرم دوبارہ کوشش کریں۔`,
                    },
                ])
                setIsLoading(false)
                return
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
                throw new Error(errorData.error || 'Chat request failed')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader')

            const assistantMessage: Message = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: '',
            }
            setMessages((prev) => [...prev, assistantMessage])

            const decoder = new TextDecoder()
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
                            if (json.content) {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantMessage.id
                                            ? { ...m, content: m.content + json.content }
                                            : m
                                    )
                                )
                            }
                        } catch {
                            // Skip
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Chat error:', error)
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-${Date.now()}-error`,
                    role: 'assistant',
                    content: `⚠️ معذرت، رابطہ میں مسئلہ پیش آ گیا: ${error.message}`,
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b shrink-0"
                style={{ borderColor: `${colors.accent2}20`, backgroundColor: `${colors.surface}80`, backdropFilter: 'blur(10px)' }}
            >
                <div className="flex items-center gap-2 md:gap-4">
                    <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-serif text-lg md:text-xl border shadow-sm"
                        style={{ backgroundColor: colors.surface, color: colors.accent2, borderColor: `${colors.accent2}40` }}
                    >
                        ش
                    </div>
                    <div className="flex flex-col">
                        <span className="font-serif text-base md:text-lg font-bold leading-tight" style={{ color: colors.text }}>شائستہ</span>
                        <span className="text-[8px] md:text-[10px] uppercase tracking-widest" style={{ color: colors.textMuted }}>Premium AI</span>
                    </div>
                </div>

                {/* Model Selector */}
                <div className="flex items-center gap-1 bg-[#141B2D]/50 p-1 rounded-lg border border-[#A68A56]/20">
                    <button
                        onClick={() => { setProvider('glm'); setModel('glm-4.7-flash') }}
                        className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-serif transition-all duration-300 ${provider === 'glm' ? 'shadow-sm' : ''
                            }`}
                        style={{
                            backgroundColor: provider === 'glm' ? colors.accent2 : 'transparent',
                            color: provider === 'glm' ? colors.background : colors.textMuted,
                        }}
                    >
                        GLM
                    </button>
                    <button
                        onClick={() => { setProvider('openrouter'); setModel('google/gemini-2.0-flash-exp:free') }}
                        className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-serif transition-all duration-300 relative ${provider === 'openrouter' ? 'shadow-sm' : ''
                            }`}
                        style={{
                            backgroundColor: provider === 'openrouter' ? '#9F7AEA' : 'transparent',
                            color: provider === 'openrouter' ? colors.background : colors.textMuted,
                        }}
                    >
                        <span className="hidden xs:inline">شائستہ </span>Beta
                        {!provider.includes('openrouter') && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span></span>}
                    </button>
                </div>
            </div>

            {/* Messages Area - ChatGPT Style */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
                {messages.length === 0 ? (
                    // Empty State
                    <div className="min-h-full flex flex-col items-center justify-center text-center px-4 py-12 space-y-6 md:space-y-8">
                        <div className="relative">
                            <div
                                className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center font-serif text-3xl md:text-5xl border-2 rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default"
                                style={{ backgroundColor: colors.surface, color: colors.accent2, borderColor: `${colors.accent2}60`, boxShadow: `0 10px 20px -5px ${colors.accent2}20` }}
                            >
                                ش
                            </div>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight px-4" style={{ color: colors.text }}>
                                آداب! میں آپ کی کیا مدد کر سکتی ہوں؟
                            </h1>
                            <p className="text-sm md:text-lg max-w-lg mx-auto font-light leading-relaxed px-6" style={{ color: colors.textMuted }}>
                                شائستہ اردو زبان کا ایک نفیس اور ذہین ماڈل ہے، جو آپ کے ہر سوال کا جواب انتہائی شائستگی سے دینے کی صلاحیت رکھتا ہے۔
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-xl w-full pt-4 md:pt-8 px-4">
                            {[
                                "ایک نظم لکھیں",
                                "تاریخِ اردو بتائیں",
                                "خط لکھنے میں مدد کریں",
                                "سائنس کے بارے میں پوچھیں"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    className="p-3 md:p-4 rounded-xl border text-xs md:text-sm font-serif transition-all text-right hover:scale-[1.02]"
                                    style={{ backgroundColor: `${colors.surface}40`, borderColor: `${colors.accent2}20`, color: colors.text }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages - ChatGPT Style
                    <div className="pb-32 md:pb-40 pt-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    backgroundColor: message.role === 'assistant' ? `${colors.surface}30` : 'transparent',
                                }}
                                className="group transition-colors duration-300"
                            >
                                <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
                                    <div className="flex gap-4 md:gap-6 items-start">
                                        {/* Avatar */}
                                        <div
                                            className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 text-sm md:text-base shadow-lg border transition-transform group-hover:scale-110"
                                            style={{
                                                backgroundColor: message.role === 'assistant' ? colors.surface : colors.accent1,
                                                color: message.role === 'assistant' ? colors.accent2 : colors.text,
                                                borderColor: message.role === 'assistant' ? `${colors.accent2}40` : 'transparent',
                                            }}
                                        >
                                            {message.role === 'assistant' ? 'ش' : (
                                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-0 md:pt-1">
                                            <div
                                                className="text-[10px] font-serif uppercase tracking-widest mb-2 md:mb-3 opacity-60"
                                                style={{ color: colors.textMuted }}
                                            >
                                                {message.role === 'assistant' ? 'شائستہ' : 'آپ'}
                                            </div>
                                            <div
                                                className="text-base md:text-lg leading-[1.7] md:leading-[1.8] font-light"
                                                style={{ color: colors.text, direction: 'rtl', textAlign: 'right' }}
                                            >
                                                <div className="whitespace-pre-wrap m-0 font-serif overflow-hidden break-words">{message.content}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-w-3xl mx-auto px-4 h-[1px]" style={{ backgroundColor: `${colors.accent2}08` }}></div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div style={{ backgroundColor: `${colors.surface}30` }}>
                                <div className="max-w-3xl mx-auto px-4 py-8">
                                    <div className="flex gap-4 md:gap-6 items-start">
                                        <div
                                            className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 text-sm md:text-base animate-pulse border"
                                            style={{ backgroundColor: colors.surface, color: colors.accent2, borderColor: `${colors.accent2}40` }}
                                        >
                                            ش
                                        </div>
                                        <div className="flex-1 pt-0 md:pt-1">
                                            <div className="text-[10px] font-serif uppercase tracking-widest mb-3 md:mb-4 opacity-60" style={{ color: colors.textMuted }}>شائستہ</div>
                                            <div className="flex gap-1.5 md:gap-2">
                                                <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-bounce" style={{ backgroundColor: colors.accent2, animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-bounce" style={{ backgroundColor: colors.accent2, animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-bounce" style={{ backgroundColor: colors.accent2, animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area - ChatGPT Style (Centered, floating) */}
            <div
                className="absolute bottom-0 left-0 right-0 px-2 md:px-4 pb-4 md:pb-8 shrink-0"
                style={{
                    background: `linear-gradient(transparent, ${colors.background} 40%)`,
                    paddingTop: '2rem md:4rem',
                }}
            >
                <div className="max-w-3xl mx-auto relative group">
                    <form onSubmit={handleSubmit} className="relative">
                        <div
                            className="flex items-end gap-2 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl transition-all duration-300 focus-within:ring-1"
                            style={{
                                backgroundColor: colors.surface,
                                border: `1px solid ${colors.accent2}60`,
                                boxShadow: `0 10px 40px -10px #000`,
                            }}
                        >
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="شائستہ کے ساتھ گفتگو شروع کریں..."
                                disabled={isLoading}
                                rows={1}
                                dir="rtl"
                                className="flex-1 bg-transparent resize-none outline-none text-sm md:text-base py-1.5 md:py-2 px-2 md:px-3 min-h-[24px] md:min-h-[28px] max-h-[150px] md:max-h-[200px] font-serif"
                                style={{ color: colors.text }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 disabled:opacity-20 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                                style={{
                                    backgroundColor: input.trim() ? colors.accent2 : `${colors.accent2}20`,
                                    color: colors.background,
                                }}
                            >
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-center text-[8px] md:text-[10px] mt-2 md:mt-3 uppercase tracking-[0.2em] font-medium" style={{ color: colors.textMuted }}>
                            Shaista reflects polished intelligence. <span className="opacity-50">Confirm vital facts.</span>
                        </p>
                    </form>
                </div>
            </div>

            {/* Guest Limit Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div
                        className="p-8 max-w-sm w-full rounded-2xl text-center space-y-6 shadow-2xl scale-in-center"
                        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.accent2}40` }}
                    >
                        <div className="text-5xl rotate-12" style={{ color: colors.accent2 }}>❖</div>
                        <h3 className="text-2xl font-serif font-bold" style={{ color: colors.text }}>حد ختم</h3>
                        <p className="text-base font-light leading-relaxed" style={{ color: colors.textMuted, direction: 'rtl' }}>
                            بطور مہمان، آپ کی خدمات کے معیار کو برقرار رکھنے کے لیے آپ کو صرف 2 سوالات تک محدود رکھا گیا ہے۔
                        </p>
                        <div className="flex flex-col gap-3 pt-4">
                            <a
                                href="/login"
                                className="px-6 py-3 rounded-xl text-base font-serif font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                style={{ backgroundColor: colors.accent2, color: colors.background, boxShadow: `0 10px 20px -5px ${colors.accent2}40` }}
                            >
                                لاگ ان کریں
                            </a>
                            <a
                                href="/signup"
                                className="px-6 py-3 rounded-xl text-base font-serif transition-colors hover:bg-[#A68A5610]"
                                style={{ border: `1px solid ${colors.accent2}`, color: colors.accent2 }}
                            >
                                نیا اکاؤنٹ بنائیں
                            </a>
                        </div>
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                            style={{ color: colors.textMuted }}
                        >
                            بند کریں
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
