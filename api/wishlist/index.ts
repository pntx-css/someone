import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { jsonError, methodNotAllowed, requestBody, requireSameOrigin } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import { guestSessionValid, consumeRateLimit } from '../_lib/security.js';
import { supabaseFetch, supabaseError } from '../_lib/supabase.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  const body = requestBody(req);
  if (!body || typeof body.message !== 'string') {
    jsonError(res, 400, 'A wishlist message is required.');
    return;
  }

  const message = body.message.trim();
  if (!message) {
    jsonError(res, 400, 'Tulis wishlist atau pesanmu dulu ya.');
    return;
  }
  if ([...message].length > 1200) {
    jsonError(res, 413, 'Pesan terlalu panjang. Maksimal 1200 karakter.');
    return;
  }

  try {
    if (!guestSessionValid(req)) {
      jsonError(res, 401, 'Birthday verification is required. Please start again from the gate.');
      return;
    }
    if (!(await consumeRateLimit(req, 'wishlist-submit', 10, 60 * 60))) {
      jsonError(res, 429, 'Batas kirim tercapai. Coba lagi nanti ya.');
      return;
    }

    const response = await supabaseFetch('/rest/v1/wishlist_messages', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw await supabaseError(response);
    res.status(201).json({ sent: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
