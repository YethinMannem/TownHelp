import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuthUser } from '@/lib/auth'
import { getProviderById } from '@/app/actions/provider'
import { isFavorited } from '@/app/actions/favorite'
import { getProviderReviews } from '@/app/actions/review'
import FavoriteButton from './FavoriteButton'
import type { ReviewItem } from '@/types'

interface ProviderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProviderDetailPage({ params }: ProviderDetailPageProps) {
  await requireAuthUser()

  const { id } = await params

  const provider = await getProviderById(id)

  if (!provider) {
    notFound()
  }

  // getProviderReviews expects the provider's User.id (revieweeId in reviews table)
  const [favorited, reviews] = await Promise.all([
    isFavorited(id),
    getProviderReviews(provider.userId),
  ])

  const rateLabel = (rateType: string | null): string => {
    switch (rateType) {
      case 'HOURLY':
        return '/hr'
      case 'PER_VISIT':
        return '/visit'
      case 'PER_KG':
        return '/kg'
      case 'FIXED':
        return ' fixed'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back navigation */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
        >
          <span aria-hidden="true">←</span> Back to Browse
        </Link>

        {/* Header card */}
        <section
          aria-label="Provider overview"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {provider.displayName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {provider.isVerified && (
                  <span className="text-green-600 font-medium">Verified</span>
                )}
                {!provider.isAvailable && (
                  <span className="text-orange-500 font-medium">Currently unavailable</span>
                )}
                <span>
                  {provider.ratingAvg.toFixed(1)} ({provider.ratingCount}{' '}
                  {provider.ratingCount === 1 ? 'review' : 'reviews'})
                </span>
                <span>{provider.completedBookings} jobs done</span>
              </div>
              {provider.bio && (
                <p className="mt-2 text-sm text-gray-600">{provider.bio}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900">
                &#x20B9;{provider.baseRate}
              </p>
              <p className="text-xs text-gray-500">base rate</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link
              href={`/browse`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book this provider
            </Link>
            <FavoriteButton providerId={provider.id} initialFavorited={favorited} />
          </div>
        </section>

        {/* Services */}
        {provider.services.length > 0 && (
          <section
            aria-label="Services offered"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-3">Services Offered</h2>
            <ul className="space-y-3">
              {provider.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {service.category.name}
                    </p>
                    {service.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                    )}
                  </div>
                  {service.customRate !== null && (
                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      &#x20B9;{service.customRate}
                      <span className="text-xs font-normal text-gray-500">
                        {rateLabel(service.rateType)}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Service areas */}
        {provider.areas.length > 0 && (
          <section
            aria-label="Service areas"
            className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-3">Service Areas</h2>
            <ul className="flex flex-wrap gap-2">
              {provider.areas.map((area, index) => (
                <li
                  key={index}
                  className={`text-xs px-3 py-1 rounded-full ${
                    area.isPrimary
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {area.areaName}
                  {area.isPrimary && (
                    <span className="ml-1 font-medium">(primary)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reviews */}
        <section aria-label="Reviews">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Reviews
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({reviews.length})
              </span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {(reviews as ReviewItem[]).map((review) => (
                <li
                  key={review.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {review.reviewerName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {review.categoryName} &middot;{' '}
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-sm font-semibold text-gray-900"
                      aria-label={`Rating: ${review.rating} out of 5`}
                    >
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
