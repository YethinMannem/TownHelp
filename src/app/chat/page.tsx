import { getViewerContext, requireAuthUser } from '@/lib/auth'
import { getConversationsForViewer } from '@/services/chat.service'
import Link from 'next/link'
import type { ConversationItem } from '@/types'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { RelativeTime } from './_components/RelativeTime'

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


export default async function ChatPage() {
  const authUser = await requireAuthUser()
  const viewer = await getViewerContext()
  const conversations = await getConversationsForViewer(authUser.id, viewer.providerProfileId)

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:pl-60">
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="font-headline font-bold text-base text-on-surface">Messages</h1>
      </header>

      <div className="max-w-3xl mx-auto pt-14 px-4 lg:px-8">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-outline" />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              No messages yet
            </h2>
            <p className="text-sm text-on-surface-variant font-body max-w-xs mb-5">
              Messages with providers will appear here after you make a booking.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl font-body hover:opacity-90 transition-opacity"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm divide-y divide-outline-variant/15">
            {conversations.map((conversation: ConversationItem) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-container/40 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full font-bold flex items-center justify-center shrink-0 text-sm font-headline ${getAvatarColor(conversation.otherPartyName)}`}
                    aria-hidden="true"
                  >
                    {conversation.otherPartyName.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-on-surface text-sm font-body truncate">
                        {conversation.otherPartyName}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-body shrink-0">
                        <RelativeTime isoDate={conversation.lastMessageAt.toISOString()} />
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant font-body mt-0.5 truncate">
                      {conversation.categoryName} &middot; #{conversation.bookingNumber}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm text-on-surface-variant font-body truncate">
                        {conversation.lastMessage ?? (
                          <span className="italic opacity-60">No messages yet</span>
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold px-1.5"
                          aria-label={`${conversation.unreadCount} unread`}
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
      </div>
    </div>
  )
}
