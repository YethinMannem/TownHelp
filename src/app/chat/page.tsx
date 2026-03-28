import { requireAuthUser } from '@/lib/auth'
import { getConversations } from '@/app/actions/chat'
import Link from 'next/link'
import type { ConversationItem } from '@/types'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Home
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-4 px-4">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center mt-8">
            <p className="text-gray-500 text-lg font-medium mb-1">No conversations yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Messages with providers will appear here after you make a booking.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <ul className="space-y-0 bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {conversations.map((conversation: ConversationItem) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                    {conversation.otherPartyName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {conversation.otherPartyName}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {conversation.categoryName} &middot; #{conversation.bookingNumber}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage ?? (
                          <span className="italic text-gray-400">No messages yet</span>
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
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
