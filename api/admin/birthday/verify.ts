import type { ApiRequest, ApiResponse } from '../../_lib/http.js';
import {
  jsonError,
  methodNotAllowed,
  requestBody,
  requireSameOrigin,
  setCookie,
} from '../../_lib/http.js';
import { reportApiError } from '../../_lib/errors.js';
import {
  ADMIN_GATE_COOKIE,
  BIRTHDAY_SESSION_SECONDS,
  birthdayFromBody,
  configuredBirthdayMatches,
  consumeRateLimit,
  createBirthdaySession,
} from '../../_lib/security.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  const body = requestBody(req);
  if (!body) {
    jsonError(res, 400, 'A JSON date is required.');
    return;
  }

  try {
    if (!(await consumeRateLimit(req, 'admin-birthday', 5, 15 * 60))) {
      jsonError(res, 429, 'Too many attempts. Please wait and try again.');
      return;
    }

    const date = birthdayFromBody(body);
    if (!date || !configuredBirthdayMatches(date, 'ADMIN_BIRTHDAY_DATE')) {
      jsonError(res, 401, 'Kok salah? Kamu boong ke aku ya, soal tanggal lahir kamu?');
      return;
    }

    setCookie(
      res,
      ADMIN_GATE_COOKIE,
      createBirthdaySession('admin'),
      BIRTHDAY_SESSION_SECONDS
    );
    res.status(200).json({ verified: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
