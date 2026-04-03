export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <div className="w-16 h-4 bg-surface-container rounded animate-pulse" />
        <div className="w-24 h-5 bg-surface-container rounded animate-pulse" />
      </header>

      <main className="max-w-2xl mx-auto pt-14 pb-28 px-4 py-4">
        <ul className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="w-32 h-4 bg-surface-container rounded animate-pulse" />
                  <div className="w-10 h-3 bg-surface-container-high rounded animate-pulse" />
                </div>
                <div className="w-24 h-3 bg-surface-container-high rounded animate-pulse" />
                <div className="w-48 h-4 bg-surface-container rounded animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
