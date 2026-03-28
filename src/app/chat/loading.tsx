export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-4 px-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-10 h-3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
                <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
