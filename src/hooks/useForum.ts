import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    posts: number;
  };
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  courseId: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    replies: number;
    reactions: number;
  };
  reactions?: ForumReaction[];
  userReaction?: string | null;
}

export interface ForumReply {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  postId: string;
  parentId: string | null;
  isAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  children?: ForumReply[];
  reactions?: ForumReaction[];
  userReaction?: string | null;
  _count?: {
    reactions: number;
  };
}

export interface ForumReaction {
  id: string;
  type: "LIKE" | "HELPFUL" | "INSIGHTFUL";
  userId: string;
}

// API functions
async function fetchCategories(): Promise<ForumCategory[]> {
  const response = await fetch("/api/forum/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

async function fetchPosts(params: {
  categorySlug?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: ForumPost[]; total: number; page: number; totalPages: number }> {
  const searchParams = new URLSearchParams();
  if (params.categorySlug) searchParams.set("category", params.categorySlug);
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/forum/posts?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch posts");
  return response.json();
}

async function fetchPost(postId: string): Promise<ForumPost & { replies: ForumReply[] }> {
  const response = await fetch(`/api/forum/posts/${postId}`);
  if (!response.ok) throw new Error("Failed to fetch post");
  return response.json();
}

async function createPost(data: {
  title: string;
  content: string;
  categoryId: string;
  courseId?: string;
}): Promise<ForumPost> {
  const response = await fetch("/api/forum/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create post");
  }
  return response.json();
}

async function createReply(data: {
  postId: string;
  content: string;
  parentId?: string;
}): Promise<ForumReply> {
  const response = await fetch(`/api/forum/posts/${data.postId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: data.content, parentId: data.parentId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create reply");
  }
  return response.json();
}

async function toggleReaction(data: {
  postId?: string;
  replyId?: string;
  type: "LIKE" | "HELPFUL" | "INSIGHTFUL";
}): Promise<{ action: "added" | "removed" }> {
  const response = await fetch("/api/forum/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle reaction");
  }
  return response.json();
}

async function markAsAnswer(replyId: string): Promise<ForumReply> {
  const response = await fetch(`/api/forum/posts/replies/${replyId}/answer`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark as answer");
  }
  return response.json();
}

// Hooks
export function useForumCategories() {
  return useQuery({
    queryKey: ["forumCategories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useForumPosts(params: {
  categorySlug?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["forumPosts", params],
    queryFn: () => fetchPosts(params),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useForumPost(postId: string) {
  return useQuery({
    queryKey: ["forumPost", postId],
    queryFn: () => fetchPost(postId),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReply,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forumPost", variables.postId] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost"] });
      queryClient.invalidateQueries({ queryKey: ["forumPosts"] });
    },
  });
}

export function useMarkAsAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forumPost"] });
    },
  });
}
