import type { ApiRequest, ApiResponse } from '../../_lib/http.js';
import { jsonError, methodNotAllowed, requestBody, requireSameOrigin } from '../../_lib/http.js';
import { reportApiError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/security.js';
import { supabaseFetch, supabaseError } from '../../_lib/supabase.js';

const messageId = (req: ApiRequest): string | null => {
  const rawId = req.query?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
};

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    methodNotAllowed(res, ['PATCH', 'DELETE']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  try {
    if (!(await requireAdmin(req, res))) return;
    const id = messageId(req);
    if (!id) {
      jsonError(res, 400, 'Invalid wishlist message id.');
      return;
    }

    if (req.method === 'PATCH') {
      const body = requestBody(req);
      if (!body || typeof body.is_read !== 'boolean') {
        jsonError(res, 400, 'A boolean is_read value is required.');
        return;
      }

      const response = await supabaseFetch(
        `/rest/v1/wishlist_messages?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ is_read: body.is_read }),
        }
      );
      if (!response.ok) throw await supabaseError(response);
      const rows: unknown = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        jsonError(res, 404, 'Wishlist message not found.');
        return;
      }
      res.status(200).json({ updated: true });
      return;
    }

    const response = await supabaseFetch(
      `/rest/v1/wishlist_messages?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } }
    );
    if (!response.ok) throw await supabaseError(response);
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      jsonError(res, 404, 'Wishlist message not found.');
      return;
    }
    res.status(200).json({ deleted: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
