export default function ProviderDetailLoading() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Profile header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-container-high animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="w-40 h-6 bg-surface-container-high rounded animate-pulse" />
              <div className="w-28 h-4 bg-surface-container rounded animate-pulse" />
              <div className="flex gap-2 mt-2">
                <div className="w-16 h-5 bg-surface-container-high rounded-full animate-pulse" />
                <div className="w-20 h-5 bg-surface-container-high rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Rating and stats row */}
          <div className="mt-4 flex gap-6">
            <div className="space-y-1">
              <div className="w-12 h-5 bg-surface-container-high rounded animate-pulse" />
              <div className="w-16 h-3 bg-surface-container rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="w-8 h-5 bg-surface-container-high rounded animate-pulse" />
              <div className="w-20 h-3 bg-surface-container rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="w-10 h-5 bg-surface-container-high rounded animate-pulse" />
              <div className="w-14 h-3 bg-surface-container rounded animate-pulse" />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-5 flex gap-3">
            <div className="flex-1 h-11 bg-surface-container-high rounded-lg animate-pulse" />
            <div className="w-11 h-11 bg-surface-container rounded-lg animate-pulse shrink-0" />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* About section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-3">
          <div className="w-16 h-5 bg-surface-container-high rounded animate-pulse" />
          <div className="space-y-2">
            <div className="w-full h-3 bg-surface-container rounded animate-pulse" />
            <div className="w-full h-3 bg-surface-container rounded animate-pulse" />
            <div className="w-3/4 h-3 bg-surface-container rounded animate-pulse" />
          </div>
        </div>

        {/* Services section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
          <div className="w-20 h-5 bg-surface-container-high rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                <div className="space-y-1">
                  <div className="w-32 h-4 bg-surface-container-high rounded animate-pulse" />
                  <div className="w-24 h-3 bg-surface-container rounded animate-pulse" />
                </div>
                <div className="w-16 h-5 bg-surface-container-high rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
          <div className="w-20 h-5 bg-surface-container-high rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="space-y-2 pb-4 border-b border-outline-variant/30 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high animate-pulse" />
                    <div className="w-24 h-4 bg-surface-container-high rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-3 bg-surface-container rounded animate-pulse" />
                </div>
                <div className="w-20 h-3 bg-surface-container-high rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="w-full h-3 bg-surface-container rounded animate-pulse" />
                  <div className="w-4/5 h-3 bg-surface-container rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
