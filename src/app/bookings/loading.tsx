export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Frosted-glass header skeleton */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center">
        <div className="h-5 w-28 bg-surface-container rounded-lg animate-pulse" />
      </header>

      <div className="max-w-lg mx-auto px-4 pt-14">
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-surface-container rounded-lg animate-pulse" />
                  <div className="h-4 w-24 bg-surface-container rounded-lg animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-surface-container rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-48 bg-surface-container rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
