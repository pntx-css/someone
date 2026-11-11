import type { VercelRequest, VercelResponse } from '@vercel/node';

export type ApiRequest = VercelRequest;
export type ApiResponse = VercelResponse;

export const jsonError = (res: ApiResponse, status: number, error: string) =>
  res.status(status).json({ error });

export const methodNotAllowed = (res: ApiResponse, methods: string[]) => {
  res.setHeader('Allow', methods.join(', '));
  return jsonError(res, 405, 'Method not allowed.');
};

export const requireSameOrigin = (req: ApiRequest, res: ApiResponse): boolean => {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  if (typeof origin !== 'string' || typeof host !== 'string') {
    jsonError(res, 403, 'Request origin could not be verified.');
    return false;
  }

  try {
    if (new URL(origin).host.toLowerCase() !== host.split(',')[0].trim().toLowerCase()) {
      jsonError(res, 403, 'Request origin could not be verified.');
      return false;
    }
  } catch {
    jsonError(res, 403, 'Request origin could not be verified.');
    return false;
  }

  return true;
};

export const requestBody = (req: ApiRequest): Record<string, unknown> | null => {
  if (!req.headers['content-type']?.toLowerCase().includes('application/json')) return null;
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
};

export const requestIp = (req: ApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const value = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return value || req.socket.remoteAddress || 'unknown';
};

export const readCookie = (req: ApiRequest, name: string): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join('='));
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const setCookie = (
  res: ApiResponse,
  name: string,
  value: string,
  maxAgeSeconds: number
): void => {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (secure) parts.push('Secure');
  const existing = res.getHeader('Set-Cookie');
  const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  res.setHeader('Set-Cookie', [...cookies, parts.join('; ')]);
};

export const clientWantsJson = (req: ApiRequest): boolean =>
  req.headers.accept?.includes('application/json') ?? false;
