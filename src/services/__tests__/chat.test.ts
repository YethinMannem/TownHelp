import { describe, it, expect } from 'vitest'
import { prismaMock, mockTransaction } from './prisma.mock'
import { getConversations, getMessages, sendMessage, markAsRead } from '../chat.service'
import {
  REQUESTER_ID,
  PROVIDER_USER_ID,
  PROVIDER_PROFILE_ID,
  CONVERSATION_ID,
  OTHER_USER_ID,
  makeConversation,
} from './test-fixtures'

// =============================================================================
// getConversations
// =============================================================================

describe('getConversations', () => {
  it('returns mapped conversations for a requester', async () => {
    prismaMock.providerProfile.findUnique.mockResolvedValue(null)
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: 'c1',
        requesterId: REQUESTER_ID,
        lastMessageAt: new Date('2026-03-27'),
        createdAt: new Date('2026-03-26'),
        booking: {
          id: 'b1',
          bookingNumber: 'BK-001',
          status: 'CONFIRMED',
          requester: { fullName: 'Yethin' },
          category: { name: 'Electrician', iconName: 'zap' },
        },
        provider: { displayName: 'Raju Electricals', userId: PROVIDER_USER_ID },
        messages: [{ content: 'I will be there at 3pm', createdAt: new Date(), senderId: PROVIDER_USER_ID }],
        _count: { messages: 1 },
      },
    ])

    const result = await getConversations(REQUESTER_ID)

    expect(result).toHaveLength(1)
    expect(result[0].otherPartyName).toBe('Raju Electricals')
    expect(result[0].bookingNumber).toBe('BK-001')
    expect(result[0].unreadCount).toBe(1)
    expect(result[0].lastMessage).toBe('I will be there at 3pm')
  })

  it('shows requester name when user is provider', async () => {
    prismaMock.providerProfile.findUnique.mockResolvedValue({ id: PROVIDER_PROFILE_ID })
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: 'c1',
        requesterId: REQUESTER_ID,
        lastMessageAt: new Date('2026-03-27'),
        createdAt: new Date('2026-03-26'),
        booking: {
          id: 'b1',
          bookingNumber: 'BK-001',
          status: 'CONFIRMED',
          requester: { fullName: 'Yethin' },
          category: { name: 'Electrician', iconName: 'zap' },
        },
        provider: { displayName: 'Raju Electricals', userId: PROVIDER_USER_ID },
        messages: [],
        _count: { messages: 0 },
      },
    ])

    const result = await getConversations(PROVIDER_USER_ID)

    expect(result[0].otherPartyName).toBe('Yethin')
  })

  it('truncates long last messages to 100 chars', async () => {
    const longMessage = 'A'.repeat(150)

    prismaMock.providerProfile.findUnique.mockResolvedValue(null)
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: 'c1',
        requesterId: REQUESTER_ID,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        booking: {
          id: 'b1',
          bookingNumber: 'BK-001',
          status: 'CONFIRMED',
          requester: { fullName: 'Yethin' },
          category: { name: 'Electrician', iconName: null },
        },
        provider: { displayName: 'Raju', userId: PROVIDER_USER_ID },
        messages: [{ content: longMessage, createdAt: new Date(), senderId: PROVIDER_USER_ID }],
        _count: { messages: 0 },
      },
    ])

    const result = await getConversations(REQUESTER_ID)
    expect(result[0].lastMessage).toBe('A'.repeat(100) + '...')
  })

  it('returns null lastMessage when no messages exist', async () => {
    prismaMock.providerProfile.findUnique.mockResolvedValue(null)
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: 'c1',
        requesterId: REQUESTER_ID,
        lastMessageAt: null,
        createdAt: new Date('2026-03-26'),
        booking: {
          id: 'b1',
          bookingNumber: 'BK-001',
          status: 'PENDING',
          requester: { fullName: 'Yethin' },
          category: { name: 'Maid', iconName: null },
        },
        provider: { displayName: 'Lakshmi', userId: PROVIDER_USER_ID },
        messages: [],
        _count: { messages: 0 },
      },
    ])

    const result = await getConversations(REQUESTER_ID)
    expect(result[0].lastMessage).toBeNull()
    expect(result[0].lastMessageAt).toEqual(new Date('2026-03-26'))
  })
})

// =============================================================================
// getMessages
// =============================================================================

describe('getMessages', () => {
  it('returns empty when conversation not found', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(null)

    const result = await getMessages(CONVERSATION_ID, REQUESTER_ID)
    expect(result).toEqual({ messages: [], nextCursor: null })
  })

  it('returns empty when user is not a participant', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    const result = await getMessages(CONVERSATION_ID, OTHER_USER_ID)
    expect(result).toEqual({ messages: [], nextCursor: null })
  })

  it('returns messages with isMine flag in ascending order', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    prismaMock.message.findMany.mockResolvedValue([
      {
        id: 'm2',
        senderId: PROVIDER_USER_ID,
        content: 'On my way',
        messageType: 'TEXT',
        isRead: false,
        createdAt: new Date('2026-03-27T10:01:00'),
        sender: { fullName: 'Raju' },
      },
      {
        id: 'm1',
        senderId: REQUESTER_ID,
        content: 'When are you coming?',
        messageType: 'TEXT',
        isRead: true,
        createdAt: new Date('2026-03-27T10:00:00'),
        sender: { fullName: 'Yethin' },
      },
    ])

    const result = await getMessages(CONVERSATION_ID, REQUESTER_ID)

    expect(result.messages).toHaveLength(2)
    // Reversed to ascending order
    expect(result.messages[0].content).toBe('When are you coming?')
    expect(result.messages[0].isMine).toBe(true)
    expect(result.messages[1].content).toBe('On my way')
    expect(result.messages[1].isMine).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('returns nextCursor when more messages exist', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    // 51 messages = 50 page + 1 extra → hasMore = true
    const messages = Array.from({ length: 51 }, (_, i) => ({
      id: `m${i}`,
      senderId: REQUESTER_ID,
      content: `Message ${i}`,
      messageType: 'TEXT',
      isRead: true,
      createdAt: new Date(`2026-03-27T10:${String(i).padStart(2, '0')}:00`),
      sender: { fullName: 'Yethin' },
    }))

    prismaMock.message.findMany.mockResolvedValue(messages)

    const result = await getMessages(CONVERSATION_ID, REQUESTER_ID)

    expect(result.messages).toHaveLength(50)
    expect(result.nextCursor).toBeTruthy()
  })

  it('passes cursor as createdAt filter to Prisma query', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    prismaMock.message.findMany.mockResolvedValue([])

    const cursorDate = '2026-03-27T10:00:00.000Z'
    await getMessages(CONVERSATION_ID, REQUESTER_ID, cursorDate)

    expect(prismaMock.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          conversationId: CONVERSATION_ID,
          createdAt: { lt: new Date(cursorDate) },
        }),
      })
    )
  })

  it('does not include createdAt filter without cursor', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    prismaMock.message.findMany.mockResolvedValue([])

    await getMessages(CONVERSATION_ID, REQUESTER_ID)

    const callArgs = prismaMock.message.findMany.mock.calls[0][0]
    expect(callArgs.where).toEqual({ conversationId: CONVERSATION_ID })
  })
})

// =============================================================================
// sendMessage
// =============================================================================

describe('sendMessage', () => {
  it('rejects empty message', async () => {
    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, '   ')
    expect(result).toEqual({ success: false, error: 'Message cannot be empty.' })
  })

  it('rejects message over 2000 characters', async () => {
    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, 'A'.repeat(2001))
    expect(result).toEqual({ success: false, error: 'Message cannot exceed 2000 characters.' })
  })

  it('accepts message at exactly 2000 characters', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    const tx = mockTransaction()
    tx.message.create.mockResolvedValue({
      id: 'msg', content: 'A'.repeat(2000), createdAt: new Date(), senderId: REQUESTER_ID,
    })
    tx.conversation.update.mockResolvedValue({})

    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, 'A'.repeat(2000))
    expect(result.success).toBe(true)
  })

  it('rejects when conversation not found', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(null)

    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, 'Hello')
    expect(result).toEqual({ success: false, error: 'Conversation not found.' })
  })

  it('rejects non-participant', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    const result = await sendMessage(CONVERSATION_ID, OTHER_USER_ID, 'Hello')
    expect(result).toEqual({ success: false, error: 'You are not part of this conversation.' })
  })

  it('trims content before saving', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    const tx = mockTransaction()
    tx.message.create.mockResolvedValue({
      id: 'msg-uuid',
      content: 'Hello provider',
      createdAt: new Date('2026-03-27'),
      senderId: REQUESTER_ID,
    })
    tx.conversation.update.mockResolvedValue({})

    await sendMessage(CONVERSATION_ID, REQUESTER_ID, '  Hello provider  ')

    expect(tx.message.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: 'Hello provider',
      }),
      select: expect.any(Object),
    })
  })

  it('creates message and updates lastMessageAt atomically', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    const createdMessage = {
      id: 'msg-uuid',
      content: 'Hello',
      createdAt: new Date('2026-03-27'),
      senderId: REQUESTER_ID,
    }

    const tx = mockTransaction()
    tx.message.create.mockResolvedValue(createdMessage)
    tx.conversation.update.mockResolvedValue({})

    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, 'Hello')

    expect(result.success).toBe(true)
    expect(result.message).toEqual(createdMessage)

    // Verify uses tx, not prisma
    expect(tx.message.create).toHaveBeenCalled()
    expect(prismaMock.message.create).not.toHaveBeenCalled()

    expect(tx.conversation.update).toHaveBeenCalledWith({
      where: { id: CONVERSATION_ID },
      data: { lastMessageAt: createdMessage.createdAt },
    })
  })

  it('handles transaction failure', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    prismaMock.$transaction.mockRejectedValue(new Error('DB error'))

    const result = await sendMessage(CONVERSATION_ID, REQUESTER_ID, 'Hello')
    expect(result).toEqual({ success: false, error: 'Failed to send message. Please try again.' })
  })
})

// =============================================================================
// markAsRead
// =============================================================================

describe('markAsRead', () => {
  it('does nothing when conversation not found', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(null)

    await markAsRead(CONVERSATION_ID, REQUESTER_ID)
    expect(prismaMock.message.updateMany).not.toHaveBeenCalled()
  })

  it('does nothing when user is not a participant', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())

    await markAsRead(CONVERSATION_ID, OTHER_USER_ID)
    expect(prismaMock.message.updateMany).not.toHaveBeenCalled()
  })

  it('marks unread messages from other party as read', async () => {
    prismaMock.conversation.findUnique.mockResolvedValue(makeConversation())
    prismaMock.message.updateMany.mockResolvedValue({ count: 3 })

    await markAsRead(CONVERSATION_ID, REQUESTER_ID)

    expect(prismaMock.message.updateMany).toHaveBeenCalledWith({
      where: {
        conversationId: CONVERSATION_ID,
        senderId: { not: REQUESTER_ID },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    })
  })
})
