'use client'

import { useState, useEffect } from 'react'
import { Canvas } from '@/components/builder/Canvas'
import { AIGenerateNode } from '@/components/builder/nodes/AINode'
import { useNodeStore } from '@/stores/nodeStore'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'builder' | 'chat' | 'research'>('chat')
  const { addNode } = useNodeStore()
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

  const handleAddComponent = (type: 'container' | 'text' | 'image' | 'button') => {
    const defaults = {
      container: { width: 300, height: 200 },
      text: { width: 200, height: 40 },
      image: { width: 200, height: 200 },
      button: { width: 150, height: 50 },
    }

    addNode({
      type,
      props: type === 'text' ? { content: 'New Text' } : type === 'button' ? { label: 'Button' } : {},
      position: { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 },
      size: defaults[type],
    })
  }

  if (loading) return (
    <div className="flex h-screen bg-[#141B2D] items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#A68A56] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#141B2D] text-[#E0DCD3] overflow-hidden selection:bg-[#A68A56]/30">
      {/* Sidebar - Integrated with Old Money Theme */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        selectedConversationId={selectedConversationId}
        onSelectConversation={(id) => {
          setSelectedConversationId(id)
          setActiveTab('chat')
        }}
        onNewChat={() => {
          setSelectedConversationId(null)
          setActiveTab('chat')
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Grain/Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        {/* Header - Refined */}
        <header className="h-20 border-b border-[#A68A56]/20 flex items-center justify-between px-8 bg-[#1E2638]/60 backdrop-blur-xl relative z-20">
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
            <div className="hidden md:flex items-center gap-4">
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
        <div className="flex-1 flex overflow-hidden relative z-10">
          {activeTab === 'builder' && (
            <>
              {/* Components Panel */}
              <div className="w-80 border-r border-[#A68A56]/10 p-6 space-y-8 overflow-y-auto bg-[#1E2638]/40 backdrop-blur-sm">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#A68A56] mb-8 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-[#A68A56]"></span>
                    Workshop
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['container', 'text', 'image', 'button'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleAddComponent(type)}
                        className="p-5 rounded-xl bg-[#141B2D] hover:bg-[#A68A56] border border-[#A68A56]/10 hover:border-transparent transition-all duration-300 group flex flex-col items-center gap-3 shadow-sm hover:shadow-xl hover:shadow-[#A68A56]/10"
                      >
                        <div className="text-2xl text-[#8A8680] group-hover:text-[#141B2D] transition-colors font-serif">
                          {type === 'container' && '▣'}
                          {type === 'text' && 'T'}
                          {type === 'image' && '▨'}
                          {type === 'button' && '⏍'}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8680] group-hover:text-[#141B2D]">
                          {type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-[#A68A56]/10">
                  <AIGenerateNode />
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-8 bg-[#141B2D] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#A68A56 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
                <div className="h-full rounded-2xl border border-[#A68A56]/10 shadow-inner bg-[#1E2638]/20 flex items-center justify-center">
                  <Canvas />
                </div>
              </div>
            </>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 bg-[#141B2D]">
              <ChatPanel
                isGuest={!user}
                conversationId={selectedConversationId}
                onConversationCreated={(id) => setSelectedConversationId(id)}
              />
            </div>
          )}

          {activeTab === 'research' && (
            <div className="flex-1 p-16 bg-[#141B2D] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A68A56]/05 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="max-w-4xl mx-auto space-y-16 relative z-10">
                <div className="text-center space-y-8">
                  <div className="text-7xl text-[#A68A56] font-serif italic tracking-tighter">
                    Academic Center
                  </div>
                  <p className="text-xl text-[#8A8680] font-light tracking-wide max-w-2xl mx-auto leading-relaxed border-x border-[#A68A56]/20 px-8 py-2">
                    Engage with Shaista for in-depth scholarly analysis, synthesis of complex thought, and verified citations.
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="relative group">
                    <textarea
                      placeholder="What shall we explore today?"
                      className="w-full h-48 p-8 rounded-2xl bg-[#1E2638] border border-[#A68A56]/20 focus:border-[#A68A56] transition-all duration-500 focus:outline-none resize-none font-serif text-xl placeholder-[#8A8680]/40 shadow-2xl"
                    />
                    <div className="absolute bottom-6 right-6 flex gap-2">
                      <span className="text-[10px] text-[#8A8680] uppercase tracking-widest bg-[#141B2D] px-3 py-1 rounded-full border border-[#A68A56]/10">Deep Analysis</span>
                    </div>
                  </div>
                  <button className="w-full py-5 rounded-2xl bg-[#A68A56] text-[#141B2D] font-serif font-bold text-lg uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all duration-300 shadow-2xl shadow-[#A68A56]/20 transform active:scale-[0.99] hover:translate-y-[-2px]">
                    Initiate Deep Inquiry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
