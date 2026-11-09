import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import {
  jsonError,
  methodNotAllowed,
  requestBody,
  requireSameOrigin,
  setCookie,
} from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import {
  ADMIN_SESSION_COOKIE,
  adminGateValid,
  consumeRateLimit,
  isAdminUser,
} from '../_lib/security.js';
import { supabaseFetch } from '../_lib/supabase.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;
  if (!adminGateValid(req)) {
    jsonError(res, 401, 'Selesaikan verifikasi tanggal admin terlebih dahulu.');
    return;
  }

  const body = requestBody(req);
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    body.email.length > 254 ||
    body.password.length < 1 ||
    body.password.length > 1024
  ) {
    jsonError(res, 400, 'Email dan password diperlukan.');
    return;
  }

  try {
    if (!(await consumeRateLimit(req, 'admin-login', 8, 15 * 60))) {
      jsonError(res, 429, 'Terlalu banyak percobaan login. Tunggu sebelum mencoba lagi.');
      return;
    }

    const response = await supabaseFetch(
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: body.email.trim(), password: body.password }),
      },
      'anon'
    );

    if (response.status === 400 || response.status === 401) {
      jsonError(res, 401, 'Email atau password tidak cocok.');
      return;
    }
    if (!response.ok) throw new Error('Supabase Auth sign-in failed.');

    const authResult: unknown = await response.json();
    if (
      !authResult ||
      typeof authResult !== 'object' ||
      typeof (authResult as { access_token?: unknown }).access_token !== 'string' ||
      !isAdminUser((authResult as { user?: unknown }).user)
    ) {
      jsonError(res, 403, 'Akun ini belum diberi izin administrator.');
      return;
    }

    const result = authResult as { access_token: string; expires_in?: number };
    const maxAge =
      typeof result.expires_in === 'number'
        ? Math.max(60, Math.min(result.expires_in, 60 * 60))
        : 60 * 60;
    setCookie(res, ADMIN_SESSION_COOKIE, result.access_token, maxAge);
    setCookie(res, ADMIN_SESSION_COOKIE, result.access_token, maxAge);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
