const BASE = '/api';

/**
 * Single source of truth for every backend API path.
 * All services and interceptors import from here — no raw strings elsewhere.
 * Paths are relative (no host/port) so environment.apiUrl is prepended at call sites.
 */
export const ApiEndpoints = {
  auth: {
    login:   `${BASE}/auth/login`,
    refresh: `${BASE}/auth/refresh`,
    logout:  `${BASE}/auth/logout`,
  },
  dashboard: {
    summary:          `${BASE}/dashboard/summary`,
    timeline:         `${BASE}/dashboard/timeline`,
    channelBreakdown: `${BASE}/dashboard/channel-breakdown`,
    failureReasons:   `${BASE}/dashboard/failure-reasons`,
  },
  adminUsers:       `${BASE}/admin/users`,
  gatewayCredentials: `${BASE}/gateway-credentials`,
  channelConfigs:   `${BASE}/channel-configs`,
  channelBalances:  `${BASE}/channel-balances`,
  statusSync: {
    channels: `${BASE}/status-sync/channels`,
    channel:  `${BASE}/status-sync/channels`,
  },
  resendRecipients: `${BASE}/dispatch-jobs/recipients/resend`,
  fallbackPolicies: `${BASE}/fallback-policies`,
  messageRequests:  `${BASE}/message-requests`,
  dispatchLogs:     `${BASE}/dispatch-logs`,
  apiLogs:          `${BASE}/api-logs`,
  manualSend:       `${BASE}/manual-send`,
  media:            `${BASE}/media`,
  backupExport:     `${BASE}/backup/export`,
  // Gateway endpoint — lives at the API root, NOT under /api
  sendText:         '/sendtext',
} as const;
