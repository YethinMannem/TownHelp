export default function ChatThreadLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Message bubbles */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Incoming bubble */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="space-y-1 max-w-[70%]">
            <div className="h-10 w-48 bg-gray-200 rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse ml-1" />
          </div>
        </div>

        {/* Outgoing bubble */}
        <div className="flex items-end justify-end gap-2">
          <div className="space-y-1 max-w-[70%] items-end flex flex-col">
            <div className="h-10 w-56 bg-blue-100 rounded-2xl rounded-br-sm animate-pulse" />
            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mr-1" />
          </div>
        </div>

        {/* Incoming long bubble */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="space-y-1 max-w-[70%]">
            <div className="h-16 w-64 bg-gray-200 rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse ml-1" />
          </div>
        </div>

        {/* Outgoing bubble */}
        <div className="flex items-end justify-end gap-2">
          <div className="space-y-1 max-w-[70%] items-end flex flex-col">
            <div className="h-10 w-40 bg-blue-100 rounded-2xl rounded-br-sm animate-pulse" />
            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mr-1" />
          </div>
        </div>

        {/* Incoming bubble */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="space-y-1 max-w-[70%]">
            <div className="h-10 w-36 bg-gray-200 rounded-2xl rounded-bl-sm animate-pulse" />
            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse ml-1" />
          </div>
        </div>
      </main>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 h-10 bg-gray-100 rounded-full animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
        </div>
      </div>
    </div>
  );
}
