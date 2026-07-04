# NetZeroGateway — Admin Dashboard (Angular 18)

Admin console for the NetZeroGateway multi-channel messaging gateway (SMS / WhatsApp / Voice).
Built with Angular 18 (standalone components, signals), Angular Material 18, and ApexCharts.

## Quick start

```bash
npm install
npm start
```

Then open http://localhost:4200.

By default the dev build hits the **real backend** at `http://localhost:5212`
(`src/environments/environment.ts`, `mock: false`). Start the backend first:

```bash
cd ../learnersight-netzero-gateway
dotnet run --project NetZeroGateway.API
```

Sign in with the seeded credentials (see the backend's `appsettings.json` — default
`admin` / `Admin@123`).

## Pages

| Route | Purpose |
|---|---|
| `/dashboard` | KPIs, timeline, channel breakdown, failure reasons (auto-refresh) |
| `/logs/messages`, `/logs/dispatch`, `/logs/api` | Message / dispatch / API audit logs |
| `/send` | Manual send (SMS, WhatsApp text/media, Voice) |
| `/settings/gateway-simulator` | **Gateway Simulator** (SuperAdmin only) — integration guide + live simulator for the public `POST /sendtext` endpoint (requires apikey/secretkey/callerID) |
| `/settings/channels`, `/settings/fallback` | Channel configs, fallback policies |
| `/settings/users` | Admin users (SuperAdmin only) |

The toolbar also has a **DB backup download** (cloud icon): Last Week / Last Month /
This Month / This Year / All Time → xlsx via `GET /api/backup/export`.

## Mock mode

A single flag controls everything — no component or service is aware of it:

| Flag | Behaviour |
|------|-----------|
| `mock: false` (default) | Real calls to `environment.apiUrl` + `/api/...`. |
| `mock: true`  | All HTTP answered from `src/assets/mock.json` via `mock.interceptor.ts`; no backend needed; any credentials sign in; a "MOCK" badge shows in the toolbar. Stateless — writes don't persist. |

## Build

```bash
npm run build          # production build -> dist/net-zero-gateway/browser
```

The production build uses `environment.prod.ts` (`apiUrl: ''`) — nginx serves the SPA and
proxies `/api/` (and the root-level `/sendtext` used by the simulator) to the backend.
See `nginx.conf`.

## Docker

Use the `docker-compose.yml` at the workspace root (one level up) — it builds and runs
`web` together with `api`, `db`, `seq`, and `backup`. Frontend: http://localhost:18080.

## Architecture notes

- **Shared primitives** (`src/app/shared`): a config-driven `data-table`, `filter-bar`,
  signal-based `ListState`, central form-error rendering, `ConfirmService`, CSV export,
  status badges. Feature pages are thin config over these.
- **`BaseCrudService`** (`src/app/core/api`): typed generic HTTP base; feature services set
  only a `resourcePath`.
- **Interceptors** (`src/app/core/interceptors`): `mock` → `auth` → `error`. The auth
  interceptor performs correct token-refresh handling (single in-flight refresh shared
  across concurrent 401s, no refresh-of-refresh loops, retry-once guard).
- **Signals** for UI state; **RxJS** only for HTTP. `inject()` and `OnPush` throughout.
