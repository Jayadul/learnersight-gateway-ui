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
  channelConfigs:   `${BASE}/channel-configs`,
  fallbackPolicies: `${BASE}/fallback-policies`,
  messageRequests:  `${BASE}/message-requests`,
  dispatchLogs:     `${BASE}/dispatch-logs`,
  apiLogs:          `${BASE}/api-logs`,
  manualSend:       `${BASE}/manual-send`,
  voiceReports: {
    sync: `${BASE}/voice-reports/sync`,
  },
} as const;
