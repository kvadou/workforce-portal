import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  listDesigns,
  getDesign,
  refreshAccessToken,
  tokensNeedRefresh,
  getEmbedUrl,
  type CanvaApiError,
} from '@/lib/canva';

/**
 * Helper to get valid access token, refreshing if needed
 */
async function getValidAccessToken(): Promise<{
  accessToken: string;
  connection: {
    id: string;
    displayName: string | null;
    canvaUserId: string | null;
    createdAt: Date;
  };
} | null> {
  const connection = await prisma.canvaConnection.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!connection) {
    return null;
  }

  // Check if token needs refresh
  if (tokensNeedRefresh(connection.expiresAt.getTime())) {
    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);

      // Update stored tokens
      await prisma.canvaConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(newTokens.expires_at),
          scope: newTokens.scope,
        },
      });

      return {
        accessToken: newTokens.access_token,
        connection: {
          id: connection.id,
          displayName: connection.displayName,
          canvaUserId: connection.canvaUserId,
          createdAt: connection.createdAt,
        },
      };
    } catch (error) {
      console.error('Failed to refresh Canva token:', error);
      // Token refresh failed - connection is invalid
      await prisma.canvaConnection.delete({ where: { id: connection.id } });
      return null;
    }
  }

  return {
    accessToken: connection.accessToken,
    connection: {
      id: connection.id,
      displayName: connection.displayName,
      canvaUserId: connection.canvaUserId,
      createdAt: connection.createdAt,
    },
  };
}

/**
 * GET /api/admin/canva
 * - ?status=true - Get connection status
 * - ?list=true&query=xxx&continuation=xxx - List designs
 * - ?designId=xxx - Get single design
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  // Status check
  if (searchParams.get('status') === 'true') {
    const result = await getValidAccessToken();

    if (!result) {
      return NextResponse.json({
        connected: false,
        message: 'Canva is not connected',
      });
    }

    return NextResponse.json({
      connected: true,
      displayName: result.connection.displayName,
      canvaUserId: result.connection.canvaUserId,
      connectedAt: result.connection.createdAt,
    });
  }

  // Get access token
  const tokenResult = await getValidAccessToken();

  if (!tokenResult) {
    return NextResponse.json(
      {
        error: 'Not connected',
        code: 'NOT_CONNECTED',
        message: 'Canva is not connected. Please connect your Canva account first.',
      },
      { status: 503 }
    );
  }

  const { accessToken } = tokenResult;

  // List designs
  if (searchParams.get('list') === 'true') {
    const query = searchParams.get('query') || undefined;
    const continuation = searchParams.get('continuation') || undefined;
    const ownership = searchParams.get('ownership') as 'any' | 'owned' | 'shared' | undefined;

    try {
      const result = await listDesigns(accessToken, {
        query,
        continuation,
        ownership: ownership || 'any',
        sortBy: query ? 'relevance' : 'modified_descending',
        limit: 24,
      });

      // Add embed URLs to each design
      const designsWithEmbed = result.designs.map((design) => ({
        ...design,
        embedUrl: getEmbedUrl(design.urls.view_url),
      }));

      return NextResponse.json({
        designs: designsWithEmbed,
        continuation: result.continuation,
      });
    } catch (error) {
      const canvaError = error as CanvaApiError;
      console.error('Canva list designs error:', error);

      return NextResponse.json(
        {
          error: canvaError.error || 'API error',
          message: canvaError.message || 'Unable to fetch designs from Canva.',
        },
        {
          status:
            canvaError.code === 'UNAUTHORIZED'
              ? 401
              : canvaError.code === 'RATE_LIMITED'
                ? 429
                : 500,
        }
      );
    }
  }

  // Get single design
  const designId = searchParams.get('designId');

  if (designId) {
    try {
      const design = await getDesign(accessToken, designId);

      return NextResponse.json({
        ...design,
        embedUrl: getEmbedUrl(design.urls.view_url),
      });
    } catch (error) {
      const canvaError = error as CanvaApiError;
      console.error('Canva get design error:', error);

      return NextResponse.json(
        {
          error: canvaError.error || 'API error',
          message: canvaError.message || 'Unable to fetch design from Canva.',
        },
        {
          status:
            canvaError.code === 'NOT_FOUND'
              ? 404
              : canvaError.code === 'UNAUTHORIZED'
                ? 401
                : 500,
        }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

/**
 * DELETE /api/admin/canva
 * Disconnect Canva account
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.canvaConnection.deleteMany({});

  return NextResponse.json({ success: true, message: 'Canva disconnected' });
}
