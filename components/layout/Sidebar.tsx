'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface SidebarProps {
    user: any
    selectedConversationId: string | null
    onSelectConversation: (id: string) => void
    onNewChat: () => void
}

export function Sidebar({
    user,
    selectedConversationId,
    onSelectConversation,
    onNewChat
}: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Simplified: No more tabs for builder/research

    useEffect(() => {
        if (user && (isExpanded || isMobileOpen)) {
            loadConversations()
        }
    }, [user, isExpanded, isMobileOpen])

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

    const toggleSidebar = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(!isMobileOpen)
            setIsExpanded(true)
        } else {
            setIsExpanded(!isExpanded)
        }
    }

    return (
        <>
            {/* Mobile Hamburger Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E2638] border-b border-[#A68A56]/20 flex items-center justify-between px-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="w-10 h-10 rounded-lg border border-[#A68A56]/30 flex items-center justify-center text-[#A68A56]"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-serif font-bold text-[#A68A56] tracking-widest text-lg">SHAISTA</span>
                <button onClick={onNewChat} className="text-[#A68A56]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Backdrop for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside
                className={`
                    h-screen bg-[#1E2638] border-r border-[#A68A56]/10 flex flex-col transition-all duration-510 ease-in-out z-50 shadow-2xl
                    ${isMobileOpen ? 'translate-x-0 w-72 fixed' : '-translate-x-full fixed md:translate-x-0 md:relative'}
                    ${isExpanded ? 'md:w-56' : 'md:w-20'}
                `}
            >
                {/* Toggle Button / Logo Area */}
                <div className="p-4 flex items-center justify-between border-b border-[#A68A56]/05">
                    <button
                        onClick={toggleSidebar}
                        className="w-12 h-12 rounded-xl border border-[#A68A56]/20 flex items-center justify-center hover:bg-[#A68A56]/10 transition-all shadow-lg active:scale-95"
                    >
                        <span className="text-2xl font-serif font-bold text-[#A68A56]">ش</span>
                    </button>
                    {(isExpanded || isMobileOpen) && (
                        <div className="flex gap-2">
                            <button
                                onClick={onNewChat}
                                className="p-2.5 rounded-lg bg-[#A68A56] text-[#141B2D] hover:bg-[#C5A059] transition-transform active:scale-90 shadow-xl"
                                title="New Chat"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            {isMobileOpen && (
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="md:hidden p-2.5 text-[#8A8680]"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat History Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 py-4 flex items-center justify-between">
                        {(isExpanded || isMobileOpen) && (
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A68A56] opacity-70">Discourse History</span>
                        )}
                    </div>

                    {/* Chat History List */}
                    {(isExpanded || isMobileOpen) && (
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
                </div>

                {/* EthicalAds Placement */}
                {(isExpanded || isMobileOpen) && (
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
                    <div className={`flex items-center ${(isExpanded || isMobileOpen) ? 'gap-3' : 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-xl bg-[#141B2D] border border-[#A68A56]/20 flex items-center justify-center text-[#A68A56] font-serif shadow-inner hover:border-[#A68A56] transition-colors cursor-pointer group-hover:scale-105">
                            {user?.email?.[0].toUpperCase() || '?'}
                        </div>
                        {(isExpanded || isMobileOpen) && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-serif text-[#E0DCD3] truncate">{user?.email?.split('@')[0] || 'Guest Client'}</span>
                                <span className="text-[9px] text-[#A68A56] uppercase tracking-widest font-bold">{user ? 'Premium Access' : 'Trial Session'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside >
        </>
    )
}
