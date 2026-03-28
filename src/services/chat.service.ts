import { prisma } from '@/lib/prisma'
import type {
  ConversationItem,
  MessageItem,
  SendMessageResult,
} from '@/types'

const MESSAGE_PAGE_SIZE = 50
const MAX_MESSAGE_LENGTH = 2000

// =============================================================================
// Get Conversations
// =============================================================================

export async function getConversations(userId: string): Promise<ConversationItem[]> {
  // Find all conversations where user is requester or provider
  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId, deletedAt: null },
    select: { id: true },
  })

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { requesterId: userId },
        ...(providerProfile ? [{ providerId: providerProfile.id }] : []),
      ],
    },
    select: {
      id: true,
      requesterId: true,
      lastMessageAt: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          requester: {
            select: { fullName: true },
          },
          category: {
            select: { name: true, iconName: true },
          },
        },
      },
      provider: {
        select: {
          displayName: true,
          userId: true,
        },
      },
      messages: {
        select: { content: true, createdAt: true, senderId: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
  })

  return conversations.map((c) => {
    const isRequester = c.requesterId === userId
    const lastMsg = c.messages[0] ?? null

    return {
      id: c.id,
      bookingId: c.booking.id,
      bookingNumber: c.booking.bookingNumber,
      bookingStatus: c.booking.status,
      categoryName: c.booking.category.name,
      categoryIcon: c.booking.category.iconName,
      otherPartyName: isRequester
        ? c.provider.displayName
        : c.booking.requester.fullName,
      lastMessage: lastMsg
        ? lastMsg.content.length > 100
          ? lastMsg.content.slice(0, 100) + '...'
          : lastMsg.content
        : null,
      lastMessageAt: c.lastMessageAt ?? c.createdAt,
      unreadCount: c._count.messages,
    }
  })
}

// =============================================================================
// Get Messages (cursor-based pagination)
// =============================================================================

export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string
): Promise<{ messages: MessageItem[]; nextCursor: string | null }> {
  // Validate user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      requesterId: true,
      provider: { select: { userId: true } },
    },
  })

  if (!conversation) {
    throw new Error('CONVERSATION_NOT_FOUND')
  }

  const isParticipant =
    conversation.requesterId === userId ||
    conversation.provider.userId === userId

  if (!isParticipant) {
    throw new Error('NOT_A_PARTICIPANT')
  }

  // Fetch messages: newest first, then reverse for display order
  // Cursor is a message ID to avoid timestamp collision issues
  const messages = await prisma.message.findMany({
    where: { conversationId },
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    select: {
      id: true,
      senderId: true,
      content: true,
      messageType: true,
      isRead: true,
      createdAt: true,
      sender: {
        select: { fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: MESSAGE_PAGE_SIZE + 1, // +1 to check if there's a next page
  })

  const hasMore = messages.length > MESSAGE_PAGE_SIZE
  const pageMessages = hasMore ? messages.slice(0, MESSAGE_PAGE_SIZE) : messages

  // Reverse to ascending order for display
  const ascending = pageMessages.reverse()

  const nextCursor = hasMore
    ? ascending[0].id
    : null

  return {
    messages: ascending.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      content: m.content,
      messageType: m.messageType,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isMine: m.senderId === userId,
    })),
    nextCursor,
  }
}

// =============================================================================
// Send Message
// =============================================================================

export async function sendMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<SendMessageResult> {
  const trimmed = content.trim()

  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' }
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` }
  }

  // Validate user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      requesterId: true,
      provider: { select: { userId: true } },
    },
  })

  if (!conversation) {
    return { success: false, error: 'Conversation not found.' }
  }

  const isParticipant =
    conversation.requesterId === userId ||
    conversation.provider.userId === userId

  if (!isParticipant) {
    return { success: false, error: 'You are not part of this conversation.' }
  }

  // Atomic: insert message + update lastMessageAt
  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: trimmed,
          messageType: 'TEXT',
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      })

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      })

      return created
    })

    return {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.senderId,
      },
    }
  } catch (error) {
    console.error('[sendMessage]:', error)
    return { success: false, error: 'Failed to send message. Please try again.' }
  }
}

// =============================================================================
// Mark as Read
// =============================================================================

export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  // Validate user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      requesterId: true,
      provider: { select: { userId: true } },
    },
  })

  if (!conversation) return

  const isParticipant =
    conversation.requesterId === userId ||
    conversation.provider.userId === userId

  if (!isParticipant) return

  // Mark all unread messages from the other party as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}
