import { requireAuthUser } from '@/lib/auth'
import { getConversations } from '@/app/actions/chat'
import Link from 'next/link'
import type { ConversationItem } from '@/types'

const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-tertiary-fixed text-on-tertiary-fixed',
] as const

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default async function ChatPage() {
  await requireAuthUser()
  const conversations = await getConversations()

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-primary font-medium"
          aria-label="Back to home"
        >
          &larr; Home
        </Link>
        <h1 className="font-headline font-bold text-base text-on-surface">Messages</h1>
      </header>

      <main className="max-w-2xl mx-auto pt-14 pb-28 px-4">
        {conversations.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-10 text-center mt-8">
            <p className="text-on-surface font-medium text-lg mb-1">No conversations yet</p>
            <p className="text-on-surface-variant text-sm mb-4">
              Messages with providers will appear here after you make a booking.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-primary text-on-primary text-sm rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <ul className="space-y-2 mt-4">
            {conversations.map((conversation: ConversationItem) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  className="flex items-start gap-3 px-4 py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 hover:bg-surface-container/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0 text-sm ${getAvatarColor(conversation.otherPartyName)}`}
                    aria-hidden="true"
                  >
                    {conversation.otherPartyName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-on-surface text-sm truncate">
                        {conversation.otherPartyName}
                      </span>
                      <span className="text-xs text-on-surface-variant shrink-0">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                      {conversation.categoryName} &middot; #{conversation.bookingNumber}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-sm text-on-surface-variant truncate">
                        {conversation.lastMessage ?? (
                          <span className="italic text-on-surface-variant/60">No messages yet</span>
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold"
                          aria-label={`${conversation.unreadCount} unread messages`}
                        >
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
