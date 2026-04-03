'use client'

import { useState, useRef, useTransition } from 'react'
import { sendMessage } from '@/app/actions/chat'

interface MessageInputProps {
  conversationId: string
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit(): void {
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    setError(null)
    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed)
      if (result.success) {
        setContent('')
        textareaRef.current?.focus()
      } else {
        setError(result.error ?? 'Failed to send message. Please try again.')
      }
    })
  }

  return (
    <div className="bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 px-4 py-3">
      {error && (
        <p role="alert" className="text-error text-xs mb-2">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <label htmlFor="message-input" className="sr-only">
          Type a message
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={isPending}
          className="flex-1 resize-none bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 disabled:opacity-50 max-h-32 overflow-y-auto"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 translate-x-0.5"
              aria-hidden="true"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-on-surface-variant/60 mt-1.5 text-center max-w-2xl mx-auto">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
