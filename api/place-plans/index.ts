import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { jsonError, methodNotAllowed, requestBody, requireSameOrigin } from '../_lib/http.js';
import { reportApiError } from '../_lib/errors.js';
import { validatePlacePlanVisits } from '../_lib/placePlan.js';
import { consumeRateLimit, guestSessionValid } from '../_lib/security.js';
import { supabaseError, supabaseFetch } from '../_lib/supabase.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  const body = requestBody(req);
  const visits = body ? validatePlacePlanVisits(body.visits) : null;
  if (!visits) {
    jsonError(res, 400, 'Pilih 1 sampai 6 tempat dengan nama, waktu, dan link Google Maps yang valid.');
    return;
  }

  try {
    if (!guestSessionValid(req)) {
      jsonError(res, 401, 'Birthday verification is required. Please start again from the gate.');
      return;
    }
    if (!(await consumeRateLimit(req, 'place-plan-submit', 10, 60 * 60))) {
      jsonError(res, 429, 'Batas kirim rencana tercapai. Coba lagi nanti ya.');
      return;
    }

    const response = await supabaseFetch('/rest/v1/place_plan_submissions', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ visits }),
    });
    if (!response.ok) throw await supabaseError(response);
    res.status(201).json({ saved: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
