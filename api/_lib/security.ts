import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './http.js';
import { jsonError, readCookie, requestIp, setCookie } from './http.js';
import { supabaseFetch } from './supabase.js';

export const BIRTHDAY_COOKIE = 'birthday_session';
export const ADMIN_GATE_COOKIE = 'admin_birthday_gate';
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const BIRTHDAY_SESSION_SECONDS = 60 * 60;

const birthdaySecret = (): string => {
  const secret = process.env.BIRTHDAY_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BIRTHDAY_SECRET must contain at least 32 characters.');
  }
  return secret;
};

const hmac = (value: string): Buffer =>
  createHmac('sha256', birthdaySecret()).update(value).digest();

export const configuredBirthdayMatches = (
  date: string,
  configurationName: 'BIRTHDAY_DATE' | 'ADMIN_BIRTHDAY_DATE'
): boolean => {
  const expected = process.env[configurationName];
  if (!expected || !/^\d{4}-\d{2}-\d{2}$/.test(expected)) {
    throw new Error(`${configurationName} must be configured as YYYY-MM-DD.`);
  }
  const expectedDate = new Date(`${expected}T00:00:00.000Z`);
  if (Number.isNaN(expectedDate.getTime()) || expectedDate.toISOString().slice(0, 10) !== expected) {
    throw new Error(`${configurationName} must be a valid calendar date.`);
  }

  const supplied = Buffer.from(date);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
};

export const birthdayFromBody = (body: Record<string, unknown>): string | null => {
  const { day, month, year } = body;
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    typeof day !== 'number' ||
    typeof month !== 'number' ||
    typeof year !== 'number' ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

export const createBirthdaySession = (purpose: 'guest' | 'admin'): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + BIRTHDAY_SESSION_SECONDS;
  const signature = hmac(`${purpose}:${expiresAt}`).toString('base64url');
  return `${expiresAt}.${signature}`;
};

export const isValidBirthdaySession = (
  value: string | null,
  purpose: 'guest' | 'admin'
): boolean => {
  if (!value) return false;
  const separator = value.indexOf('.');
  if (separator <= 0) return false;

  const expiresAt = Number(value.slice(0, separator));
  const signature = Buffer.from(value.slice(separator + 1), 'base64url');
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expected = hmac(`${purpose}:${expiresAt}`);
  return signature.length === expected.length && timingSafeEqual(signature, expected);
};

export const guestSessionValid = (req: ApiRequest): boolean =>
  isValidBirthdaySession(readCookie(req, BIRTHDAY_COOKIE), 'guest');

export const adminGateValid = (req: ApiRequest): boolean =>
  isValidBirthdaySession(readCookie(req, ADMIN_GATE_COOKIE), 'admin');

export const hashRateLimitKey = (req: ApiRequest, purpose: string): string =>
  hmac(`${purpose}:${requestIp(req)}`).toString('hex');

const localRateLimits = new Map<string, { count: number; resetsAt: number }>();
let warnedAboutLocalRateLimit = false;

export const consumeRateLimit = async (
  req: ApiRequest,
  purpose: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> => {
  const isLocalDevelopment =
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL !== '1';

  if (isLocalDevelopment) {
    if (!warnedAboutLocalRateLimit) {
      console.info('Using in-memory rate limits for local development only.');
      warnedAboutLocalRateLimit = true;
    }

    const now = Date.now();
    const key = `${purpose}:${hashRateLimitKey(req, purpose)}`;
    const current = localRateLimits.get(key);
    if (!current || current.resetsAt <= now) {
      localRateLimits.set(key, { count: 1, resetsAt: now + windowSeconds * 1000 });
      return true;
    }

    current.count += 1;
    return current.count <= limit;
  }

  const response = await supabaseFetch('/rest/v1/rpc/consume_request_limit', {
    method: 'POST',
    body: JSON.stringify({
      p_client_key: hashRateLimitKey(req, purpose),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    }),
  });
  if (!response.ok) throw new Error('Request rate limit could not be checked.');
  return (await response.json()) === true;
};

export const requireAdmin = async (req: ApiRequest, res: ApiResponse): Promise<boolean> => {
  const accessToken = readCookie(req, ADMIN_SESSION_COOKIE);
  if (!accessToken) {
    jsonError(res, 401, 'Please sign in as an administrator.');
    return false;
  }

  const response = await supabaseFetch(
    '/auth/v1/user',
    { headers: { Authorization: `Bearer ${accessToken}` } },
    'anon'
  );
  if (response.status === 401 || response.status === 403) {
    clearBirthdaySessionCookie(res, ADMIN_SESSION_COOKIE);
    jsonError(res, 401, 'Your admin session has expired. Please sign in again.');
    return false;
  }
  if (!response.ok) throw new Error('Could not verify the administrator session.');

  const user: unknown = await response.json();
  if (!isAdminUser(user)) {
    clearBirthdaySessionCookie(res, ADMIN_SESSION_COOKIE);
    jsonError(res, 403, 'This account does not have administrator access.');
    return false;
  }
  return true;
};

export const isAdminUser = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const appMetadata = (value as { app_metadata?: unknown }).app_metadata;
  if (!appMetadata || typeof appMetadata !== 'object') return false;

  const metadata = appMetadata as { role?: unknown; roles?: unknown };
  return (
    metadata.role === 'admin' ||
    (Array.isArray(metadata.roles) && metadata.roles.includes('admin'))
  );
};

export const clearBirthdaySessionCookie = (res: ApiResponse, cookieName: string): void => {
  setCookie(res, cookieName, '', 0);
};
