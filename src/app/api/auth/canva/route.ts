import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthorizationUrl, generateCodeVerifier } from '@/lib/canva';
import { randomBytes } from 'crypto';

/**
 * GET /api/auth/canva
 * Initiates the Canva OAuth flow with PKCE
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Determine the correct redirect URI based on the request
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/canva/callback`;

  // Generate a state parameter for CSRF protection
  const state = randomBytes(16).toString('hex');

  // Generate PKCE code verifier
  const codeVerifier = generateCodeVerifier();

  // Get authorization URL with PKCE challenge
  const authUrl = await getAuthorizationUrl(redirectUri, state, codeVerifier);

  const response = NextResponse.redirect(authUrl);

  // Set state cookie (httpOnly, secure in production)
  response.cookies.set('canva_oauth_state', state, {
    httpOnly: true,
    secure: protocol === 'https',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store redirect URI for callback
  response.cookies.set('canva_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: protocol === 'https',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  // Store PKCE code verifier for callback
  response.cookies.set('canva_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: protocol === 'https',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  return response;
}
