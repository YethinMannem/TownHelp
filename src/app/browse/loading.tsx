export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      {/* Skeleton header */}
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
        <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
      </header>

      <div className="pt-14 px-4 lg:px-8 max-w-5xl mx-auto">
        {/* Search bar skeleton */}
        <div className="py-4 max-w-2xl space-y-2.5">
          <div className="h-10 bg-surface-container rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-surface-container rounded-xl animate-pulse" />
            <div className="h-10 w-20 bg-surface-container rounded-xl animate-pulse" />
          </div>
          {/* Sort skeleton */}
          <div className="h-9 w-[200px] bg-surface-container rounded-xl animate-pulse" />
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
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
