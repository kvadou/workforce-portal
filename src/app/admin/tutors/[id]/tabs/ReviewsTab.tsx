"use client";

import {
  StarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";
import { useTutorReviews } from "@/hooks/useTutorProfiles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/* ─── Props ─── */

interface ReviewsTabProps {
  tutor: AdminTutorOverview;
}

/* ─── Main Component ─── */

export default function ReviewsTab({ tutor }: ReviewsTabProps) {
  const rating = tutor.averageRating ? Number(tutor.averageRating) : null;
  const { data: reviewsData, isLoading: reviewsLoading } = useTutorReviews(tutor.id);
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-warning" />
            Rating Summary
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Overall Rating */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center p-4 bg-warning-light/30 rounded-lg border border-warning/20">
              <p className="text-4xl font-bold text-warning">
                {rating ? rating.toFixed(1) : "\u2014"}
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-4 w-4 ${
                      rating && star <= Math.round(rating)
                        ? "text-warning fill-current"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Overall Rating</p>
            </div>

            {/* Stats */}
            <div className="sm:col-span-3 grid grid-cols-3 gap-4">
              <StatCard
                icon={<StarIcon className="h-5 w-5 text-warning fill-current" />}
                value={String(tutor.fiveStarCount)}
                label="5-Star Reviews"
              />
              <StatCard
                icon={<ArrowTrendingUpIcon className="h-5 w-5 text-success" />}
                value={String(tutor.trialConversions)}
                label="Trial Conversions"
              />
              <StatCard
                icon={<ChartBarIcon className="h-5 w-5 text-info" />}
                value={String(tutor.totalLessons)}
                label="Total Lessons"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-primary-500" />
            Performance Metrics
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricRow label="Total Hours" value={`${Number(tutor.totalHours).toFixed(1)}h`} />
            <MetricRow label="Points Rank" value={`#${tutor.points.rank}`} />
            <MetricRow label="Monthly Points" value={String(tutor.points.monthly)} />
            <MetricRow
              label="Last Lesson"
              value={tutor.lastLessonDate ? new Date(tutor.lastLessonDate).toLocaleDateString() : "\u2014"}
            />
          </div>
        </div>
      </div>

      {/* Client Reviews from TutorCruncher */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-warning" />
            Client Reviews
            {reviews.length > 0 && (
              <span className="text-xs text-neutral-400 font-normal">({reviews.length})</span>
            )}
          </h3>
        </div>
        <div className="p-4">
          {reviewsLoading ? (
            <div className="py-6"><LoadingSpinner /></div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <StarIcon className="h-10 w-10 text-neutral-300" />
              <p className="text-xs text-neutral-400 mt-1.5">No client reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-3 border border-neutral-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "text-warning fill-current"
                              : "text-neutral-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium text-neutral-700 ml-1">
                        {review.rating}/5
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(review.created).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comments && (
                    <p className="text-sm text-neutral-700">{review.comments}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Review from {review.reviewer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-neutral-900 mt-1">{value}</p>
    </div>
  );
}
