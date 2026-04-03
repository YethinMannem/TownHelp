export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center justify-between">
        <div className="h-4 w-32 bg-surface-container-highest rounded animate-pulse" />
        <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse" />
      </header>

      <div className="max-w-lg mx-auto px-4 pt-14">
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-surface-container animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-surface-container rounded animate-pulse" />
                  <div className="h-3 w-full bg-surface-container rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-surface-container rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
