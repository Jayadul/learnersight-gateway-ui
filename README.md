# NetZeroGateway — Admin Dashboard (Angular 18)

Admin console for the NetZeroGateway multi-channel messaging gateway (SMS / WhatsApp / Voice).
Built with Angular 18 (standalone components, signals), Angular Material 18, and ApexCharts.

## Quick start

```bash
npm install
npm start
```

Then open http://localhost:4200.

The app ships in **MOCK MODE** by default (`src/environments/environment.ts` has `mock: true`),
so it runs with realistic demo data and **no backend required**. A "MOCK DATA" badge appears
in the toolbar. On the sign-in screen, any username/password works in mock mode.

## Mock mode vs real backend

A single flag controls everything — no component or service is aware of it:

| Flag | File | Behaviour |
|------|------|-----------|
| `mock: true`  | `environment.ts` (dev default) | All HTTP answered from `src/assets/mock.json` via `mock.interceptor.ts`. Network is never hit. |
| `mock: false` | `environment.prod.ts` (prod) | Real calls to `environment.apiUrl` + `/api/...`. |

To point the dev build at a live backend, set `mock: false` in `environment.ts`.
The dev server proxies `/api` to `http://localhost:8080` via `proxy.conf.json`.

Mock mode is **stateless** — creates/edits/deletes are echoed as success but do not persist
across reloads. This is intentional for demos.

## Build

```bash
npm run build          # production build -> dist/net-zero-gateway/browser
```

The production build uses `environment.prod.ts` (mock off, `apiUrl: ''`), where nginx
proxies `/api` to the backend.

## Docker

```bash
docker build -t netzerogateway-web .
```

See `nginx.conf` (SPA fallback + `/api` proxy) and `docker-compose.web.yml` for the
`web` service to add to your stack.

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
