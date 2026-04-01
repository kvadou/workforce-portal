import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export interface CourseReviewsData {
  reviews: CourseReview[];
  userReview: CourseReview | null;
  stats: ReviewStats;
}

async function fetchCourseReviews(courseId: string): Promise<CourseReviewsData> {
  const response = await fetch(`/api/courses/${courseId}/reviews`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
}

async function submitReview(
  courseId: string,
  data: { rating: number; title?: string; content?: string; isPublic?: boolean }
): Promise<CourseReview> {
  const response = await fetch(`/api/courses/${courseId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit review");
  }
  return response.json();
}

async function deleteReview(courseId: string): Promise<void> {
  const response = await fetch(`/api/courses/${courseId}/reviews`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete review");
  }
}

export function useCourseReviews(courseId: string) {
  return useQuery({
    queryKey: ["courseReviews", courseId],
    queryFn: () => fetchCourseReviews(courseId),
    enabled: !!courseId,
  });
}

export function useSubmitReview(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { rating: number; title?: string; content?: string; isPublic?: boolean }) =>
      submitReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseReviews", courseId] });
    },
  });
}

export function useDeleteReview(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteReview(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseReviews", courseId] });
    },
  });
}
