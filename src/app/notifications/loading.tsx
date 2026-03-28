export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
