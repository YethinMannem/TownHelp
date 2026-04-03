export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Skeleton header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 h-14 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
        <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
      </header>

      <div className="pt-16 px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface-container rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high mx-auto" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded mx-auto" />
              <div className="h-3 w-1/2 bg-surface-container-high rounded mx-auto" />
              <div className="h-3 w-2/3 bg-surface-container-high rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
