'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeContextType {
    user: User | null
    isConnected: boolean
    subscribe: (channelName: string, callback: (payload: unknown) => void) => RealtimeChannel
    unsubscribe: (channel: RealtimeChannel) => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({
    children,
    initialUser,
}: {
    children: ReactNode
    initialUser?: User | null
}) {
    const [user, setUser] = useState<User | null>(initialUser || null)
    const [isConnected, setIsConnected] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        // Check connection status
        const channel = supabase.channel('connection-test')
        channel
            .on('system', { event: '*' }, (status) => {
                setIsConnected(status === 'SUBSCRIBED')
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const subscribe = (channelName: string, callback: (payload: unknown) => void) => {
        const channel = supabase.channel(channelName)
        channel
            .on('postgres_changes', { event: '*', schema: 'public' }, callback)
            .subscribe()
        return channel
    }

    const unsubscribe = (channel: RealtimeChannel) => {
        supabase.removeChannel(channel)
    }

    return (
        <RealtimeContext.Provider value={{ user, isConnected, subscribe, unsubscribe }}>
            {children}
        </RealtimeContext.Provider>
    )
}

export function useRealtime() {
    const context = useContext(RealtimeContext)
    if (context === undefined) {
        throw new Error('useRealtime must be used within a RealtimeProvider')
    }
    return context
}
