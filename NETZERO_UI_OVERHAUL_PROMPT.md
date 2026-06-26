# NetZeroGateway UI — Senior Angular Architect Overhaul Prompt
# Use this as your opening message in a Claude Code session

---

## CONTEXT

You are acting as a **Senior Angular Architect and UI/UX Engineer** on the `learnersight-netzero-gateway-ui` project — a production Angular 18 frontend for NetZeroGateway, a multi-channel messaging gateway that proxies between a legacy system (x-soft) and messaging providers (REVE SMS, WaTrend WhatsApp, NetZero Voice).

Your job is a **complete architectural review and UI/UX overhaul** of this application. The app currently works functionally but is unpolished — it needs production-grade code structure, security hardening, modern UI/UX, and proper Angular best practices throughout.

Design inspiration: **ClickUp** — navy/dark sidebar, clean white content area, strong typographic hierarchy, interactive dashboard with real data, consistent iconography, and purposeful use of Angular Material components.

---

## PHASE 0 — DISCOVERY (Do this first, do not skip)

### 0.1 — Read the API contracts
```
/postman/*.json
```
- Parse every Postman collection JSON file in the `/postman/` folder
- Extract all endpoints: method, path, request body shape, response shape, query params, headers
- Build a mental map of: entity names, field names, data types, relationships
- **These JSON files are the single source of truth for all model interfaces** — do not invent or generalize types

### 0.2 — Audit the codebase
Walk the full project tree and inventory:
- All feature modules / standalone components
- All services and what APIs they call
- Current routing structure
- Current Angular Material theme / styles
- Existing models / interfaces — flag any that are generic (`any`, `Object`, vague names)
- Existing guards, interceptors, pipes
- Current `CLAUDE.md` if present

### 0.3 — Produce a written audit report BEFORE making any changes
Output a structured report with:
1. **Feature map** — every page/route that exists, what it does
2. **API coverage** — which Postman endpoints have corresponding service calls, which are missing
3. **Model issues** — interfaces that are generic/wrong vs what the JSON response shape actually is
4. **UI issues found** — per page, bullet list of problems
5. **Architecture issues** — anything structurally wrong (lazy loading gaps, singleton leaks, missing guards, etc.)
6. **Security issues** — token handling, hardcoded values, missing interceptors
7. **Suggested additions** — features/pages implied by APIs that don't exist in UI yet

**Ask for approval before proceeding to Phase 1.**

---

## PHASE 1 — CLAUDE.md (Lazy, Token-Efficient Setup)

Create or fully replace `/CLAUDE.md` with the following contract. This file controls all future Claude Code sessions and must minimize unnecessary token usage:

```markdown
# NetZeroGateway UI — CLAUDE.md

## Project
Angular 18 SPA — multi-channel messaging gateway frontend
Repo: learnersight-netzero-gateway-ui
Backend: separate .NET 8 repo (not in this workspace)
API contracts: /postman/*.json (source of truth for all models)

## Stack
- Angular 18, standalone components only (zero NgModules)
- Angular Material 18 + CDK
- RxJS 7+ (prefer signals for local state)
- TypeScript strict mode, no `any`
- SCSS with CSS custom properties for theming

## Folder Structure (enforce strictly)
src/
  app/
    core/                          ← singletons only
      interceptors/
        auth.interceptor.ts
        error.interceptor.ts
        loading.interceptor.ts
      guards/
        auth.guard.ts
        role.guard.ts
      services/
        auth.service.ts
        notification.service.ts
        loading.service.ts
      models/
        api-response.model.ts      ← shared envelope types only
    features/                      ← one folder per route
      dashboard/
      sms/
      whatsapp/
      voice/
      logs/
      settings/
      users/
      auth/
    shared/
      components/                  ← dumb/presentational only
        page-header/
        empty-state/
        confirm-dialog/
        status-badge/
        data-table/
      pipes/
      directives/
    layout/
      shell/                       ← app shell (sidenav + toolbar)
      sidebar/
      topbar/
  assets/
  environments/
    environment.ts
    environment.prod.ts

## Models — STRICT RULES
- Every model lives in its feature folder: features/<feature>/models/<name>.model.ts
- Derive ALL field names and types from /postman/*.json responses — never invent
- No generic interfaces (no `data: any`, no `response: Object`)
- Use `readonly` on model properties where possible
- Enums for all status/type/channel fields found in API responses

## Lazy Loading — MANDATORY
- Every feature in /features/ must be a lazy-loaded route
- No feature component may be imported in app.config.ts or app.component.ts
- Route definition pattern:
  {
    path: 'feature',
    loadComponent: () => import('./features/feature/feature.component')
      .then(m => m.FeatureComponent)
  }
- Shared components used in only ONE feature belong in that feature, not /shared/

## Security Rules
- Tokens: memory only (AuthService private field) — never localStorage, never sessionStorage
- HTTP calls: always through services, never directly in components
- Auth interceptor: attach Bearer token to all /api/* requests only
- Error interceptor: catch 401 → trigger logout, 403 → show permission error, 5xx → show global snackbar
- No hardcoded URLs — environment.ts only
- Route guards on every authenticated route

## Angular Patterns
- inject() function — never constructor injection
- OnPush change detection on every component
- Reactive forms only (never template-driven)
- Signals for component-local state
- Async pipe in templates — never subscribe() in components unless cleanup is handled
- No logic in templates beyond simple conditionals
- trackBy on every *ngFor / @for

## UI/UX Rules (ClickUp-inspired)
- App shell: fixed dark navy sidebar (#1B2036) + white content area
- Sidebar: collapsible, icon + label nav items, active state highlight
- Topbar: page title left, primary action buttons (Add/Send) TOP RIGHT
- All pages: mat-card containers with consistent 24px padding
- Forms: full-width fields, clear labels, inline validation messages
- Buttons: Add/Update/primary actions always top-right of page header
- Empty states: illustration + message + action button (never blank)
- Loading states: skeleton loaders (not spinners) for data tables
- Errors: inline for forms, snackbar for API errors, full-page for 404/403
- Icons: Material Symbols Outlined — consistent size (20px inline, 24px standalone)
- Typography: use Material type scale — no custom font sizes outside theme
- Responsive: sidebar collapses to icon-only < 1280px, hidden < 768px (hamburger)
- Dashboard: real data only — charts, counters, recent activity — no static placeholders

## Token Efficiency — Claude Code Instructions
- Read only files relevant to the current task
- Surgical edits only — never rewrite a file unless >50% needs changing
- Do not add comments unless explicitly asked
- Do not regenerate files that don't need changes
- When adding a feature: create model → service → component (in that order)
- Always check if a shared component already exists before creating a new one
- Confirm before creating any new file outside the defined structure above
- Batch related small changes into one edit, not one-change-per-turn

## Commands
- Dev server: ng serve
- Build: ng build
- Lint: ng lint
- Test: ng test
- Generate component: ng g c features/<name>/<name> --standalone --change-detection OnPush
```

---

## PHASE 2 — MODELS (API-driven, no generics)

For every entity discovered in the Postman JSON files:
1. Create a strongly-typed model in the relevant feature folder
2. Field names must match the API JSON keys exactly (camelCase)
3. Use TypeScript enums for any field that has a known set of string values (status, channel, type, provider)
4. Add a shared `ApiResponse<T>` envelope model in `core/models/` if the API wraps responses
5. Delete or replace any existing generic/vague interfaces

Example pattern:
```typescript
// features/sms/models/sms-message.model.ts
export interface SmsMessage {
  readonly id: string;
  readonly recipient: string;
  readonly message: string;
  readonly status: MessageStatus;
  readonly provider: SmsProvider;
  readonly sentAt: string;
  readonly deliveredAt: string | null;
}

export enum MessageStatus {
  Pending = 'pending',
  Sent = 'sent',
  Delivered = 'delivered',
  Failed = 'failed'
}

export enum SmsProvider {
  ReveSms = 'reve_sms'
  // add from Postman response values
}
```

---

## PHASE 3 — CORE SERVICES & INFRASTRUCTURE

### 3.1 Auth Service
- Token stored as private `#token` signal, never exposed directly
- `isAuthenticated` computed signal
- `login()`, `logout()`, `getToken()` (used only by interceptor)
- On logout: clear token, navigate to /login

### 3.2 Interceptors
**Auth interceptor:**
- Attach `Authorization: Bearer <token>` only to requests matching `environment.apiUrl`
- Skip auth header for login endpoint

**Error interceptor:**
- 401 → AuthService.logout()
- 403 → NotificationService.error('You don\'t have permission to do this')
- 422 → extract validation errors, return as typed error
- 5xx → NotificationService.error('Something went wrong. Please try again.')
- All errors → log to console in dev, suppress in prod

**Loading interceptor:**
- Increment/decrement a request counter signal in LoadingService
- Used by global loading bar in topbar

### 3.3 Notification Service
Wraps MatSnackBar:
```typescript
success(message: string): void
error(message: string): void
warning(message: string): void
info(message: string): void
```
- Success: green, bottom-center, 3s
- Error: red, bottom-center, 5s, dismissible

### 3.4 Guards
- `AuthGuard`: redirect to /login if not authenticated
- `RoleGuard`: check user role from AuthService, redirect to /forbidden if unauthorized

---

## PHASE 4 — THEME & DESIGN SYSTEM

### 4.1 Angular Material Custom Theme
Apply ClickUp-inspired theme in `styles.scss`:

```scss
// Color palette
$navy-dark: #1B2036;       // sidebar background
$navy-mid: #232840;        // sidebar hover
$navy-accent: #7B68EE;     // sidebar active, primary accent (medium slate blue)
$white-content: #FFFFFF;   // main content bg
$surface: #F7F8FA;         // page background
$border: #E8E9EC;          // dividers, card borders
$text-primary: #1A1A2E;    // headings
$text-secondary: #6B7280;  // labels, meta
$success: #10B981;
$warning: #F59E0B;
$error: #EF4444;
$info: #3B82F6;
```

Use Angular Material M3 theming — define a custom theme with the above palette.

### 4.2 Typography
- Headings: `Inter` or `Plus Jakarta Sans` (Google Fonts)
- Body: `Inter`
- Code/mono: `JetBrains Mono`
- Set via `mat.define-theme()` typography config

### 4.3 Global Layout
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)  │  CONTENT AREA          │
│  ─────────────────────  │  ┌──────────────────┐  │
│  Logo + App Name        │  │ TOPBAR           │  │
│  ─────────────────────  │  │ [Page Title]  [+]│  │
│  • Dashboard            │  └──────────────────┘  │
│  • SMS                  │  ┌──────────────────┐  │
│  • WhatsApp             │  │ PAGE CONTENT     │  │
│  • Voice                │  │                  │  │
│  • Logs                 │  │                  │  │
│  • Settings             │  │                  │  │
│  • Users                │  └──────────────────┘  │
│  ─────────────────────  │                        │
│  [User Avatar + Name]   │                        │
└─────────────────────────────────────────────────┘
```

### 4.4 Shared Components to Build
- `PageHeaderComponent` — title, subtitle, breadcrumb slot, action buttons slot (ng-content)
- `EmptyStateComponent` — icon, title, message, optional action button input
- `StatusBadgeComponent` — input: status string → colored chip
- `ConfirmDialogComponent` — reusable MatDialog for delete/destructive confirmations
- `DataTableComponent` — wraps mat-table with loading skeleton, empty state, pagination

---

## PHASE 5 — FEATURE PAGES (Fix each one)

For each discovered feature page, apply these rules:

### Every Page Must Have:
- `PageHeaderComponent` at top with title + primary action button (Add/Send/etc.) top-right
- Proper route title via Angular Router `title` property
- Loading skeleton while data loads (not spinner)
- Empty state when no data
- Error state if API fails with retry button
- OnPush change detection
- Unsubscribe handled via `takeUntilDestroyed()`

### Dashboard (highest priority — make it the showpiece)
The dashboard must be **interactive and informative**, not static:
- Summary counters: total messages sent today, SMS / WhatsApp / Voice breakdown, delivery rate, failure rate
- Line/bar chart: message volume over last 7 days, per channel
- Recent messages table: last 10 messages across all channels with status badges
- Provider health: status indicators per provider (REVE SMS, WaTrend, NetZero Voice)
- All data fetched from real API endpoints discovered in Postman collection
- Use Angular CDK or a lightweight charting lib (ng2-charts / Chart.js) for charts
- Cards with hover elevation, click-through to relevant feature page
- Color-coded status badges (success green, failed red, pending amber)
- Auto-refresh every 60 seconds with a visual countdown indicator

### SMS / WhatsApp / Voice Pages
- Data table with: recipient, message preview, status badge, provider, sent time, actions
- Top-right: "Send Message" button → opens slide-in drawer or dialog (not new page)
- Send form: full validation, character counter for SMS, proper field labels from API model
- Row actions: view details, resend (if failed), copy message
- Filters: by status, date range, search by recipient
- Pagination: server-side, mat-paginator

### Logs Page
- Full message log across all channels
- Filterable by: channel, status, date range, provider
- Exportable (if API supports it — check Postman)
- Virtualized table if log entries are large

### Settings Page
- Provider configuration cards (one per provider)
- Toggle enable/disable per provider
- Edit credentials/config inline with save confirmation
- Never show API keys in plain text — mask with toggle show/hide

### Users Page (if API exists)
- User list with role badges
- Add/Edit user dialog
- Role management

---

## PHASE 6 — SECURITY HARDENING

Go through the entire codebase and:
- [ ] Remove any token from localStorage/sessionStorage
- [ ] Remove any hardcoded API URLs — move to environment.ts
- [ ] Ensure every authenticated route has AuthGuard
- [ ] Ensure error interceptor handles all HTTP error codes
- [ ] Remove any `console.log` that exposes sensitive data
- [ ] Verify no sensitive fields are displayed in plain text in templates
- [ ] Add HTTP-only flag note in README (backend concern, but document it)
- [ ] Sanitize any user-supplied content rendered as HTML

---

## PHASE 7 — FINAL CLEANUP & SUGGESTIONS

After all phases are complete:

1. Run `ng lint` — fix all warnings and errors
2. Check for unused imports in every file
3. Verify all lazy routes load correctly
4. Check bundle size — flag any feature that imports heavy libs eagerly
5. Write a `SUGGESTIONS.md` file at project root with:
   - Missing features implied by API but not built
   - Performance improvements (virtual scrolling, trackBy gaps, etc.)
   - Future considerations (PWA, i18n, dark mode toggle, etc.)
   - Any API inconsistencies noticed in the Postman collection

---

## EXECUTION RULES (Follow strictly throughout)

**Token efficiency:**
- Work phase by phase — complete and confirm each phase before starting next
- Read only the files needed for the current task
- Surgical edits — never rewrite a whole file to change 5 lines
- Never add explanatory comments to code unless asked
- Batch related changes within a phase into as few file operations as possible

**Before creating any file:**
- Check if a similar component/service already exists
- Confirm the file belongs in the defined structure

**Before making any UI change:**
- State what the current problem is and what the fix is (one line each)

**When in doubt:**
- Ask rather than assume
- Especially for: new route paths, breaking changes to existing API service signatures, new dependencies

**Quality bar:**
- Every component must compile with zero TypeScript errors in strict mode
- Every form must show validation errors before submit is attempted
- Every API call must have a loading state, success state, and error state handled

---

## START COMMAND

Begin with **Phase 0 — Discovery**. Read all Postman JSON files and the full codebase, then output the structured audit report. Do not make any code changes until the audit is approved.
