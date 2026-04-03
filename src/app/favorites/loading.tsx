export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center">
        <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse" />
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-14">
        <div className="h-4 w-32 bg-surface-container-highest rounded animate-pulse mt-4 mb-6" />

        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-5"
            >
              <div className="flex items-start gap-4">
                {/* Card skeleton */}
                <div className="shrink-0 w-44 h-48 bg-surface-container rounded-2xl animate-pulse" />
                {/* Details skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-surface-container rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-surface-container rounded animate-pulse" />
                  <div className="h-3 w-24 bg-surface-container rounded animate-pulse mt-2" />
                  <div className="flex gap-2 mt-3">
                    <div className="h-6 w-20 bg-surface-container rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-surface-container rounded-full animate-pulse" />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <div className="h-9 w-28 bg-surface-container rounded-full animate-pulse" />
                    <div className="h-9 w-16 bg-surface-container rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
