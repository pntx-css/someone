import type { ApiRequest, ApiResponse } from '../../_lib/http.js';
import { jsonError, methodNotAllowed, requireSameOrigin } from '../../_lib/http.js';
import { reportApiError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/security.js';
import { supabaseError, supabaseFetch } from '../../_lib/supabase.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE']);
    return;
  }
  if (!requireSameOrigin(req, res)) return;

  try {
    if (!(await requireAdmin(req, res))) return;
    const rawId = req.query?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      jsonError(res, 400, 'ID rencana tidak valid.');
      return;
    }

    const response = await supabaseFetch(
      `/rest/v1/place_plan_submissions?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } }
    );
    if (!response.ok) throw await supabaseError(response);
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      jsonError(res, 404, 'Rencana tidak ditemukan.');
      return;
    }
    res.status(200).json({ deleted: true });
  } catch (error) {
    reportApiError(res, error);
  }
}
