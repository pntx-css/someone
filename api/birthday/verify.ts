import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { jsonError, methodNotAllowed, requestBody, requireSameOrigin, setCookie } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import {
  birthdayFromBody,
  configuredBirthdayMatches,
  consumeRateLimit,
  createBirthdaySession,
  BIRTHDAY_COOKIE,
  BIRTHDAY_SESSION_SECONDS,
  ADMIN_GATE_COOKIE,
} from '../_lib/security.js';

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
    if (!(await consumeRateLimit(req, 'birthday-entry', 5, 15 * 60))) {
      jsonError(res, 429, 'Too many attempts. Please wait and try again.');
      return;
    }

    const date = birthdayFromBody(body);
    if (!date) {
      jsonError(res, 401, 'Kok salah? Kamu boong ke aku ya, soal tanggal lahir kamu?');
      return;
    }

    if (configuredBirthdayMatches(date, 'ADMIN_BIRTHDAY_DATE')) {
      setCookie(
        res,
        ADMIN_GATE_COOKIE,
        createBirthdaySession('admin'),
        BIRTHDAY_SESSION_SECONDS
      );
      res.status(200).json({ verified: true, destination: 'admin' });
      return;
    }

    if (configuredBirthdayMatches(date, 'BIRTHDAY_DATE')) {
      setCookie(
        res,
        BIRTHDAY_COOKIE,
        createBirthdaySession('guest'),
        BIRTHDAY_SESSION_SECONDS
      );
      res.status(200).json({ verified: true, destination: 'journey' });
      return;
    }

    jsonError(res, 401, 'Kok salah? Kamu boong ke aku ya, soal tanggal lahir kamu?');
  } catch (error) {
    reportApiError(res, error);
  }
}
