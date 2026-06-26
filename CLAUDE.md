# NetZeroGateway UI — CLAUDE.md

## Project
Angular 18 SPA — multi-channel messaging gateway frontend
Repo: learnersight-netzero-gateway-ui
Backend: separate .NET 8 repo (not in this workspace)
API contracts: /postman/*.json (source of truth for all models)
Backend URL (dev): http://localhost:5164 | env.ts currently: http://localhost:8080 — align before connecting to real backend

## Stack
- Angular 18, standalone components only (zero NgModules)
- Angular Material 18 + CDK
- RxJS 7+ (prefer signals for local state)
- TypeScript strict mode, no `any`
- SCSS with CSS custom properties for theming
- ApexCharts via ng-apexcharts (already installed)

## Folder Structure (enforce strictly)
src/
  app/
    core/                          ← singletons only
      interceptors/
        auth.interceptor.ts
        error.interceptor.ts
        loading.interceptor.ts
        mock.interceptor.ts
      guards/
        auth.guard.ts
        role.guard.ts
      services/
        auth.service.ts
        notification.service.ts
        loading.service.ts
      models/
        api-response.model.ts      ← shared envelope types only
        paged-result.model.ts
        enums.ts                   ← all shared enums
        [feature].model.ts         ← feature-specific models (current structure acceptable)
    features/                      ← one folder per route
      dashboard/
      message-logs/
      dispatch-logs/
      api-logs/
      send-message/
      channel-configs/
      fallback-policies/
      voice-reports/
      auth/
      settings/
        api-keys/
        admin-users/
    shared/
      components/
        page-header/
        empty-state/
        confirm-dialog/
        status-badge/
        data-table/
        filter-bar/
        loading-spinner/           ← kept but supplement with skeleton loaders
        form-field-errors/
        copy-button/
      pipes/
      directives/
      utils/
    layout/
      main-layout/                 ← app shell (sidenav + toolbar)
      auth-layout/
  assets/
  environments/
    environment.ts                 ← dev (mock: true)
    environment.prod.ts            ← prod (mock: false, apiUrl: '' nginx proxies)
  styles/
    _tokens.scss                   ← CSS custom properties, single source of truth

## Enum Wire Format — IMPORTANT
- Backend is .NET 8; default JSON serialization sends enums as INTEGERS
- ChannelType: SMS=0, WP_Text=1, WP_Media=2, Voice=3
- MessageStatus: Pending=0, PartialSuccess=1, Success=2, Failed=3
- JobStatus: Pending=0, Sent=1, Failed=2
- AdminRole: SuperAdmin=0, Admin=1
- Postman collection uses string names for readability (documentation intent)
- Mock interceptor uses Number(ct) confirming numeric wire format
- If backend changes to string enums, update enums.ts and remove Number() casts in mock

## Models — STRICT RULES
- Every model lives in core/models/ (current structure — acceptable for shared models)
- All properties must be `readonly`
- No generic interfaces (no `data: any`, no `response: Object`)
- Derive ALL field names from /postman/*.json responses

## Lazy Loading — MANDATORY
- Every feature in /features/ must be a lazy-loaded route
- No feature component may be imported in app.config.ts or app.component.ts

## Security Rules
- Access token: memory only (AuthService private field) — never localStorage, never sessionStorage
- Refresh token: memory only — accept re-login on page refresh (enterprise console UX tradeoff)
- HTTP calls: always through services, never directly in components
- Auth interceptor: attach Bearer token to all requests except /api/auth/* endpoints
- Error interceptor: 401 → logout, 403 → show permission error, 5xx → global snackbar
- No hardcoded URLs — environment.ts only
- Route guards on every authenticated route
- configFields in ChannelConfigDto may contain secrets — mask in UI

## Angular Patterns
- inject() function — never constructor injection
- OnPush change detection on every component
- Reactive forms only (never template-driven)
- Signals for component-local state
- takeUntilDestroyed() for all long-lived subscriptions in components
- Async pipe in templates — avoid manual subscribe() in components when possible
- No logic in templates beyond simple conditionals
- trackBy / track on every *ngFor / @for
- computed() signal not getter for derived display values

## UI/UX Rules (ClickUp-inspired)
- App shell: fixed dark navy sidebar (#1B2036) + white content area
- Sidebar: collapsible, icon + label nav items, active state highlight (#7B68EE tint)
- Topbar: page title left, primary action buttons (Add/Send) TOP RIGHT, loading bar below toolbar
- All pages: mat-card containers with consistent 24px padding
- Forms: full-width fields, clear labels, inline validation messages
- Empty states: illustration + message (never blank)
- Loading states: skeleton loaders in data tables (not spinners)
- Errors: inline for forms, snackbar for API errors
- Icons: Material Icons — consistent size
- Typography: Inter (Google Fonts) for headings and body
- Snackbars: bottom-center, success=green, error=red
- Dashboard: auto-refresh every 60s with countdown

## Token Efficiency — Claude Code Instructions
- Read only files relevant to the current task
- Surgical edits only — never rewrite a file unless >50% needs changing
- Do not add comments unless non-obvious WHY
- Do not regenerate files that don't need changes
- When adding a feature: model → service → component (in that order)
- Always check if a shared component already exists before creating a new one

## Commands
- Dev server: ng serve
- Build: ng build
- Lint: ng lint (eslint not yet configured — ng lint will fail)
- Test: ng test
- Generate component: ng g c features/<name>/<name> --standalone --change-detection OnPush
