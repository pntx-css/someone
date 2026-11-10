import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import {
  methodNotAllowed,
  readCookie,
  requireSameOrigin,
} from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import {
  clearBirthdaySessionCookie,
  ADMIN_GATE_COOKIE,
  ADMIN_SESSION_COOKIE,
} from '../_lib/security.js';
import { supabaseError, supabaseFetch } from '../_lib/supabase.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  try {
    if (token) {
      const response = await supabaseFetch(
        '/auth/v1/logout',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
        'anon'
      );
      if (!response.ok && response.status !== 401) {
        throw await supabaseError(response, 'POST /auth/v1/logout');
      }
    }
    clearBirthdaySessionCookie(res, ADMIN_SESSION_COOKIE);
    clearBirthdaySessionCookie(res, ADMIN_GATE_COOKIE);
    res.status(200).json({ loggedOut: true });
  } catch (error) {
    clearBirthdaySessionCookie(res, ADMIN_SESSION_COOKIE);
    clearBirthdaySessionCookie(res, ADMIN_GATE_COOKIE);
    reportApiError(res, error);
  }
}
