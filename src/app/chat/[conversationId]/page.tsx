import { requireAuthUser } from '@/lib/auth'
import { getMessages, markConversationAsRead, getConversations } from '@/app/actions/chat'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MessageInput from '@/components/chat/MessageInput'
import ChatMessages from './ChatMessages'
import type { ConversationItem } from '@/types'

const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-[#cde5ff] text-[#073452]',
] as const

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

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
    <div className="flex flex-col h-screen bg-surface">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3 shrink-0">
        <Link
          href="/chat"
          className="text-primary p-1 -ml-1"
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

        <div
          className={`w-9 h-9 rounded-full font-bold flex items-center justify-center shrink-0 text-sm ${getAvatarColor(conversation.otherPartyName)}`}
          aria-hidden="true"
        >
          {conversation.otherPartyName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface text-sm truncate">
            {conversation.otherPartyName}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {conversation.categoryName} &middot; #{conversation.bookingNumber}
          </p>
        </div>

        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium capitalize">
          {conversation.bookingStatus.toLowerCase().replace('_', ' ')}
        </span>
      </header>

      {/* Message list — offset below fixed header, above fixed input */}
      <main className="flex-1 overflow-y-auto px-4 pt-14 pb-28">
        <ChatMessages
          conversationId={conversationId}
          initialMessages={messages}
          currentUserId={authUser.id}
        />
      </main>

      {/* Fixed message input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 shrink-0">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  )
}
