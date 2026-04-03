'use client'

import { useState, useEffect, useRef } from 'react'
import {
  subscribeToMessages,
  unsubscribeFromMessages,
  type RealtimeMessage,
} from '@/services/chat.realtime'
import type { MessageItem, MessageType } from '@/types'

interface ChatMessagesProps {
  conversationId: string
  initialMessages: MessageItem[]
  currentUserId: string
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateDivider(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Yesterday'

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByDate(
  messages: MessageItem[]
): Array<{ date: string; items: MessageItem[] }> {
  const groups: Array<{ date: string; items: MessageItem[] }> = []
  for (const message of messages) {
    const dateLabel = formatDateDivider(message.createdAt)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.items.push(message)
    } else {
      groups.push({ date: dateLabel, items: [message] })
    }
  }
  return groups
}

function realtimeToMessageItem(
  raw: RealtimeMessage,
  currentUserId: string
): MessageItem {
  return {
    id: raw.id,
    senderId: raw.sender_id,
    // senderName is not available in the realtime payload (no join).
    // The UI does not render senderName in bubbles, so an empty string is safe.
    senderName: '',
    content: raw.content,
    messageType: raw.message_type as MessageType,
    isRead: raw.is_read,
    createdAt: new Date(raw.created_at),
    isMine: raw.sender_id === currentUserId,
  }
}

export default function ChatMessages({
  conversationId,
  initialMessages,
  currentUserId,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to realtime inserts on mount, unsubscribe on unmount
  useEffect(() => {
    const channel = subscribeToMessages(conversationId, (raw) => {
      // Deduplicate: the optimistic message from MessageInput (server action
      // + revalidatePath) may already be in state before realtime fires.
      setMessages((prev) => {
        if (prev.some((m) => m.id === raw.id)) return prev
        return [...prev, realtimeToMessageItem(raw, currentUserId)]
      })
    })

    return () => {
      unsubscribeFromMessages(channel)
    }
  }, [conversationId, currentUserId])

  const groupedMessages = groupByDate(messages)

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-on-surface-variant text-sm">No messages yet.</p>
        <p className="text-on-surface-variant text-sm">Send a message to start the conversation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {groupedMessages.map(({ date, items }) => (
        <div key={date}>
          <div className="flex items-center gap-2 my-4" role="separator">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-xs text-on-surface-variant font-medium shrink-0">{date}</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          <div className="space-y-2">
            {items.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    message.isMine
                      ? 'bg-primary text-on-primary rounded-br-sm'
                      : 'bg-surface-container text-on-surface rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isMine ? 'text-on-primary/70' : 'text-on-surface-variant'
                    }`}
                    aria-label={`Sent at ${formatTime(message.createdAt)}`}
                  >
                    {formatTime(message.createdAt)}
                    {message.isMine && (
                      <span className="ml-1" aria-label={message.isRead ? 'Read' : 'Sent'}>
                        {message.isRead ? '\u2713\u2713' : '\u2713'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
