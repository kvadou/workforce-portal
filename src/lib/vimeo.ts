/**
 * Vimeo API Client
 *
 * Provides functions to interact with Vimeo's API for:
 * - Fetching video metadata (title, duration, thumbnail)
 * - Managing embed domain whitelist
 * - Duration formatting utilities
 */

// Allowed embed domains for training videos
export const ALLOWED_EMBED_DOMAINS = [
  'workforceportal.com',
  'www.workforceportal.com',
  'onboarding.workforceportal.com',
  'localhost',
];

// ============ Types ============

export interface VimeoVideoMetadata {
  id: string;
  name: string;
  description: string | null;
  duration: number; // seconds
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface VimeoApiError {
  error: string;
  code: 'NOT_FOUND' | 'PRIVATE' | 'RATE_LIMITED' | 'API_ERROR' | 'INVALID_TOKEN';
  message: string;
}

// ============ Duration Utilities ============

/**
 * Convert seconds to MM:SS or HH:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(1087) // "18:07"
 * formatDuration(3661) // "1:01:01"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse MM:SS or HH:MM:SS format to seconds
 * @param formatted - Duration string like "18:07" or "1:30:45"
 * @returns Duration in seconds
 *
 * @example
 * parseDuration("18:07") // 1087
 * parseDuration("1:01:01") // 3661
 */
export function parseDuration(formatted: string): number {
  if (!formatted) return 0;

  const parts = formatted.split(':').map((p) => parseInt(p, 10) || 0);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // Just seconds
    return parts[0];
  }

  return 0;
}

/**
 * Validate duration string format
 * @param value - String to validate
 * @returns true if valid MM:SS or HH:MM:SS format
 */
export function isValidDurationFormat(value: string): boolean {
  if (!value) return true; // Empty is valid (will be 0)

  // Allow partial input during typing
  const partialPattern = /^\d{0,2}(:\d{0,2})?(:\d{0,2})?$/;
  if (partialPattern.test(value)) return true;

  // Full validation for complete values
  const fullPattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
  return fullPattern.test(value);
}

// ============ Mock Data (for demo mode without Vimeo credentials) ============

const MOCK_VIDEO: VimeoVideoMetadata = {
  id: '000000000',
  name: 'Sample Training Video',
  description: 'This is a placeholder video for demo purposes.',
  duration: 360,
  thumbnailUrl: 'https://placehold.co/640x360?text=Training+Video',
  width: 1920,
  height: 1080,
};

// ============ API Functions ============

/**
 * Extract Vimeo video ID from various URL formats
 * @param input - Vimeo URL or video ID
 * @returns Object with videoId and optional hash
 *
 * @example
 * parseVimeoInput("838377574") // { videoId: "838377574" }
 * parseVimeoInput("https://vimeo.com/838377574/09dc5d426b") // { videoId: "838377574", hash: "09dc5d426b" }
 * parseVimeoInput("https://player.vimeo.com/video/838377574?h=09dc5d426b") // { videoId: "838377574", hash: "09dc5d426b" }
 */
export function parseVimeoInput(input: string): { videoId: string; hash?: string } | null {
  if (!input) return null;

  // Direct ID input
  if (/^\d+$/.test(input.trim())) {
    return { videoId: input.trim() };
  }

  try {
    const url = new URL(input);

    if (!url.hostname.includes('vimeo.com')) {
      return null;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    const numericPart = pathParts.find((part) => /^\d+$/.test(part));

    if (!numericPart) return null;

    const result: { videoId: string; hash?: string } = { videoId: numericPart };

    // Look for hash in path (e.g., /838377574/09dc5d426b)
    const idIndex = pathParts.indexOf(numericPart);
    if (idIndex < pathParts.length - 1) {
      const possibleHash = pathParts[idIndex + 1];
      if (/^[a-f0-9]+$/i.test(possibleHash)) {
        result.hash = possibleHash;
      }
    }

    // Look for hash in query params (e.g., ?h=09dc5d426b)
    const hashParam = url.searchParams.get('h');
    if (hashParam) {
      result.hash = hashParam;
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Fetch all videos from the authenticated user's Vimeo account
 * @param accessToken - Vimeo API access token
 * @param query - Optional search query
 * @param page - Page number (1-based)
 * @param perPage - Results per page (max 100)
 * @returns List of videos with pagination info
 */
export async function fetchMyVideos(
  accessToken: string,
  query?: string,
  page: number = 1,
  perPage: number = 25,
  userId?: string // Optional: specific user/org ID to fetch videos from
): Promise<{
  videos: VimeoVideoMetadata[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  // Stub: return mock data when no Vimeo token is configured
  if (!accessToken) {
    console.log('[Vimeo Stub] No access token provided, returning mock video list');
    return {
      videos: [MOCK_VIDEO],
      total: 1,
      page: 1,
      perPage,
      totalPages: 1,
    };
  }

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    sort: 'date',
    direction: 'desc',
  });

  if (query) {
    params.set('query', query);
  }

  // If a specific user ID is provided (e.g., for team/org accounts), use that
  // Otherwise fall back to /me/videos
  const endpoint = userId
    ? `https://api.vimeo.com/users/${userId}/videos`
    : `https://api.vimeo.com/me/videos`;

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      Authorization: `bearer ${accessToken}`, // Vimeo requires lowercase 'bearer'
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  });

  if (!response.ok) {
    throw {
      error: 'API error',
      code: 'API_ERROR',
      message: 'Unable to fetch videos from Vimeo.',
    } as VimeoApiError;
  }

  const data = await response.json();

  const videos: VimeoVideoMetadata[] = data.data.map((video: {
    uri: string;
    name: string;
    description: string | null;
    duration: number;
    pictures: { sizes: { width: number; link: string }[] };
    width: number;
    height: number;
  }) => {
    const videoId = video.uri.split('/').pop() || '';
    const pictures = video.pictures?.sizes || [];
    const thumbnail =
      pictures.find((p) => p.width >= 640) ||
      pictures.find((p) => p.width >= 200) ||
      pictures[0];

    return {
      id: videoId,
      name: video.name || '',
      description: video.description || null,
      duration: video.duration || 0,
      thumbnailUrl: thumbnail?.link || '',
      width: video.width || 0,
      height: video.height || 0,
    };
  });

  return {
    videos,
    total: data.total || 0,
    page: data.page || 1,
    perPage: data.per_page || perPage,
    totalPages: Math.ceil((data.total || 0) / perPage),
  };
}

/**
 * Fetch video metadata from Vimeo API
 * @param videoId - Vimeo video ID
 * @param accessToken - Vimeo API access token
 * @returns Video metadata or throws error
 */
export async function fetchVideoMetadata(
  videoId: string,
  accessToken: string
): Promise<VimeoVideoMetadata> {
  // Stub: return mock data when no Vimeo token is configured
  if (!accessToken) {
    console.log(`[Vimeo Stub] No access token, returning mock metadata for video ${videoId}`);
    return { ...MOCK_VIDEO, id: videoId };
  }

  const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw {
        error: 'Video not found',
        code: 'NOT_FOUND',
        message: 'Video not found. Please check the Vimeo ID.',
      } as VimeoApiError;
    }
    if (response.status === 403) {
      throw {
        error: 'Video is private',
        code: 'PRIVATE',
        message: 'This video is private. Include the privacy hash from the URL.',
      } as VimeoApiError;
    }
    if (response.status === 429) {
      throw {
        error: 'Rate limited',
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment.',
      } as VimeoApiError;
    }
    if (response.status === 401) {
      throw {
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'Invalid Vimeo API token.',
      } as VimeoApiError;
    }

    throw {
      error: 'API error',
      code: 'API_ERROR',
      message: 'Unable to fetch video info. You can enter details manually.',
    } as VimeoApiError;
  }

  const data = await response.json();

  // Get best thumbnail (prefer larger sizes)
  const pictures = data.pictures?.sizes || [];
  const thumbnail =
    pictures.find((p: { width: number }) => p.width >= 640) ||
    pictures.find((p: { width: number }) => p.width >= 200) ||
    pictures[0];

  return {
    id: videoId,
    name: data.name || '',
    description: data.description || null,
    duration: data.duration || 0,
    thumbnailUrl: thumbnail?.link || '',
    width: data.width || 0,
    height: data.height || 0,
  };
}

/**
 * Get current embed domains for a video
 * @param videoId - Vimeo video ID
 * @param accessToken - Vimeo API access token
 * @returns List of allowed domains
 */
export async function getEmbedDomains(
  videoId: string,
  accessToken: string
): Promise<string[]> {
  const response = await fetch(
    `https://api.vimeo.com/videos/${videoId}/privacy/domains`,
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.data?.map((d: { domain: string }) => d.domain) || [];
}

/**
 * Add an embed domain to a video's whitelist
 * @param videoId - Vimeo video ID
 * @param domain - Domain to add
 * @param accessToken - Vimeo API access token
 */
export async function addEmbedDomain(
  videoId: string,
  domain: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://api.vimeo.com/videos/${videoId}/privacy/domains/${domain}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `bearer ${accessToken}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    // 204 is success for this endpoint
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to add embed domain');
  }
}

/**
 * Configure all required embed domains for a video
 * @param videoId - Vimeo video ID
 * @param accessToken - Vimeo API access token
 * @returns Object with results for each domain
 */
export async function configureAllEmbedDomains(
  videoId: string,
  accessToken: string
): Promise<{ success: string[]; failed: string[] }> {
  const currentDomains = await getEmbedDomains(videoId, accessToken);
  const domainsToAdd = ALLOWED_EMBED_DOMAINS.filter(
    (d) => !currentDomains.includes(d)
  );

  const results = { success: [...currentDomains], failed: [] as string[] };

  for (const domain of domainsToAdd) {
    try {
      await addEmbedDomain(videoId, domain, accessToken);
      results.success.push(domain);
    } catch {
      results.failed.push(domain);
    }
  }

  return results;
}
