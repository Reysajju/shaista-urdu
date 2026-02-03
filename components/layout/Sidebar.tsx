'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface SidebarProps {
    activeTab: 'builder' | 'chat' | 'research'
    setActiveTab: (tab: 'builder' | 'chat' | 'research') => void
    user: any
    selectedConversationId: string | null
    onSelectConversation: (id: string) => void
    onNewChat: () => void
}

export function Sidebar({
    activeTab,
    setActiveTab,
    user,
    selectedConversationId,
    onSelectConversation,
    onNewChat
}: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const tabs = [
        { id: 'chat' as const, icon: '✦', label: 'Consult' },
        { id: 'research' as const, icon: '∞', label: 'Research' },
        { id: 'builder' as const, icon: '∆', label: 'Canvas' },
    ]

    useEffect(() => {
        if (user && isExpanded) {
            loadConversations()
        }
    }, [user, isExpanded])

    const loadConversations = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setConversations(data)
        }
        setLoading(false)
    }

    return (
        <aside
            className={`h-screen bg-[#1E2638] border-r border-[#A68A56]/10 flex flex-col transition-all duration-510 ease-in-out z-30 group shadow-2xl ${isExpanded ? 'w-64' : 'w-20'
                }`}
        >
            {/* Toggle Button / Logo Area */}
            <div className="p-4 flex items-center justify-between border-b border-[#A68A56]/05">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-12 h-12 rounded-xl border border-[#A68A56]/20 flex items-center justify-center hover:bg-[#A68A56]/10 transition-all shadow-lg active:scale-95"
                >
                    <span className="text-2xl font-serif font-bold text-[#A68A56]">ش</span>
                </button>
                {isExpanded && (
                    <button
                        onClick={onNewChat}
                        className="p-2.5 rounded-lg bg-[#A68A56] text-[#141B2D] hover:bg-[#C5A059] transition-transform active:scale-90 shadow-xl"
                        title="New Chat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Main Tabs */}
            <nav className="p-3 flex flex-col gap-2 border-b border-[#A68A56]/05">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            w-full p-3 rounded-xl flex items-center transition-all duration-300 relative overflow-hidden group/btn
                            ${activeTab === tab.id
                                ? 'bg-[#A68A56] text-[#141B2D] shadow-lg shadow-[#A68A56]/20'
                                : 'text-[#8A8680] hover:bg-[#A68A56]/05 hover:text-[#E0DCD3]'
                            }
                        `}
                    >
                        <span className="text-xl font-serif w-8 flex-shrink-0 text-center">
                            {tab.icon}
                        </span>
                        {isExpanded && (
                            <span className="ml-3 text-sm font-serif font-bold tracking-widest uppercase animate-in slide-in-from-left-4 fade-in duration-500">
                                {tab.label}
                            </span>
                        )}
                        {!isExpanded && (
                            <div className="absolute left-16 bg-[#141B2D] text-[#A68A56] p-2 rounded-md text-[10px] uppercase font-bold tracking-widest invisible group-hover/btn:visible opacity-0 group-hover/btn:opacity-100 transition-all border border-[#A68A56]/30 shadow-2xl z-50 whitespace-nowrap translate-x-4 group-hover/btn:translate-x-0">
                                {tab.label}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Chat History List */}
            {isExpanded && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#A68A56]/20">
                    <div className="px-2 py-4 text-[10px] uppercase tracking-[0.3em] text-[#8A8680] font-bold border-b border-[#A68A56]/10 mb-4 opacity-50 flex justify-between items-center">
                        Chat History
                        {loading && <span className="animate-spin text-lg">✦</span>}
                    </div>

                    {!user ? (
                        <div className="p-4 text-center space-y-4">
                            <p className="text-xs text-[#8A8680] italic">Sign in to sync your library across devices.</p>
                            <Link href="/login" className="block w-full py-2 border border-[#A68A56]/40 text-[#A68A56] text-xs font-serif rounded-lg hover:bg-[#A68A56]/10 transition-colors">
                                Authenticate
                            </Link>
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-xs text-[#8A8680] py-10 opacity-40">Empty Journal</p>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`
                                    w-full p-3 rounded-lg text-left transition-all duration-300 border border-transparent flex flex-col gap-1
                                    ${selectedConversationId === conv.id
                                        ? 'bg-[#141B2D] border-[#A68A56]/30 shadow-sm'
                                        : 'hover:bg-[#141B2D]/40'
                                    }
                                `}
                            >
                                <span className={`text-[13px] font-serif truncate ${selectedConversationId === conv.id ? 'text-[#A68A56]' : 'text-[#E0DCD3]'}`} dir="rtl">
                                    {conv.title || 'Urdu Discourse...'}
                                </span>
                                <span className="text-[9px] text-[#8A8680] uppercase tracking-tighter">
                                    {new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* EthicalAds Placement */}
            {isExpanded && (
                <div className="p-3 mt-auto">
                    <div
                        className="rounded-xl border border-[#A68A56]/20 bg-[#141B2D]/40 p-2 overflow-hidden transition-all hover:border-[#A68A56]/40 shadow-inner group/ad"
                    >
                        <div
                            className="horizontal"
                            data-ea-publisher="shaista"
                            data-ea-type="image"
                            data-ea-style="hex"
                            id="ethical-ad-placement"
                        ></div>
                        <div className="text-[8px] uppercase tracking-[0.2em] text-[#8A8680] text-center mt-2 opacity-30 group-hover/ad:opacity-60 transition-opacity">
                            Supported Intelligence
                        </div>
                    </div>
                </div>
            )}

            {/* User Footer */}
            <div className="mt-auto p-4 border-t border-[#A68A56]/10 bg-[#141B2D]/20">
                <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-10 h-10 rounded-xl bg-[#141B2D] border border-[#A68A56]/20 flex items-center justify-center text-[#A68A56] font-serif shadow-inner hover:border-[#A68A56] transition-colors cursor-pointer group-hover:scale-105">
                        {user?.email?.[0].toUpperCase() || '?'}
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-serif text-[#E0DCD3] truncate">{user?.email?.split('@')[0] || 'Guest Client'}</span>
                            <span className="text-[9px] text-[#A68A56] uppercase tracking-widest font-bold">{user ? 'Premium Access' : 'Trial Session'}</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
