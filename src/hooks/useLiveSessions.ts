import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LiveSessionCategory } from "@prisma/client";

// ===== Types =====

export interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  hostId: string;
  hostName: string;
  scheduledAt: string;
  duration: number;
  maxParticipants: number;
  category: LiveSessionCategory;
  isActive: boolean;
  isRegistered: boolean;
  participantCount: number;
  spotsRemaining: number;
  zoomJoinUrl: string | null;
  zoomStartUrl?: string | null;
}

export interface LiveSessionDetail extends LiveSession {
  zoomMeetingId?: string;
  registrations?: {
    id: string;
    userId: string;
    registeredAt: string;
  }[];
}

// ===== Hooks =====

/**
 * Fetch upcoming live sessions
 */
export function useLiveSessions(options?: {
  category?: LiveSessionCategory;
  includePast?: boolean;
}) {
  return useQuery<{ sessions: LiveSession[] }>({
    queryKey: ["liveSessions", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.category) params.set("category", options.category);
      if (options?.includePast) params.set("past", "true");

      const res = await fetch(`/api/live-sessions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch live sessions");
      return res.json();
    },
  });
}

/**
 * Fetch a single live session
 */
export function useLiveSession(id: string | null) {
  return useQuery<LiveSessionDetail>({
    queryKey: ["liveSession", id],
    queryFn: async () => {
      const res = await fetch(`/api/live-sessions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Register for a live session
 */
export function useRegisterForSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/live-sessions/${sessionId}/register`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to register");
      }
      return res.json();
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      queryClient.invalidateQueries({ queryKey: ["liveSession", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/**
 * Unregister from a live session
 */
export function useUnregisterFromSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/live-sessions/${sessionId}/register`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unregister");
      }
      return res.json();
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      queryClient.invalidateQueries({ queryKey: ["liveSession", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ===== Admin Hooks =====

/**
 * Create a live session (admin only)
 */
export function useCreateLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      scheduledAt: string;
      duration?: number;
      maxParticipants?: number;
      category: LiveSessionCategory;
      hostName?: string;
      createZoomMeeting?: boolean;
    }) => {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      queryClient.invalidateQueries({ queryKey: ["adminLiveSessions"] });
    },
  });
}

/**
 * Update a live session (admin only)
 */
export function useUpdateLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        title: string;
        description: string;
        scheduledAt: string;
        duration: number;
        maxParticipants: number;
        category: LiveSessionCategory;
        hostName: string;
        isActive: boolean;
      }>;
    }) => {
      const res = await fetch(`/api/live-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update session");
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      queryClient.invalidateQueries({ queryKey: ["liveSession", id] });
      queryClient.invalidateQueries({ queryKey: ["adminLiveSessions"] });
    },
  });
}

/**
 * Delete a live session (admin only)
 */
export function useDeleteLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/live-sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveSessions"] });
      queryClient.invalidateQueries({ queryKey: ["adminLiveSessions"] });
    },
  });
}

/**
 * Fetch all sessions for admin (includes registrations)
 */
export function useAdminLiveSessions(options?: {
  category?: LiveSessionCategory;
  includePast?: boolean;
}) {
  return useQuery<{ sessions: LiveSessionDetail[] }>({
    queryKey: ["adminLiveSessions", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.category) params.set("category", options.category);
      if (options?.includePast) params.set("past", "true");

      const res = await fetch(`/api/live-sessions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch live sessions");
      return res.json();
    },
  });
}
