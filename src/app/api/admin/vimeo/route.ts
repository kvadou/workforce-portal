import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  fetchVideoMetadata,
  fetchMyVideos,
  getEmbedDomains,
  configureAllEmbedDomains,
  ALLOWED_EMBED_DOMAINS,
  type VimeoApiError,
} from '@/lib/vimeo';

/**
 * GET /api/admin/vimeo?videoId=123456789
 * Fetch video metadata from Vimeo
 *
 * GET /api/admin/vimeo?list=true&query=search&page=1
 * List videos from user's Vimeo account
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.VIMEO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'Vimeo API not configured',
        message:
          'VIMEO_ACCESS_TOKEN environment variable is not set. You can enter video details manually.',
      },
      { status: 503 }
    );
  }

  // Check if this is a list request
  const listVideos = request.nextUrl.searchParams.get('list') === 'true';

  if (listVideos) {
    const query = request.nextUrl.searchParams.get('query') || undefined;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const perPage = parseInt(
      request.nextUrl.searchParams.get('perPage') || '25',
      10
    );

    // Use VIMEO_USER_ID if set (for team/org accounts where videos are owned by the org)
    const userId = process.env.VIMEO_USER_ID || undefined;

    try {
      const result = await fetchMyVideos(accessToken, query, page, perPage, userId);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Vimeo list error:', error);
      return NextResponse.json(
        {
          error: 'API error',
          message: 'Unable to fetch videos from Vimeo.',
        },
        { status: 500 }
      );
    }
  }

  // Single video metadata request
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch metadata and embed domains in parallel
    const [metadata, embedDomains] = await Promise.all([
      fetchVideoMetadata(videoId, accessToken),
      getEmbedDomains(videoId, accessToken),
    ]);

    // Check which required domains are missing
    const missingDomains = ALLOWED_EMBED_DOMAINS.filter(
      (d) => !embedDomains.includes(d)
    );

    return NextResponse.json({
      metadata,
      embedDomains,
      missingDomains,
      allDomainsConfigured: missingDomains.length === 0,
    });
  } catch (error) {
    const vimeoError = error as VimeoApiError;

    if (vimeoError.code) {
      return NextResponse.json(
        { error: vimeoError.error, message: vimeoError.message },
        {
          status:
            vimeoError.code === 'NOT_FOUND'
              ? 404
              : vimeoError.code === 'PRIVATE'
                ? 403
                : vimeoError.code === 'RATE_LIMITED'
                  ? 429
                  : 500,
        }
      );
    }

    console.error('Vimeo API error:', error);
    return NextResponse.json(
      {
        error: 'API error',
        message: 'Unable to fetch video info. You can enter details manually.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vimeo
 * Configure embed domains for a video
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { videoId, action } = body;

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  if (action !== 'configure-domains') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const accessToken = process.env.VIMEO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'Vimeo API not configured',
        message: 'VIMEO_ACCESS_TOKEN environment variable is not set.',
      },
      { status: 503 }
    );
  }

  try {
    const results = await configureAllEmbedDomains(videoId, accessToken);

    return NextResponse.json({
      success: true,
      configuredDomains: results.success,
      failedDomains: results.failed,
      allDomainsConfigured: results.failed.length === 0,
    });
  } catch (error) {
    console.error('Vimeo domain configuration error:', error);
    return NextResponse.json(
      {
        error: 'Configuration failed',
        message:
          'Unable to configure embed domains. Please try again or configure manually in Vimeo.',
      },
      { status: 500 }
    );
  }
}
