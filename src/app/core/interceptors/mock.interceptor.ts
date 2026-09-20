import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, delay, from, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../api/api-endpoints';

/**
 * Single mock switch. When environment.mock === true, this interceptor answers
 * requests from assets/mock.json and the real network is never hit. When false,
 * it is a no-op. No component or feature service is aware of mock mode.
 *
 * NOTE: mock mode is STATELESS — creates/deletes are echoed back as success but
 * do not persist across reloads. This is intentional and fine for demos.
 */

interface MockDb {
  auth: { login: { accessToken: string; refreshToken: string; expiresIn: number } };
  dashboard: {
    summary: unknown;
    timeline: unknown[];
    channelBreakdown: unknown[];
    failureReasons: unknown[];
  };
  messageRequests: Array<{ id: string }>;
  messageRequestDetails: Record<string, unknown>;
  /** Job-shaped fixtures (predates the per-recipient page) — mapped to the recipient DTO shape below. */
  dispatchJobRecipients: Array<{
    id: string;
    channelType: number;
    toNumber: string;
    messageContent: string;
    status: number;
    providerMessageId: string | null;
    providerRawResponse: string | null;
    sentAt: string | null;
    isFallback: boolean;
    createdAt: string;
  }>;
  apiLogs: unknown[];
  channelConfigs: Array<{ channelType: number }>;
  fallbackPolicies: unknown[];
  adminUsers: Array<{ id: string }>;
}

let cachedDb: MockDb | null = null;

function loadDb(): Observable<MockDb> {
  if (cachedDb) {
    return of(cachedDb);
  }
  return from(
    fetch('assets/mock.json').then((r) => r.json() as Promise<MockDb>),
  ).pipe(switchMap((db) => {
    cachedDb = db;
    return of(db);
  }));
}

function ok<T>(body: T, status = 200): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status, body })).pipe(delay(300));
}

function newGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function pathOf(url: string): string {
  // strip origin + query so matching works for absolute or relative URLs
  const noQuery = url.split('?')[0];
  const idx = noQuery.indexOf('/api/');
  return idx >= 0 ? noQuery.substring(idx) : noQuery;
}

function getQuery(url: string, key: string): string | null {
  const q = url.split('?')[1];
  if (!q) {
    return null;
  }
  return new URLSearchParams(q).get(key);
}

/** Job-shaped fixture -> DispatchJobRecipientDto shape. JobStatus and DeliveryStatus
 * happen to share numeric values for Pending/Sent-Delivered/Failed, so status maps as-is. */
function toRecipientMock(job: MockDb['dispatchJobRecipients'][number]) {
  return {
    id: job.id,
    dispatchJobId: job.id,
    recipient: job.toNumber,
    providerReferenceId: job.providerMessageId,
    deliveryStatus: job.status,
    lastCheckedAt: job.sentAt,
    createdAt: job.createdAt,
    channelType: job.channelType,
    channelLabel: null,
    messageContent: job.messageContent,
    campaignId: null,
    sentAt: job.sentAt,
    isFallback: job.isFallback,
    resentFromRecipientId: null,
    rawProviderResponse: job.providerRawResponse,
  };
}

function page<T>(items: T[], url: string): { items: T[]; totalCount: number; page: number; pageSize: number; totalPages: number } {
  const p = Number(getQuery(url, 'page') ?? '1');
  const size = Number(getQuery(url, 'pageSize') ?? '10');
  const start = (p - 1) * size;
  return {
    items: items.slice(start, start + size),
    totalCount: items.length,
    page: p,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mock) {
    return next(req);
  }

  // Let the mock.json asset request itself pass through to the real fetch above.
  if (req.url.includes('assets/mock.json')) {
    return next(req);
  }

  const path = pathOf(req.url);
  const method = req.method.toUpperCase();

  return loadDb().pipe(
    switchMap((db): Observable<HttpEvent<unknown>> => {
      // ---- Auth ----
      if (path === ApiEndpoints.auth.login && method === 'POST') {
        return ok(db.auth.login);
      }
      if (path === ApiEndpoints.auth.refresh && method === 'POST') {
        return ok(db.auth.login);
      }
      if (path === ApiEndpoints.auth.logout && method === 'POST') {
        return ok(null, 204);
      }

      // ---- Dashboard ----
      if (path === ApiEndpoints.dashboard.summary) {
        return ok(db.dashboard.summary);
      }
      if (path === ApiEndpoints.dashboard.timeline) {
        return ok(db.dashboard.timeline);
      }
      if (path === ApiEndpoints.dashboard.channelBreakdown) {
        return ok(db.dashboard.channelBreakdown);
      }
      if (path === ApiEndpoints.dashboard.failureReasons) {
        return ok(db.dashboard.failureReasons);
      }

      // ---- Message requests ----
      if (path === ApiEndpoints.messageRequests && method === 'GET') {
        return ok(page(db.messageRequests, req.url));
      }
      if (path.startsWith(`${ApiEndpoints.messageRequests}/`) && method === 'GET') {
        const id = path.split('/').pop() as string;
        const detail = db.messageRequestDetails[id] ?? Object.values(db.messageRequestDetails)[0];
        return ok(detail);
      }

      // ---- Message Logs (per recipient, R3.4 — replaces the old dispatch-logs page) ----
      if (path === ApiEndpoints.dispatchJobRecipients && method === 'GET') {
        return ok(page(db.dispatchJobRecipients.map(toRecipientMock), req.url));
      }
      if (path === ApiEndpoints.resendRecipients && method === 'POST') {
        const ids = ((req.body as { recipientIds?: string[] })?.recipientIds) ?? [];
        return ok({
          requested: ids.length,
          resent: ids.length,
          failed: 0,
          skipped: 0,
          outcomes: ids.map((id) => ({
            recipientId: id, recipient: '8801700000000', sent: true,
            newRecipientId: newGuid(), reason: null,
          })),
        });
      }

      // ---- API logs ----
      if (path === ApiEndpoints.apiLogs && method === 'GET') {
        return ok(page(db.apiLogs, req.url));
      }

      // ---- Manual send ----
      if (path === ApiEndpoints.manualSend && method === 'POST') {
        const body = (req.body as { toNumbers?: string }) ?? {};
        const total = (body.toNumbers ?? '').split(',').filter((s) => s.trim()).length;
        return ok({ messageRequestId: newGuid(), status: 'Accepted', totalNumbers: total });
      }

      // ---- Channel configs ----
      if (path === ApiEndpoints.channelConfigs && method === 'GET') {
        const ct = getQuery(req.url, 'channelType');
        const list = ct === null ? db.channelConfigs : db.channelConfigs.filter((c) => c.channelType === Number(ct));
        return ok(list);
      }
      if (path === ApiEndpoints.channelConfigs && method === 'POST') {
        return ok({ id: newGuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isActive: false, configFields: {}, ...(req.body as object) });
      }
      if (path.startsWith(`${ApiEndpoints.channelConfigs}/`) && method === 'PUT') {
        return ok({ id: path.split('/').pop(), updatedAt: new Date().toISOString(), ...(req.body as object) });
      }
      if (path.match(/\/api\/channel-configs\/.+\/activate$/) && method === 'PATCH') {
        return ok(null, 204);
      }
      if (path.startsWith(`${ApiEndpoints.channelConfigs}/`) && method === 'DELETE') {
        return ok(null, 204);
      }

      // ---- Fallback policies ----
      if (path === ApiEndpoints.fallbackPolicies && method === 'GET') {
        return ok(db.fallbackPolicies);
      }
      if (path === ApiEndpoints.fallbackPolicies && method === 'POST') {
        return ok({ id: newGuid(), createdAt: new Date().toISOString(), isActive: true, ...(req.body as object) });
      }
      if (path.startsWith(`${ApiEndpoints.fallbackPolicies}/`) && method === 'PUT') {
        return ok({ id: path.split('/').pop(), ...(req.body as object) });
      }
      if (path.match(/\/api\/fallback-policies\/.+\/toggle-active$/) && method === 'PATCH') {
        return ok(null, 204);
      }
      if (path.startsWith(`${ApiEndpoints.fallbackPolicies}/`) && method === 'DELETE') {
        return ok(null, 204);
      }

      // ---- Admin users ----
      if (path === ApiEndpoints.adminUsers && method === 'GET') {
        return ok(db.adminUsers);
      }
      if (path.startsWith(`${ApiEndpoints.adminUsers}/`) && method === 'GET') {
        const id = path.split('/').pop();
        const found = db.adminUsers.find((u) => u.id === id) ?? db.adminUsers[0];
        return ok(found);
      }
      if (path === ApiEndpoints.adminUsers && method === 'POST') {
        return ok({ id: newGuid(), createdAt: new Date().toISOString(), isActive: true, ...(req.body as object) });
      }
      if (path.startsWith(`${ApiEndpoints.adminUsers}/`) && method === 'PUT') {
        return ok({ id: path.split('/').pop(), ...(req.body as object) });
      }
      if (path.startsWith(`${ApiEndpoints.adminUsers}/`) && method === 'DELETE') {
        return ok(null, 204);
      }

      // Unmatched -> warn and fall through to real network.
      console.warn(`[mock] no handler for ${method} ${path} — falling through`);
      return next(req);
    }),
  );
};
