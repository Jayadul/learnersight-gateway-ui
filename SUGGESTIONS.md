# NetZeroGateway UI — Suggestions & Future Improvements

## Missing Features (API endpoints with no UI yet)

1. **Separate SMS / WhatsApp / Voice channel pages**
   - The Postman collection and architecture support per-channel message views
   - Currently only the unified `Message Logs` page exists
   - Each channel page should show filtered dispatch jobs with a "Send" button opening a side drawer

2. **Message Request detail page** (`/logs/messages/:id`)
   - Currently only accessible via side drawer from the list
   - A dedicated route would enable deep-linking and better URL sharing
   - Already has `MessageRequestDetailDto` with full job tree

3. **Dispatch log detail**
   - Currently no detail view for individual dispatch jobs
   - Should show: raw request sent to provider, raw response, failure reason, fallback chain

4. **Dashboard: provider health indicators**
   - Show active provider per channel (from channel-configs `isActive`)
   - Color-coded status dots (green = active, grey = no config)
   - Click-through to Channel Configs page

5. **Voice report history**
   - Synced voice records are ephemeral (lost on component destroy)
   - Should persist synced records with session storage or a dedicated API endpoint
   - Consider adding date range quick-select buttons (Today, Last 7 days, This month)

6. **API export endpoints** (if backend adds them)
   - Dispatch Logs CSV export button exists but the export only covers the current page
   - API Logs has no CSV export yet
   - Both should export filtered result sets, not just current page

---

## Performance Improvements

1. **Virtual scrolling** for large log tables
   - `CdkVirtualScrollViewport` from `@angular/cdk/scrolling`
   - Apply to Dispatch Logs and API Logs where data volume can be large

2. **`trackBy` completeness audit**
   - All `@for` loops use `track` ✅ (Angular 18 control flow)
   - Verify all `*ngFor` in sub-components that haven't been migrated

3. **Lazy-load ApexCharts**
   - `ng-apexcharts` / `apexcharts` adds ~250KB to the dashboard bundle
   - Consider dynamic import inside `TimelineChartComponent` to defer load

4. **HTTP response caching**
   - Dashboard summary, channel configs, and fallback policies change infrequently
   - Add a simple `shareReplay(1)` or a cache interceptor for GET-only routes

5. **`OnPush` everywhere + detach on hidden panels**
   - Consider `ChangeDetectorRef.detach()` on drawer/dialog components when closed

---

## Future Considerations

1. **PWA (Progressive Web App)**
   - Add `@angular/pwa` for offline capability
   - Service worker pre-cache: dashboard, logs (read-only)

2. **i18n (Internationalization)**
   - Angular's built-in `$localize` is the right approach
   - Locale: `en` + `bn` (Bengali) likely for this BD-focused gateway

3. **Dark mode toggle**
   - CSS custom properties are already in place in `_tokens.scss`
   - Add a `[data-theme=dark]` block with inverted values
   - Store preference in `localStorage` (UX state, not sensitive)

4. **Role-based sidebar filtering**
   - Currently uses `*appHasRole` directive to hide Users menu item
   - Consider filtering `groups` array reactively based on user role signal
   - This eliminates the DOM element entirely vs. hiding with CSS

5. **Token refresh UX**
   - With refresh token now in memory only, page refresh requires re-login
   - Consider a "session about to expire" warning (5 min before JWT exp)
   - Use `setInterval` in `AuthService` checking `exp - Date.now()`

6. **Audit log**
   - Track admin actions: who created/updated/deleted configs and users
   - Requires backend endpoint; UI would be a simple log page

---

## API Inconsistencies Observed in Postman Collection

1. **`/api/apikeys` is not in the Postman collection** — only implied by the mock interceptor
   - URL paths: `/api/apikeys/generate` and `/api/apikeys/:id/revoke`
   - Confirm these are the actual backend paths before connecting real backend

2. **Channel type string vs numeric ambiguity**
   - Postman bodies use `"channelType": "SMS"` (string) for channel configs and fallback policies
   - Frontend enums and mock interceptor use numeric values (0, 1, 2, 3)
   - Verify backend's `[JsonConverter]` setting — add `[JsonStringEnumConverter]` if strings are canonical

3. **`/sendtext` (gateway endpoint) uses `application/x-www-form-urlencoded`** not JSON
   - This is intentional (x-soft compatibility) but worth documenting for integrators
   - The admin panel should never need to call this directly

4. **Postman `baseUrl` is `http://localhost:5164` but `environment.ts` uses `http://localhost:8080`**
   - Align these before connecting the real backend to avoid 404s

5. **`AdminRole` in Postman is `"Admin"` / `"SuperAdmin"` (string) but frontend uses `AdminRole.Admin = 1`**
   - Same concern as channel type — verify backend serialization

6. **No pagination on fallback policies or channel configs**
   - Both return flat arrays — fine if bounded, but could grow large
   - Consider adding paging params to `GET /api/channel-configs` and `GET /api/fallback-policies`
