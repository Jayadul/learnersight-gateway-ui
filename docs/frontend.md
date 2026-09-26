# Frontend Standards & Patterns

Load this when: building/altering UI features, reviewing UI code, or styling.

## Shared primitives — always reuse, never rebuild

| Primitive | Use for |
|---|---|
| `shared/components/data-table` | every table; config-driven `ColumnDef[]`; `type:'custom'` cells **require `ColumnDefDirective` in the page's `imports`** or cells render blank |
| `shared/components/filter-bar` | list filters (text / select / dateRange) |
| `core/state/list-state.ts` | signal-based paged list state |
| `core/api/base-crud.service.ts` | feature services set only `resourcePath` |
| `shared/components/*` | page-header (title+subtitle), status-badge, empty-state, confirm-dialog (`ConfirmService`), form-field-errors, copy-button |
| `shared/pipes` | `channelType` (enum int → label), `channelName` (string → label), message-status |

Feature recipe: model (`core/models/*.model.ts`, all `readonly`, names from
`postman/*.json`) → service (extend BaseCrudService) → thin page over the primitives.
Every feature is lazy-loaded in `app.routes.ts`.

## Angular rules

- Standalone components only; `inject()` (never constructor DI); OnPush everywhere.
- Signals for local state; `computed()` for derived values; RxJS only for HTTP.
- Reactive forms only; validation messages via `core/forms/validation-messages.ts`
  (add new validator keys there once — every form picks them up).
- `takeUntilDestroyed(this.destroyRef)` for subscriptions made outside injection context.
- TypeScript strict, no `any`. Enums arrive as integers (see backend `docs/api.md`).

## Auth (client-approved decisions — don't relitigate)

- Tokens persist in localStorage (`nzg.accessToken`/`nzg.refreshToken`); session must
  survive reload; XSS tradeoff accepted 2026-07.
- Auth interceptor: single shared in-flight refresh, retry-once, skips `/api/auth/*`.
- Error interceptor reads ProblemDetails `detail`/`message`/`title`; 403 → permission
  toast, 5xx → generic toast, 401 → refresh/logout path.

## Dialogs (the only modal pattern)

All view/edit interactions are MatDialog, width `880px` (view) or `480px` (form),
`maxWidth: '95vw'`. Views: `mat-dialog-title` + content + right-aligned Close. Forms:
Cancel + Save. Dialogs whose content loads async: `autoFocus: 'dialog'` (else the
browser scrolls the bottom button into view). No side drawers.

**Form dialog layout (hotfix batch 7).** Every dialog with form fields puts `class="nzg-form"` on its
`<form>` (global, `styles.scss`) and adds `FORM_DIALOG_FIELD_OPTIONS` (`shared/forms/form-dialog.ts`)
to the component's `providers`. Together they give a uniform 20px between fields: fields size their
hint area dynamically, which removes the space Material reserves under a field, so the spacing has to
come from the layout, not from each field. Do not add per-dialog gaps, margins or `subscriptSizing`
attributes. Text that belongs to the field above it uses `nzg-form-note`; a small heading for the
fields below uses `nzg-form-section`. `shared/forms/form-dialog-spacing.spec.ts` measures the gap in
each form dialog in a real browser; add a new form dialog to it. Run the specs with
`ng test --watch=false --browsers=ChromeHeadless`.

## UX & copy (ClickUp-inspired, established in R1 review)

- Dark navy sidebar, white content, mat-cards with 24px padding, Inter font.
- Page header: title + one-line subtitle; **no breadcrumbs** (removed by client request).
- Status-style values use `status-badge` (`Active`/`Inactive`, `Yes`/`No`) — never
  ad-hoc chips. On/off inputs are `mat-slide-toggle` — never checkboxes.
- Copy: simple customer language; no dev jargon (config, async, dispatch), no raw enum
  values (map `WP_Text` → "WhatsApp Text"), no em dashes, Title Case labels,
  sentence-case messages. Phones: digits with country code, no `+` (`8801700000001`).
- Empty states: friendly title + hint, never blank. Toasts: bottom, success green /
  error red; error text must say what to do next.
- Delete confirmations always warn "This cannot be undone."
- Dashboard: 15-min auto-refresh + icon-only refresh button (client-specified).

## Dates & times (project standard — see backend `docs/conventions.md`)

- Backend stores/returns UTC. The UI always DISPLAYS Dhaka time (UTC+6) regardless of
  the browser zone: `DATE_PIPE_DEFAULT_OPTIONS` in `app.config.ts` covers every
  `| date` pipe (never pass a per-usage timezone to the pipe).
- Manual formatting (charts, `toLocaleDateString`) must pass
  `timeZone: APP_TIMEZONE` from `core/time/app-time.ts` — the only file allowed to
  name the zone/offset.
- Datepicker filters convert to UTC ISO in `BaseCrudService.buildParams` — keep new
  filters on that path.

## Mock mode

`environment.mock: true` answers all HTTP from `assets/mock.json` via
`mock.interceptor.ts` — no component knows about it. Keep mock.json aligned with API
changes or mock mode drifts.
