# NetZeroGateway — Admin Dashboard (Angular 18)

Admin console for the NetZeroGateway multi-channel messaging gateway (SMS / WhatsApp / Voice).
Angular 18 (standalone components, signals), Angular Material 18, ApexCharts.

## Quick start

```bash
npm install
npm start        # http://localhost:4200
```

The dev build hits the real backend at `http://localhost:5212` — start it first
(`cd ../learnersight-netzero-gateway && dotnet run --project NetZeroGateway.API`).
Sign in with the seeded `admin` / `Admin@123`.

## Pages

| Route | Page | Access |
|---|---|---|
| `/dashboard` | Dashboard (KPIs, charts, 15-min auto-refresh) | all |
| `/logs/messages` | Message Logs (+ details dialog with deliveries) | all |
| `/logs/dispatch` | Delivery Logs | all |
| `/logs/api` | API Logs | all |
| `/send` | Messages & Calls (manual send) | all |
| `/settings/channels` | Channels (provider configs + activation) | SuperAdmin |
| `/settings/fallback` | Fallback Rules | SuperAdmin |
| `/settings/users` | Users | SuperAdmin |
| `/settings/gateway-simulator` | Gateway Simulator (integration guide + live test) | SuperAdmin |

Toolbar extras: DB backup download presets (Last Week … All Time), sign out.

## Mock mode

One flag (`environment.mock`) answers all HTTP from `src/assets/mock.json` via an
interceptor — no backend needed, any credentials sign in, writes don't persist.

## Build & Docker

```bash
npm run build    # production build → dist/net-zero-gateway/browser
```

Production uses `environment.prod.ts` (`apiUrl: ''`); nginx serves the SPA and proxies
`/api/` and root-level `/sendtext` to the backend (`nginx.conf`). Run the full stack
with the compose file at the workspace root — frontend at http://localhost:18080.

## Documentation

- `CLAUDE.md` — entry point + when to load what
- `docs/frontend.md` — standards, shared primitives, dialog/UX/copy rules
- Backend `../learnersight-netzero-gateway/docs/` — API contract, deployment, releases
