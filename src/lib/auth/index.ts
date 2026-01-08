import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'session';
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

interface TokenPayload {
  sub: string;
  role: 'ADMIN';
  iat: number;
  exp: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token with the admin secret
 */
/**
 * Sign a JWT token with the admin secret
 */
export async function signToken(username: string, role: 'ADMIN' | 'MEMBER'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    role: role,
    iat: now,
    exp: now + SEVEN_DAYS_IN_SECONDS,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_IN_SECONDS,
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

/**
 * Get the current session
 */
export async function getSession(): Promise<TokenPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyToken(token);
}
