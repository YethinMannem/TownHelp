export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mt-4 mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6" />

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-200 rounded-full animate-pulse shrink-0"
            />
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
            >
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
                  <div className="h-3 w-14 bg-gray-100 rounded animate-pulse ml-auto" />
                </div>
              </div>
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="flex gap-1.5">
                <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
              <div className="h-9 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
