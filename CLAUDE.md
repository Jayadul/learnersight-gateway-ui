# NetZeroGateway — Admin Dashboard (Angular 18)

Angular 18 + Material admin UI for the messaging gateway. Backend: sibling repo
`../learnersight-netzero-gateway` (.NET 8, dev URL http://localhost:5212).
API contracts: `postman/*.json` + backend `docs/api.md` (source of truth for models).

Current baseline: **Release 3.0.0** (see backend `docs/releases/3.0.0.md`). The channel
form is provider-aware since 3.0 — the provider dropdown decides which credential fields
appear, and providers without a registered sender are deliberately not offered.

## Commands

```bash
npm start        # dev server :4200 (hits the real backend; start it first)
npx ng build     # must pass before every commit
ng g c features/<name>/<name> --standalone --change-detection OnPush
```

## Load only what the task needs

| Task | Read |
|---|---|
| Any UI feature/change, styling, copy, dialogs | `docs/frontend.md` |
| Endpoint shapes, enums-as-integers, gateway contract | backend `docs/api.md` |
| Verifying in the running stack | backend `docs/testing.md` |
| Shipping (images + git) | backend `docs/release-process.md` |
| Collaboration/autonomy rules | backend `docs/claude/workflow.md` |

Skills in this repo's `.claude/skills/`: `angular-feature` (feature recipe),
`ui-consistency-review` (customer-lens copy audit). Prefer them over ad-hoc prompts.

## Structure (one line)

`core/` singletons (auth, interceptors, models, api base) · `features/` one lazy folder
per route · `shared/` reusable components/pipes/directives · `layout/` app shell.

## Non-negotiables

- Reuse shared primitives (`data-table`, `filter-bar`, `ListState`, `BaseCrudService`) —
  details and gotchas in `docs/frontend.md`.
- Surgical edits; read only whats needed; never regenerate unchanged files.
- Token persistence, JWT lifetimes, phone format, no-breadcrumbs: client decisions —
  don't change without team-lead approval.
- **Time**: display Dhaka (UTC+6) everywhere via `DATE_PIPE_DEFAULT_OPTIONS` +
  `core/time/app-time.ts`; never hardcode offsets (see `docs/frontend.md`).
