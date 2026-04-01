import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exchangeCodeForTokens, getCurrentUser } from '@/lib/canva';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/canva/callback
 * Handles the OAuth callback from Canva
 */
export async function GET(request: NextRequest) {
  // Build base URL from host header (request.url may use internal port behind proxy)
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=error&reason=unauthorized', baseUrl)
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle error from Canva
  if (error) {
    console.error('Canva OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/admin/onboarding/settings?canva=error&reason=${encodeURIComponent(errorDescription || error)}`,
        baseUrl
      )
    );
  }

  // Verify state matches
  const storedState = request.cookies.get('canva_oauth_state')?.value;
  const redirectUri = request.cookies.get('canva_redirect_uri')?.value;

  if (!state || state !== storedState) {
    console.error('Canva OAuth state mismatch');
    return NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=error&reason=invalid_state', baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=error&reason=no_code', baseUrl)
    );
  }

  if (!redirectUri) {
    return NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=error&reason=no_redirect_uri', baseUrl)
    );
  }

  // Get PKCE code verifier from cookie
  const codeVerifier = request.cookies.get('canva_code_verifier')?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=error&reason=no_code_verifier', baseUrl)
    );
  }

  try {
    // Exchange code for tokens (with PKCE verifier)
    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);

    // Get user info from Canva
    let canvaUser;
    try {
      canvaUser = await getCurrentUser(tokens.access_token);
    } catch (e) {
      console.warn('Could not fetch Canva user profile:', e);
    }

    // Delete any existing connections (we only store one)
    await prisma.canvaConnection.deleteMany({});

    // Store the new connection
    await prisma.canvaConnection.create({
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at),
        scope: tokens.scope,
        connectedBy: session.user.id,
        displayName: canvaUser?.display_name || null,
        canvaUserId: canvaUser?.user_id || null,
      },
    });

    // Clear OAuth cookies and redirect to success
    const response = NextResponse.redirect(
      new URL('/admin/onboarding/settings?canva=connected', baseUrl)
    );

    response.cookies.delete('canva_oauth_state');
    response.cookies.delete('canva_redirect_uri');
    response.cookies.delete('canva_code_verifier');

    return response;
  } catch (error) {
    console.error('Canva OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/admin/onboarding/settings?canva=error&reason=${encodeURIComponent('Failed to connect')}`,
        baseUrl
      )
    );
  }
}
