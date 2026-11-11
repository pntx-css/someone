import type { ApiRequest, ApiResponse } from './_lib/http.js';
import adminBirthdayVerify from './admin/birthday/verify.js';
import adminExport from './admin/export.js';
import adminGate from './admin/gate.js';
import adminLogin from './admin/login.js';
import adminLogout from './admin/logout.js';
import adminMessage from './admin/messages/[id].js';
import adminMessages from './admin/messages/index.js';
import adminPlan from './admin/plans/[id].js';
import adminPlans from './admin/plans/index.js';
import adminSession from './admin/session.js';
import birthdayVerify from './birthday/verify.js';
import placePlans from './place-plans/index.js';
import wishlist from './wishlist/index.js';
import { jsonError } from './_lib/http.js';

type ApiHandler = (req: ApiRequest, res: ApiResponse) => void | Promise<void>;

const staticRoutes: Record<string, ApiHandler> = {
  '/api/admin/birthday/verify': adminBirthdayVerify,
  '/api/admin/export': adminExport,
  '/api/admin/gate': adminGate,
  '/api/admin/login': adminLogin,
  '/api/admin/logout': adminLogout,
  '/api/admin/messages': adminMessages,
  '/api/admin/plans': adminPlans,
  '/api/admin/session': adminSession,
  '/api/birthday/verify': birthdayVerify,
  '/api/place-plans': placePlans,
  '/api/wishlist': wishlist,
};

export default async function dispatchApiRequest(
  req: ApiRequest,
  res: ApiResponse
): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  const handler = staticRoutes[pathname];
  if (handler) {
    await handler(req, res);
    return;
  }

  const messageMatch = pathname.match(/^\/api\/admin\/messages\/([^/]+)$/);
  if (messageMatch) {
    req.query = { ...req.query, id: messageMatch[1] };
    await adminMessage(req, res);
    return;
  }

  const planMatch = pathname.match(/^\/api\/admin\/plans\/([^/]+)$/);
  if (planMatch) {
    req.query = { ...req.query, id: planMatch[1] };
    await adminPlan(req, res);
    return;
  }

  jsonError(res, 404, 'API route not found.');
}
