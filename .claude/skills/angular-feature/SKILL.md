---
name: angular-feature
description: Add or modify an Angular UI feature following NetZeroGateway patterns - shared data-table/filter-bar primitives, BaseCrudService, dialog patterns, lazy routes. Use for any frontend feature work.
---

# Angular Feature

Load first: `learnersight-netzero-gateway-ui/docs/frontend.md`.

## Recipe (model → service → page)

1. **Model** `core/models/<thing>.model.ts` — `readonly` fields, names exactly from
   `postman/*.json` / backend `docs/api.md`; enums are integers.
2. **Service** `features/<thing>/<thing>.service.ts` — extend `BaseCrudService`, set
   `resourcePath` from `core/api/api-endpoints.ts` (add the endpoint constant there).
3. **Page** — standalone, OnPush, `inject()`; thin config over shared primitives:
   - lists: `ColumnDef[]` + `app-data-table` + `app-filter-bar` + `ListState`
   - `type:'custom'` columns REQUIRE `ColumnDefDirective` in `imports` (silent blank
     cells otherwise)
   - badges via `type:'badge'` + value mapper; channel strings via the `channelName` pipe
4. **Dialogs**: form 480px (Cancel/Save), view 880px (Close), `maxWidth:'95vw'`;
   async-loading dialogs use `autoFocus: 'dialog'`.
5. **Route**: lazy `loadComponent` in `app.routes.ts`; SuperAdmin pages get
   `canActivate: [roleGuard('SuperAdmin')]` AND `superAdminOnly: true` on the nav
   group in `main-layout.component.ts`; add ROUTE_TITLES entry matching the nav label.
6. **Copy**: customer-friendly per docs/frontend.md (no jargon, no em dashes, Title
   Case labels); validation messages via `core/forms/validation-messages.ts`.
7. **Notifications**: `NotificationService`; deletes confirm via `ConfirmService`
   with "This cannot be undone."

## Verify

`npx ng build` must pass. If stack testing is needed: backend `docs/testing.md`.
If mock mode matters for the feature, extend `assets/mock.json` + mock.interceptor.
