'use client'

import { useState, useEffect } from 'react'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes to maintain session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex h-screen bg-[#141B2D] items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#A68A56] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#141B2D] text-[#E0DCD3] overflow-hidden selection:bg-[#A68A56]/30">
      {/* Sidebar - Integrated with Old Money Theme */}
      <Sidebar
        user={user}
        selectedConversationId={selectedConversationId}
        onSelectConversation={(id) => {
          setSelectedConversationId(id)
        }}
        onNewChat={() => {
          setSelectedConversationId(null)
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative pt-16 md:pt-0">
        {/* Grain/Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        {/* Header - Refined (Hidden on mobile as we have the hamburger header) */}
        <header className="hidden md:flex h-20 border-b border-[#A68A56]/20 items-center justify-between px-8 bg-[#1E2638]/60 backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-start">
              <h1 className="text-3xl font-serif font-bold text-[#A68A56] tracking-tighter leading-none">
                SHAISTA
              </h1>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#8A8680] mt-1">
                Polished Intelligence
              </span>
            </div>
            <div className="h-8 w-[1px] bg-[#A68A56]/20 mx-2"></div>
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-[10px] font-medium border border-[#A68A56]/30 px-2 py-0.5 rounded text-[#A68A56]">URDU NATIVE</span>
              <span className="text-[10px] font-medium border border-[#A68A56]/30 px-2 py-0.5 rounded text-[#A68A56]">SECURE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!user ? (
              <div className="flex items-center gap-6">
                <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-[#8A8680]">Limited Client Access</span>
                <Link href="/login" className="px-5 py-2.5 border border-[#A68A56] text-[#A68A56] hover:bg-[#A68A56] hover:text-[#141B2D] transition-all duration-500 font-serif rounded-lg text-sm font-bold shadow-lg shadow-[#A68A56]/10">
                  Enter The Study
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs font-serif text-[#E0DCD3]">{user.email?.split('@')[0]}</span>
                  <span className="text-[9px] text-[#A68A56] uppercase tracking-tighter">Premium Member</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1E2638] border border-[#A68A56]/40 flex items-center justify-center text-[#A68A56] font-serif hover:border-[#A68A56] transition-colors cursor-pointer">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          <div className="flex-1 bg-[#141B2D]">
            <ChatPanel
              isGuest={!user}
              conversationId={selectedConversationId}
              onConversationCreated={(id) => setSelectedConversationId(id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
