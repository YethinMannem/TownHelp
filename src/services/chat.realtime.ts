'use client'

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
}

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 * Listens for INSERT events on the messages table filtered by conversation_id.
 *
 * Returns a channel reference — call unsubscribe() to clean up.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: RealtimeMessage) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as RealtimeMessage)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a Realtime channel.
 * Call this on component unmount to prevent memory leaks.
 */
export function unsubscribeFromMessages(channel: RealtimeChannel): void {
  const supabase = createClient()
  supabase.removeChannel(channel)
}
