# TrackRoute Frontend

Angular frontend for logistics route management, integrated with Fastify backend APIs under `/api/v1`.

## Tech stack

- Angular (standalone components)
- Reactive forms
- Signals + RxJS/BehaviorSubject
- HTTP interceptors (auth + correlation-id)
- Role-based route guards (`ADMIN`, `OPERATOR`)
- Vitest test runner

## Prerequisites

- Node.js 20+
- npm 10+
- Backend API running (default expected at `http://localhost:3000`)

## Run locally

Install dependencies:

```bash
npm install
```

Start local dev server:

```bash
npm run serve
```

This command uses `proxy.conf.json`, so frontend calls to `/api/*` are forwarded to backend at `http://localhost:3000`.

Default frontend URL:

- `http://localhost:4200`

## Build

Development build:

```bash
npm run build
```

Production build:

```bash
npm run build:prod
```

## Tests

Run unit tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:cov
```

## Frontend features implemented

- Authentication (`/api/v1/auth/login`) with JWT storage, guards, and role-aware UI.
- Routes management:
  - list with server-side pagination/filter/sort
  - create/edit
  - soft disable (`PATCH /api/v1/routes/:id/disable`)
  - bulk disable from list
- CSV import UI (`POST /api/v1/routes/import`) with preview and summary.
- Monitoring panel polling every 30s (`GET /api/v1/routes/active/track`).
- Dashboard with date-range filter (`GET /api/v1/dashboard/summary?from=&to=`).

## API request collection

A ready-to-run HTTP collection is included at:

- `api-requests.http`

Use it in VS Code/Cursor REST Client extensions to call backend endpoints.

## Dataset

Reference dataset is expected at workspace root:

- `../data/routes_dataset.csv`

The import UI supports large CSV files and previews only the first chunk/rows for performance.
