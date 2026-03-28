export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />

        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mt-4 mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />

        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="mt-3 flex gap-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="mt-3 flex gap-2">
                <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>

              <div className="mt-4 flex gap-3">
                <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
