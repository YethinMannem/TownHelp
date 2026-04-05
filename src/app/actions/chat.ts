'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import { isValidUUID } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getConversations as getConversationsService,
  getUnreadMessageCount as getUnreadMessageCountService,
  getMessages as getMessagesService,
  sendMessage as sendMessageService,
  markAsRead as markAsReadService,
} from '@/services/chat.service'
import type { ConversationItem, MessageItem, SendMessageResult } from '@/types'

export async function getConversations(): Promise<ConversationItem[]> {
  const authUser = await requireAuthUser()

  try {
    return await getConversationsService(authUser.id)
  } catch (error) {
    console.error('[getConversations]:', error)
    return []
  }
}

export async function getUnreadMessageCount(): Promise<number> {
  const authUser = await requireAuthUser()

  try {
    return await getUnreadMessageCountService(authUser.id)
  } catch (error) {
    console.error('[getUnreadMessageCount]:', error)
    return 0
  }
}

export async function getMessages(
  conversationId: string,
  cursor?: string
): Promise<{ messages: MessageItem[]; nextCursor: string | null }> {
  if (!isValidUUID(conversationId)) return { messages: [], nextCursor: null }
  const authUser = await requireAuthUser()

  try {
    return await getMessagesService(conversationId, authUser.id, cursor)
  } catch (error) {
    console.error('[getMessages]:', error)
    return { messages: [], nextCursor: null }
  }
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResult> {
  if (!isValidUUID(conversationId)) return { success: false, error: 'Invalid conversation.' }
  const authUser = await requireAuthUser()

  const { allowed } = checkRateLimit(`${authUser.id}:sendMessage`, {
    maxRequests: 30,
    windowMs: 60_000,
  })
  if (!allowed) return { success: false, error: 'Slow down — too many messages.' }

  const result = await sendMessageService(conversationId, authUser.id, content)
  if (result.success) {
    revalidatePath('/chat')
  }
  return result
}

export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  if (!isValidUUID(conversationId)) return
  const authUser = await requireAuthUser()

  try {
    await markAsReadService(conversationId, authUser.id)
  } catch (error) {
    console.error('[markConversationAsRead]:', error)
  }
}
