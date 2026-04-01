"use client";

import { useState } from "react";
import {
  StarIcon,
  ChatBubbleLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCourseReviews, useSubmitReview, useDeleteReview } from "@/hooks/useCourseReviews";
import { formatDistanceToNow } from "date-fns";

interface CourseReviewsProps {
  courseId: string;
  courseTitle: string;
}

function StarRating({
  rating,
  interactive = false,
  onChange,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <StarIcon
            className={`${sizeClasses[size]} ${
              star <= (hovered || rating)
                ? "fill-amber-400 text-warning"
                : "text-neutral-300"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ count, total }: { count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-warning transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CourseReviews({ courseId, courseTitle }: CourseReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data, isLoading } = useCourseReviews(courseId);
  const submitReview = useSubmitReview(courseId);
  const deleteReview = useDeleteReview(courseId);

  const reviews = data?.reviews || [];
  const userReview = data?.userReview;
  const stats = data?.stats;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitReview.mutateAsync({
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        isPublic,
      });
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  const handleEdit = () => {
    if (userReview) {
      setRating(userReview.rating);
      setTitle(userReview.title || "");
      setContent(userReview.content || "");
      setIsPublic(userReview.isPublic);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReview.mutateAsync();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="h-6 w-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 p-4 bg-neutral-50 rounded-xl">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-neutral-900 mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(stats.averageRating)} size="sm" />
            <div className="text-sm text-neutral-500 mt-1">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-neutral-500">{star}</span>
                <StarIcon className="h-3.5 w-3.5 text-warning fill-amber-400" />
                <RatingBar
                  count={stats.distribution[star] || 0}
                  total={stats.totalReviews}
                />
                <span className="w-6 text-neutral-500 text-right">
                  {stats.distribution[star] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Review Status / Write Button */}
      {userReview ? (
        <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftIcon className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-primary-700">Your Review</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="p-1.5 text-primary-600 hover:bg-primary-100 rounded transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteReview.isPending}
                className="p-1.5 text-error hover:bg-error-light rounded transition-colors"
              >
                {deleteReview.isPending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <StarRating rating={userReview.rating} size="sm" />
          {userReview.title && (
            <h4 className="font-medium text-neutral-900 mt-2">{userReview.title}</h4>
          )}
          {userReview.content && (
            <p className="text-sm text-neutral-600 mt-1">{userReview.content}</p>
          )}
        </div>
      ) : (
        !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <StarIcon className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        )
      )}

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border border-neutral-200 rounded-xl space-y-4"
        >
          <h3 className="font-semibold text-neutral-900">
            {userReview ? "Edit Your Review" : "Write a Review"}
          </h3>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Your Rating
            </label>
            <StarRating rating={rating} interactive onChange={setRating} size="lg" />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Review (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this course..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Public Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Make this review public</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitReview.isPending}>
              {submitReview.isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-900">
            Recent Reviews
          </h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-white border border-neutral-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {review.user.avatarUrl ? (
                    <img
                      src={review.user.avatarUrl}
                      alt={review.user.name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(review.user.name)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-neutral-900">
                      {review.user.name || "Anonymous"}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-neutral-800 mb-1">
                      {review.title}
                    </h4>
                  )}
                  {review.content && (
                    <p className="text-sm text-neutral-600 mb-2">
                      {review.content}
                    </p>
                  )}
                  <span className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && !userReview && !showForm && (
        <div className="text-center py-8 text-neutral-500">
          <ChatBubbleLeftIcon className="h-12 w-12 text-neutral-200 mx-auto mb-2" />
          <p>No reviews yet. Be the first to share your thoughts!</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Review"
        message="Are you sure you want to delete your review?"
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
