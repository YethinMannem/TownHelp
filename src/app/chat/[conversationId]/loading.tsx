export default function ChatThreadLoading() {
  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <div className="w-8 h-8 bg-surface-container rounded-full animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="w-32 h-4 bg-surface-container rounded animate-pulse" />
          <div className="w-20 h-3 bg-surface-container-high rounded animate-pulse" />
        </div>
      </header>

      {/* Message bubbles */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-14 pb-28 space-y-4">
        {/* Incoming bubble */}
        <div className="flex items-end gap-2">
          <div className="space-y-1 max-w-[70%]">
            <div className="h-10 w-48 bg-surface-container rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse ml-1" />
          </div>
        </div>

        {/* Outgoing bubble */}
        <div className="flex items-end justify-end gap-2">
          <div className="space-y-1 max-w-[70%] items-end flex flex-col">
            <div className="h-10 w-56 bg-primary/20 rounded-2xl rounded-br-sm animate-pulse" />
            <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse mr-1" />
          </div>
        </div>

        {/* Incoming long bubble */}
        <div className="flex items-end gap-2">
          <div className="space-y-1 max-w-[70%]">
            <div className="h-16 w-64 bg-surface-container rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse ml-1" />
          </div>
        </div>

        {/* Outgoing bubble */}
        <div className="flex items-end justify-end gap-2">
          <div className="space-y-1 max-w-[70%] items-end flex flex-col">
            <div className="h-10 w-40 bg-primary/20 rounded-2xl rounded-br-sm animate-pulse" />
            <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse mr-1" />
          </div>
        </div>

        {/* Incoming bubble */}
        <div className="flex items-end gap-2">
          <div className="space-y-1 max-w-[70%]">
            <div className="h-10 w-36 bg-surface-container rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse ml-1" />
          </div>
        </div>
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-10 bg-surface-container rounded-2xl animate-pulse" />
          <div className="w-10 h-10 bg-surface-container rounded-full animate-pulse shrink-0" />
        </div>
      </div>
    </div>
  )
}
