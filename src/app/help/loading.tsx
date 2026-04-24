export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-60">
      <header className="fixed top-0 left-0 right-0 lg:left-60 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 px-4 lg:px-6 h-14 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
        <div className="h-4 w-28 rounded bg-surface-container animate-pulse" />
      </header>
      <div className="pt-14 px-4 lg:px-8 max-w-xl mx-auto mt-6 space-y-5">
        <div className="h-3 w-36 rounded bg-surface-container animate-pulse" />
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden divide-y divide-outline-variant/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center justify-between gap-3">
              <div className="h-4 rounded bg-surface-container animate-pulse w-3/4" />
              <div className="h-4 w-4 rounded bg-surface-container animate-pulse shrink-0" />
            </div>
          ))}
        </div>
        <div className="h-3 w-36 rounded bg-surface-container animate-pulse" />
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-surface-container animate-pulse" />
          ))}
        </div>
        <div className="h-3 w-28 rounded bg-surface-container animate-pulse" />
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 px-4 py-4 space-y-4">
          <div className="h-10 rounded-xl bg-surface-container animate-pulse" />
          <div className="h-4 w-32 rounded bg-surface-container animate-pulse" />
          <div className="h-3 w-48 rounded bg-surface-container animate-pulse" />
        </div>
      </div>
    </div>
  )
}
