import { useState, useCallback, useEffect } from 'react';
import { VimeoVideoMetadata } from '@/lib/vimeo';

interface VimeoFetchResult {
  metadata: VimeoVideoMetadata | null;
  embedDomains: string[];
  missingDomains: string[];
  allDomainsConfigured: boolean;
}

interface VimeoFetchError {
  error: string;
  message: string;
}

interface UseVimeoMetadataReturn {
  /** Fetched video metadata */
  data: VimeoFetchResult | null;
  /** Whether a fetch is in progress */
  isLoading: boolean;
  /** Error from the last fetch */
  error: VimeoFetchError | null;
  /** Fetch metadata for a video ID */
  fetchMetadata: (videoId: string) => Promise<VimeoFetchResult | null>;
  /** Clear current data and error */
  reset: () => void;
}

/**
 * Hook to fetch Vimeo video metadata
 *
 * @example
 * const { data, isLoading, error, fetchMetadata } = useVimeoMetadata();
 *
 * const handleFetch = async () => {
 *   const result = await fetchMetadata("838377574");
 *   if (result?.metadata) {
 *     setTitle(result.metadata.name);
 *     setDuration(result.metadata.duration);
 *   }
 * };
 */
export function useVimeoMetadata(): UseVimeoMetadataReturn {
  const [data, setData] = useState<VimeoFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<VimeoFetchError | null>(null);

  const fetchMetadata = useCallback(async (videoId: string) => {
    if (!videoId) {
      setError({ error: 'Invalid ID', message: 'Please enter a video ID' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/vimeo?videoId=${encodeURIComponent(videoId)}`
      );

      const result = await response.json();

      if (!response.ok) {
        setError({ error: result.error, message: result.message });
        setData(null);
        return null;
      }

      setData(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch video info. You can enter details manually.';
      setError({ error: 'Fetch failed', message });
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchMetadata,
    reset,
  };
}

interface ConfigureDomainsResult {
  success: boolean;
  configuredDomains: string[];
  failedDomains: string[];
  allDomainsConfigured: boolean;
}

interface UseConfigureVimeoDomainsReturn {
  /** Whether configuration is in progress */
  isConfiguring: boolean;
  /** Error from the last configuration attempt */
  error: VimeoFetchError | null;
  /** Configure embed domains for a video */
  configureDomains: (videoId: string) => Promise<ConfigureDomainsResult | null>;
}

/**
 * Hook to configure Vimeo embed domains
 *
 * @example
 * const { isConfiguring, error, configureDomains } = useConfigureVimeoDomains();
 *
 * const handleConfigure = async () => {
 *   const result = await configureDomains("838377574");
 *   if (result?.allDomainsConfigured) {
 *     toast.success("Embed domains configured!");
 *   }
 * };
 */
export function useConfigureVimeoDomains(): UseConfigureVimeoDomainsReturn {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState<VimeoFetchError | null>(null);

  const configureDomains = useCallback(async (videoId: string) => {
    if (!videoId) {
      setError({ error: 'Invalid ID', message: 'Please enter a video ID' });
      return null;
    }

    setIsConfiguring(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/vimeo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, action: 'configure-domains' }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError({ error: result.error, message: result.message });
        return null;
      }

      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to configure domains. Please try again.';
      setError({ error: 'Configuration failed', message });
      return null;
    } finally {
      setIsConfiguring(false);
    }
  }, []);

  return {
    isConfiguring,
    error,
    configureDomains,
  };
}

// ============ Video Library Hook ============

interface VimeoVideoListResult {
  videos: VimeoVideoMetadata[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface UseVimeoVideosReturn {
  /** List of videos (filtered if search query is set) */
  videos: VimeoVideoMetadata[];
  /** Total number of videos (filtered count if searching) */
  total: number;
  /** Current page */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Whether loading */
  isLoading: boolean;
  /** Error message */
  error: VimeoFetchError | null;
  /** Search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Go to page */
  goToPage: (page: number) => void;
  /** Refresh the list */
  refresh: () => void;
}

const VIDEOS_PER_PAGE = 12;

/**
 * Hook to browse videos from the user's Vimeo account
 *
 * Uses client-side filtering because Vimeo's server-side search
 * doesn't reliably index all videos (especially unlisted ones).
 *
 * @example
 * const { videos, isLoading, query, setQuery, goToPage } = useVimeoVideos();
 */
export function useVimeoVideos(): UseVimeoVideosReturn {
  // All videos fetched from API (unfiltered)
  const [allVideos, setAllVideos] = useState<VimeoVideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<VimeoFetchError | null>(null);
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [apiPage, setApiPage] = useState(1);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter videos client-side based on search query
  const filteredVideos = debouncedQuery
    ? allVideos.filter((v) =>
        v.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : allVideos;

  // Calculate pagination for filtered results
  const total = filteredVideos.length;
  const totalPages = Math.ceil(total / VIDEOS_PER_PAGE);
  const startIndex = (page - 1) * VIDEOS_PER_PAGE;
  const videos = filteredVideos.slice(startIndex, startIndex + VIDEOS_PER_PAGE);

  const fetchVideos = useCallback(async (pageToFetch: number = 1, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch a larger batch (100 per page) to get all videos quickly
      const params = new URLSearchParams({
        list: 'true',
        page: pageToFetch.toString(),
        perPage: '100', // Fetch max to minimize API calls
      });

      const response = await fetch(`/api/admin/vimeo?${params.toString()}`);
      const result: VimeoVideoListResult = await response.json();

      if (!response.ok) {
        setError({
          error: 'Fetch failed',
          message: (result as unknown as VimeoFetchError).message || 'Failed to load videos',
        });
        return;
      }

      if (append) {
        setAllVideos((prev) => [...prev, ...result.videos]);
      } else {
        setAllVideos(result.videos);
      }

      setApiTotalPages(result.totalPages);
      setApiPage(pageToFetch);

      // Check if we've loaded all pages
      if (pageToFetch >= result.totalPages) {
        setHasLoadedAll(true);
      }
    } catch (err) {
      setError({
        error: 'Fetch failed',
        message: err instanceof Error ? err.message : 'Failed to load videos',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVideos(1, false);
  }, [fetchVideos]);

  // Load more pages if needed (for larger libraries)
  useEffect(() => {
    if (!isLoading && !hasLoadedAll && apiPage < apiTotalPages) {
      fetchVideos(apiPage + 1, true);
    }
  }, [isLoading, hasLoadedAll, apiPage, apiTotalPages, fetchVideos]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const refresh = useCallback(() => {
    setHasLoadedAll(false);
    setApiPage(1);
    fetchVideos(1, false);
  }, [fetchVideos]);

  return {
    videos,
    total,
    page,
    totalPages,
    isLoading: isLoading && allVideos.length === 0, // Only show loading on initial fetch
    error,
    query,
    setQuery,
    goToPage,
    refresh,
  };
}
