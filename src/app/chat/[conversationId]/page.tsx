import { requireAuthUser } from '@/lib/auth'
import { getMessages, markConversationAsRead, getConversations } from '@/app/actions/chat'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MessageInput from '@/components/chat/MessageInput'
import ChatMessages from './ChatMessages'
import type { ConversationItem } from '@/types'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const authUser = await requireAuthUser()

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
        <ChatMessages
          conversationId={conversationId}
          initialMessages={messages}
          currentUserId={authUser.id}
        />
      </main>

      {/* Message input */}
      <div className="shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  )
}
