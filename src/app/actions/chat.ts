'use server'

import { revalidatePath } from 'next/cache'
import { requireAuthUser } from '@/lib/auth'
import {
  getConversations as getConversationsService,
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

export async function getMessages(
  conversationId: string,
  cursor?: string
): Promise<{ messages: MessageItem[]; nextCursor: string | null }> {
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
  const authUser = await requireAuthUser()

  const result = await sendMessageService(conversationId, authUser.id, content)
  if (result.success) {
    revalidatePath('/chat')
  }
  return result
}

export async function markConversationAsRead(
  conversationId: string
): Promise<void> {
  const authUser = await requireAuthUser()

  try {
    await markAsReadService(conversationId, authUser.id)
  } catch (error) {
    console.error('[markConversationAsRead]:', error)
  }
}
