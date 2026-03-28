import { requireAuthUser } from '@/lib/auth'
import { getMessages, markConversationAsRead, getConversations } from '@/app/actions/chat'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MessageInput from '@/components/chat/MessageInput'
import type { MessageItem, ConversationItem } from '@/types'

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

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  await requireAuthUser()

  const [{ messages }, conversations] = await Promise.all([
    getMessages(conversationId),
    getConversations(),
    markConversationAsRead(conversationId),
  ])

  const conversation = conversations.find(
    (c: ConversationItem) => c.id === conversationId
  )

  if (!conversation) {
    notFound()
  }

  // Group messages by date for date dividers
  const groupedMessages: Array<{ date: string; items: MessageItem[] }> = []
  for (const message of messages) {
    const dateLabel = formatDateDivider(message.createdAt)
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.items.push(message)
    } else {
      groupedMessages.push({ date: dateLabel, items: [message] })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shrink-0">
        <Link
          href="/chat"
          className="text-blue-600 hover:text-blue-700 p-1 -ml-1"
          aria-label="Back to messages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>

        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
          {conversation.otherPartyName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {conversation.otherPartyName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {conversation.categoryName} &middot; #{conversation.bookingNumber}
          </p>
        </div>

        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
          {conversation.bookingStatus.toLowerCase().replace('_', ' ')}
        </span>
      </header>

      {/* Message list */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-400 text-sm">No messages yet.</p>
            <p className="text-gray-400 text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {groupedMessages.map(({ date, items }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-2 my-4" role="separator">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium shrink-0">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="space-y-2">
                  {items.map((message: MessageItem) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          message.isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isMine ? 'text-blue-200' : 'text-gray-400'
                          }`}
                          aria-label={`Sent at ${formatTime(message.createdAt)}`}
                        >
                          {formatTime(message.createdAt)}
                          {message.isMine && (
                            <span className="ml-1" aria-label={message.isRead ? 'Read' : 'Sent'}>
                              {message.isRead ? '&#10003;&#10003;' : '&#10003;'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Message input */}
      <div className="shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  )
}
