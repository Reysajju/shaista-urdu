'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Collaborator {
    user_id: string
    cursor: { x: number; y: number }
    selection?: string
}

interface UseRealtimeProjectOptions {
    onCollaboratorsChange?: (collaborators: Collaborator[]) => void
    onContentChange?: (payload: unknown) => void
}

export function useRealtimeProject(
    projectId: string | null,
    options: UseRealtimeProjectOptions = {}
) {
    const { onCollaboratorsChange, onContentChange } = options

    useEffect(() => {
        if (!projectId) return

        const supabase = createClient()
        let channel: RealtimeChannel | null = null

        const setupChannel = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            channel = supabase.channel(`project:${projectId}`, {
                config: { presence: { key: user.id } },
            })

            // Subscribe to database changes
            channel
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'projects',
                        filter: `id=eq.${projectId}`,
                    },
                    (payload) => {
                        onContentChange?.(payload)
                    }
                )
                .on('presence', { event: 'sync' }, () => {
                    const state = channel?.presenceState() || {}
                    const collaborators: Collaborator[] = Object.values(state)
                        .flat()
                        .map((p) => {
                            const presence = p as Record<string, unknown>
                            return {
                                user_id: String(presence.user_id || ''),
                                cursor: (presence.cursor as { x: number; y: number }) || { x: 0, y: 0 },
                                selection: presence.selection as string | undefined,
                            }
                        })
                    onCollaboratorsChange?.(collaborators)
                })
                .subscribe()
        }

        setupChannel()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [projectId, onCollaboratorsChange, onContentChange])

    const broadcastCursor = useCallback(
        (cursor: { x: number; y: number }, selection?: string) => {
            if (!projectId) return

            const supabase = createClient()
            const channel = supabase.channel(`project:${projectId}`)

            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    channel.track({
                        user_id: user.id,
                        cursor,
                        selection,
                    })
                }
            })
        },
        [projectId]
    )

    return { broadcastCursor }
}
