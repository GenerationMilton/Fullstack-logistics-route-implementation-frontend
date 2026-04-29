### Frontend Implementation — Angular 17+ (Step‑by‑step)

## 0 Overview

This guide details a modern and scalable implementation plan for a logistics route management system. It proposes a **microservices-based architecture** with a frontend in Angular 17+ and a backend written in Fastify. Database Implementation — PostgreSQL

Goal: Build a responsive Angular 17+ frontend that provides: authenticated access (JWT), routes CRUD (server‑side pagination, sorting, filters), CSV import UI, monitoring panel (polling 30s or WebSocket), dashboard charts, and a reusable table component. Use Standalone Components, reactive forms, Signals/RxJS, and lazy loading.

---

## 1. Project scaffold and dependencies

Create project:

bash
```
npm install -g @angular/cli
ng new trackroute-frontend --routing --style=scss --strict
cd trackroute-frontend
```
Install libraries:

bash
```
npm install @angular/material @angular/cdk chart.js ngx-chartjs
npm install pino-http uuid
npm install @ngneat/spectator --save-dev
npm install @testing-library/angular jest jest-preset-angular --save-dev
```

Recommended folder structure:

Code

```
src/app/
  core/            # AuthService, ApiService, interceptors, models
  features/
    routes/        # routes-list, route-form, import-csv
    dashboard/     # charts, indicators
    monitoring/    # monitoring panel
  shared/          # table, filters, ui primitives
  app.routes.ts
```

---

## 2. Authentication & app shell

### Implement AuthService

1. Methods: login(credentials), logout(), getToken(), getUser().

2. Store token in memory + secure storage (localStorage acceptable for prototype; prefer HttpOnly cookie in prod).

3. Token expiry: 8 hours; decode role claim for guards.

### Interceptors

1. AuthInterceptor: attach Authorization: Bearer <token> and x-correlation-id.

2. ErrorInterceptor: on 401 call AuthService.logout() and navigate to /login; on 5xx show toast.

### Guards

1. AuthGuard ensures authenticated access.

2. RoleGuard checks role claim for Admin vs Operator.

3. App shell

4.Lazy load routes and dashboard modules.

5. Provide top nav with role-aware actions.

---

## 3. Reusable Table Component (server-side)

1. API contract

GET /api/v1/routes?page=1&limit=20&origin=&destination=&vehicle=&status=&carrier=&sort=distance:asc

2. Component API

Inputs: columns, pageSize (default 20), serverSide.

Outputs: pageChange, sortChange, filterChange, rowAction.

3. Implementation details

4. Use MatTable or custom table.

5. Filters implemented with reactive form; debounce 300ms.

6. Emit events to parent; parent calls backend and binds dataSource.

7. Accessibility: keyboard navigation, aria labels.

---

## 4. Routes CRUD UI

1. List view

Use shared table; filters: origin, destination, vehicle_type, status, carrier.

Pagination: server-side, default 20 per page.

Bulk actions: disable selected routes (soft delete).

2. Create/Edit

RouteFormComponent reactive form with validators matching backend DTOs (required, numeric ranges, enums).

On submit call POST /api/v1/routes or PUT /api/v1/routes/:id.

3. Soft delete

UI action calls PATCH /api/v1/routes/:id/disable and refreshes list.

---

## 5. CSV Import UI

ImportCsvComponent with file input.

Use FormData to POST /api/v1/routes/import.

Show import summary: { imported, failed, errors[] }.

Provide preview of first N rows and per-row errors.

---

## 6. Monitoring panel & Dashboard

1. Monitoring

Option A (polling): timer(0, 30000).pipe(switchMap(() => api.get('/api/v1/routes/active/track')))

Option B (recommended for scale): WebSocket subscription to ws://... for push updates.

2. Display last location, progressPercent, etaMinutes per active route.

3. Dashboard

Charts: total routes by status, top 5 expensive routes, heatmap (simplified grid).

Date range filter; call aggregated endpoint: /api/v1/dashboard/summary?from=&to=.

4. Use Chart.js or ngx-charts.

---

## 7. State management & reactivity

Use Signals for small local state or RxJS BehaviorSubject in services for shared state.

Keep services stateless; components subscribe to Observables.

Correlation id: generate per navigation and attach to headers.

---


## 8. Testing
Unit tests: services and components (table, form).

Integration tests: table + filters, create form.

Use Testing Library for Angular and Jest.

---


## 9. Developer commands

bash
npm install
ng serve
npm run test
ng build --configuration production

---

## 10. Backend step: implement dashboard summary endpoint

Implement `GET /api/v1/dashboard/summary?from=&to=` in the backend.

1. Route contract

- Method: `GET`
- Path: `/api/v1/dashboard/summary`
- Query params:
  - `from` (required, ISO8601)
  - `to` (required, ISO8601)
- Validation:
  - `from <= to`
  - date range max recommended window (for example 365 days)
- Response (example):

```json
{
  "range": { "from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z" },
  "totalsByStatus": [
    { "status": "ACTIVA", "count": 58 },
    { "status": "INACTIVA", "count": 12 },
    { "status": "SUSPENDIDA", "count": 8 },
    { "status": "EN MANTENIMIENTO", "count": 5 }
  ],
  "topExpensiveRoutes": [
    { "id": 49, "originCity": "Bogotá", "destinationCity": "Leticia", "costUsd": 1250.0 }
  ],
  "activeHeatmapByRegion": [
    { "region": "Andina", "count": 21 },
    { "region": "Caribe", "count": 14 }
  ]
}
```

2. Backend design

- Controller: validate query params and map errors to semantic HTTP codes.
- Service: orchestrate aggregations and apply date filter.
- Repository: grouped counts by status, top 5 by `cost_usd`, active routes grouped by region.
- Mapping: define and maintain the city-to-region map in backend config (not in DB) for the simplified heatmap.

Suggested backend config shape:

```ts
// src/config/dashboardRegions.ts
export type RegionName = "Andina" | "Caribe" | "Pacifica" | "Orinoquia" | "Amazonia";

export const CITY_TO_REGION: Record<string, RegionName> = {
  "Bogotá": "Andina",
  "Medellín": "Andina",
  "Manizales": "Andina",
  "Pereira": "Andina",
  "Ibagué": "Andina",
  "Tunja": "Andina",
  "Bucaramanga": "Andina",
  "Cúcuta": "Andina",
  "Cali": "Pacifica",
  "Buenaventura": "Pacifica",
  "Pasto": "Pacifica",
  "Tumaco": "Pacifica",
  "Barranquilla": "Caribe",
  "Cartagena": "Caribe",
  "Santa Marta": "Caribe",
  "Valledupar": "Caribe",
  "Riohacha": "Caribe",
  "Montería": "Caribe",
  "Sincelejo": "Caribe",
  "Yopal": "Orinoquia",
  "Villavicencio": "Orinoquia",
  "San José del Guaviare": "Orinoquia",
  "Mocoa": "Amazonia",
  "Florencia": "Amazonia",
  "Leticia": "Amazonia"
};

export const UNKNOWN_REGION: RegionName = "Andina";
```

Implementation note: normalize city input (trim + case-insensitive + accent-safe) before lookup and use `UNKNOWN_REGION` fallback when not mapped.

3. Performance and reliability

- Add indexes used by aggregations (`created_at`, `status`, `cost_usd`).
- Keep query read-only and pageless (summary endpoint).
- Optional cache TTL (30-60s) for repeated dashboard requests.

4. Security and access

- Require JWT and role guard (`ADMIN`, `OPERATOR` can read).
- Reuse correlation-id logging in controller/service.

5. Tests

- Unit: date-range validator, service aggregation mapping.
- Integration: `GET /api/v1/dashboard/summary` happy path + invalid range.

6. Frontend consumption

- Dashboard page calls this endpoint on range change.
- Refresh charts without reloading and handle empty datasets gracefully.

---

## 11. Deliverables (frontend)

README with run instructions.

Postman or .http file for endpoints used by frontend.

Storybook or component showcase (optional).

Export filtered CSV button (bonus).

---

## 12. Summary of technical requirements

### Functional Requirements

### RF-01 Route Management (CRUD)

1. List all routes with pagination (20 records per page)
2. Filter by origin city, destination city, vehicle type, status, and carrier.
3. Create a new route with all required fields validated.
4. Edit an existing route.

Disable (soft delete) a route; physical deletion is not allowed.

### RF-02 - Real-Time Monitoring

For each active route, use the SOAP tracking service and display:

*Last vehicle position (coordinates or approximate city)
*Percentage of route completed

*ETA (Estimated Time of Arrival) Updated
The panel should refresh automatically every 30 seconds without reloading the page

### RF-03 - Indicators Dashboard

*Total routes by status (bar or donut chart)
* Top 5 most expensive routes.

*Heat map of active routes by region (this can be a simplified visual component if a real map is not integrated).

*Date filter for the analysis range.
*Use endpoint `GET /api/v1/dashboard/summary?from=&to=` for aggregated data.

### RF-04 Authentication and Authorization

*Login with username and password. Uses JWT with an 8-hour expiration.

*Two roles: OPERATOR (read-only) and admin (read+write)
*Protect all backend endpoints with authorization middleware
*Protect frontend routes with Angular Guards.


### RF-05 - Bulk routes import

*Endpoint `POST /api/v1/routes/import` that receives a CSV file (use the provided dataset).
*Validate each row before persisting; return a summary: `{ imported: N, failed: M, errors: [...] }`.
*Health endpoint for environment checks: `GET /health`.

---
### Technical Requirements

### Backend requirements

1. Estructura en capas: controller , service, repository
2. DTOs with input validation (use Zod or class-validator).
3. Centralized error handling with semantic HTTP status codes.
4. SOAP integration through an adapter (`TrackingAdapter`) so the rest of the system remains transport-agnostic.
5. Cache strategy for SOAP tracking responses (TTL 60 seconds).
6. Environment variables for credentials and sensitive config (`.env` + `.env.example`).
7. Structured logs with correlation-id on each request (e.g., pino or winston).


### Security

1. Passwords hashed with bcrypt (with a factor >=12)
2. Validation and sanitization of all inputs in the backend
3. HTTP security headers (use Helmet)
4. Explicitly configured CORS; in development you can allow local frontend origins, but do not use permissive wildcard settings in production.
5. Rate limiting on the login endpoint (max. 5 attempts per minute per IP)
6. Do not hardcode secrets; all secrets should be stored in environment variables.


## Mock SOAP Trace Service

Implement the mock as you prefer (SOAP server with strong - soap, in the test adapter). The expected code is:

Request
```
<TrackRouteRequest>
    <routeId>string</routeId>
</TrackRouteRequest>
```

Response
```
<TrackRouteResponse>
    <routeId>string</routeId>
    <lastLocation>string</lastLocation>
    <progressPercent>number</progressPercent>
    <etaMinutes>number</etaMinutes>
    <timestamp>ISO8601</timestamp>
</TrackRouteResponse>

```
---
## Bonus (Backend & frontend)

1. Export the filtered route list to CSV from the frontend.

2. WebSockets for real-time updates of the monitoring panel (instead of 30-second polling).

3. Functional Docker Compose that launches the backend, frontend, and database with a single `docker-compose` command.

4. Basic CI pipeline (GitHub actions) that runs lint and tests on every push.

5. Cursor-based pagination instead of offset-based pagination to improve performance on large tables.

---

### Testing

| type: Unit |
| coverage |  > 70% backend services |
| examples | RouteService, TrackingAdapter, DTO validations

| type: Integration |
| coverage | less than 3 endpoints |
| examples | GET /api/v1/routes, POST /api/v1/routes, POST /api/v1/routes/import

| type: Frontend |
| coverage | less than 2 components |
| examples | Routest table(pagination and filters), creating form

---

## Deliverables

1. README.md in the project root directory containing:
*Instructions for setting up the local environment (docker-compose)
*Required environment variables (reference .env.example)
*Architectural decisions made and justification.

*Assumptions made during development.

2. DOCUMENTACION_IA.md in the project root directory.

3. Postman collection for testing the endpoints.

4. Seed script with the provided dataset.

---

## Routes Dataset

```
id,origin_city,destination_city,distance_km,estimated_time_hours,vehicle_type,carrier,cost_usd,status,created_at
1,Bogotá,Medellín,415.8,8.5,CAMION,TCC,320.00,ACTIVA,2024-01-05T08:00:00Z
2,Medellín,Cali,418.9,9.0,TRACTOMULA,Servientrega,350.00,ACTIVA,2024-01-06T09:00:00Z
3,Cali,Barranquilla,1050,18.0,TRACTOMULA,Coordinadora,480.00,ACTIVA,2024-01-07T07:30:00Z
4,Bogotá,Bucaramanga,395,7.5,CAMION,TCC,295.00,ACTIVA,2024-01-08T06:00:00Z
5,Barranquilla,Cartagena,120,2.5,FURGONETA,Depresa,95.00,ACTIVA,2024-01-08T10:00:00Z
6,Medellín,Pereira,178.3,5.5,FURGONETA,Envía,140.00,ACTIVA,2024-01-09T08:00:00Z
7,Bogotá,Villavicencio,88.0,4.0,CAMION,TCC,110.00,ACTIVA,2024-01-09T11:00:00Z
8,Cali,Pasto,254,6.0,CAMION,Coordinadora,210.00,INACTIVA,2024-01-10T07:00:00Z
9,Bucaramanga,Cúcuta,195,3.0,FURGONETA,Servientrega,150.00,ACTIVA,2024-01-10T09:30:00Z
10,Bogotá,Manizales,290,5.5,CAMION,TCC,230.00,ACTIVA,2024-01-11T08:00:00Z
11,Medellín,Santa Marta,730,13.0,TRACTOMULA,DHL Colombia,610.00,ACTIVA,2024-01-11T06:00:00Z
12,Barranquilla,Santa Marta,95,2.0,FURGONETA,Depresa,85.00,ACTIVA,2024-01-12T09:00:00Z
13,Bogotá,Cúcuta,585,11.0,TRACTOMULA,TCC,495.00,SUSPENDIDA,2024-01-12T07:00:00Z
14,Cali,Ibagué,200,4.0,CAMION,TCC,180.00,ACTIVA,2024-01-13T08:30:00Z
15,Pereira,Armenia,47.1,1.0,MOTO_CARGO,Envía,38.00,ACTIVA,2024-01-13T10:00:00Z
16,Pereira,Bogotá,290.5,5.0,CAMION,TCC,240.00,ACTIVA,2024-01-14T07:00:00Z
17,Medellín,Turbo,340,8.0,CAMION,Servientrega,275.00,ACTIVA,2024-01-14T09:00:00Z
18,Cartagena,Montería,145,4.0,CAMION,Depresa,120.00,ACTIVA,2024-01-15T08:00:00Z
19,Bogotá,Neiva,300,6.0,CAMION,TCC,245.00,INACTIVA,2024-01-15T10:30:00Z
20,Cali,Popayán,130,2.5,FURGONETA,Envía,104.00,ACTIVA,2024-01-16T07:30:00Z
21,Medellín,Manizales,195,3.0,CAMION,Servientrega,158.00,ACTIVA,2024-01-16T08:00:00Z
22,Bogotá,Tunja,148,3.0,FURGONETA,TCC,118.00,ACTIVA,2024-01-17T09:00:00Z
23,Barranquilla,Valledupar,285,5.0,CAMION,Depresa,200.00,ACTIVA,2024-01-17T07:00:00Z
24,Bucaramanga,Bogotá,395,7.5,TRACTOMULA,TCC,320.00,ACTIVA,2024-01-18T06:00:00Z
25,Cali,Buenaventura,115,2.5,CAMION,FedEx Colombia,95.00,ACTIVA,2024-01-18T10:00:00Z
26,Bogotá,Armenia,290,5.0,CAMION,TCC,235.00,ACTIVA,2024-01-19T08:00:00Z
27,Medellín,Bogotá,415,8.5,TRACTOMULA,Coltransa,390.00,ACTIVA,2024-01-19T07:00:00Z
28,Pasto,Ibagué,254,6.0,CAMION,Envía,210.00,EN MANTENIMIENTO,2024-01-20T09:00:00Z
29,Cartagena,Bogotá,1030,18.5,TRACTOMULA,Servientrega,860.00,ACTIVA,2024-01-20T06:00:00Z
30,Cúcuta,Bucaramanga,135,4.0,FURGONETA,Envía,158.00,ACTIVA,2024-01-21T08:30:00Z
31,Bogotá,Florencia,435,9.0,CAMION,TCC,355.00,ACTIVA,2024-01-21T07:00:00Z
32,Medellín,Quibdó,290,7.0,CAMION,Coordinadora,245.00,SUSPENDIDA,2024-01-22T09:00:00Z
33,Barranquilla,Montería,310,6.5,CAMION,Deprisa,240.00,ACTIVA,2024-01-22T08:00:00Z
34,Bogotá,Yopal,355,7.0,CAMION,TCC,285.00,ACTIVA,2024-01-23T07:30:00Z
35,Cali,Medellín,418,9.0,TRACTOMULA,Envía,470.00,ACTIVA,2024-01-23T16:00:00Z
36,Pereira,Medellín,178,3.5,FURGONETA,Envía,180.00,ACTIVA,2024-01-24T10:00:00Z
37,Manizales,Bogotá,185,4.0,CAMION,TCC,232.00,ACTIVA,2024-01-24T08:00:00Z
38,Ibagué,Cali,200,4.0,CAMION,Coordinadora,190.00,INACTIVA,2024-01-25T07:00:00Z
39,Santa Marta,Barranquilla,95,2.5,FURGONETA,Deprisa,78.00,ACTIVA,2024-01-25T09:30:00Z
40,Bogotá,Sincelejo,510,9.5,TRACTOMULA,TCC,495.00,ACTIVA,2024-01-26T06:00:00Z
41,Medellín,Cúcuta,580,11.0,TRACTOMULA,Envía,490.00,ACTIVA,2024-01-26T07:00:00Z
42,Cali,Neiva,245,5.0,CAMION,Coordinadora,215.00,ACTIVA,2024-01-27T06:00:00Z
43,Bogotá,Riohacha,1040,19.0,TRACTOMULA,TCC,935.00,ACTIVA,2024-01-27T06:00:00Z
44,Barranquilla,Medellín,710,9.0,CAMION,DHL Colombia,315.00,EN MANTENIMIENTO,2024-01-28T09:00:00Z
45,Barranquilla,Bogotá,1000,18.0,TRACTOMULA,FedEx Colombia,840.00,ACTIVA,2024-01-28T06:00:00Z
46,Pasto,Bogotá,630,13.0,TRACTOMULA,Envía,520.00,ACTIVA,2024-01-29T07:00:00Z
47,Cartagena,Montería,120,2.5,MOTO CARGO,Deprisa,50.00,ACTIVA,2024-01-29T10:00:00Z
48,Cali,Popayán,140,2.5,FURGONETA,Envía,105.00,SUSPENDIDA,2024-01-30T06:00:00Z
49,Bogotá,Leticia,1590,30.0,TRACTOMULA,TCC,1250.00,ACTIVA,2024-01-31T08:00:00Z
50,Medellín,Apartadó,265,5.5,TRACTOMULA,TCC,680.00,ACTIVA,2024-02-01T07:00:00Z
51,Bogotá,Arica,840,15.0,CAMION,Servientrega,215.00,ACTIVA,2024-02-01T07:00:00Z
52,Cali,Tumaco,300,7.0,CAMION,Coordinadora,248.00,ACTIVA,2024-02-01T09:00:00Z
53,Medellin,Rionegro,42,1.0,MOTO CARGO,Envia,35.00,ACTIVA,2024-02-01T10:30:00Z
54,Barranquilla,Sincelejo,200,4.0,FURGONETA,Deprisa,160.00,ACTIVA,2024-02-02T08:00:00Z
55,Bogotá,Popayán,425,8.0,CAMION,TCC,340.00,ACTIVA,2024-02-03T07:00:00Z
56,Manizales,Valledupar,340,7.0,CAMION,Envia,272.00,ACTIVA,2024-02-03T09:00:00Z
57,Cali,Bogotá,460,9.0,TRACTOMULA,Servientrega,385.00,ACTIVA,2024-02-04T06:00:00Z
58,Medellin,Monteria,450,9.0,TRACTOMULA,TCC,375.00,ACTIVA,2024-02-04T07:00:00Z
59,Bogotá,Medellin,410,8.0,TRACTOMULA,Coordinadora,505.00,ACTIVA,2024-02-05T06:00:00Z
60,Cartagena,Sincelejo,240,5.0,CAMION,FedEx Colombia,192.00,ACTIVA,2024-02-05T09:00:00Z
61,Pereira,Cali,220,4.5,CAMION,Envia,178.00,ACTIVA,2024-02-06T08:00:00Z
62,Manizales,Medellin,188,3.5,CAMION,TCC,150.00,ACTIVA,2024-02-06T10:00:00Z
63,Bogotá,Mocoa,600,12.5,TRACTOMULA,Envia,505.00,EN MANTENIMIENTO,2024-02-07T07:00:00Z
64,Bogotá,Bogotá,586,11.0,TRACTOMULA,Coordinadora,495.00,ACTIVA,2024-02-07T06:00:00Z
65,Santa Marta,Valledupar,185,3.5,FURGONETA,Deprisa,148.00,ACTIVA,2024-02-08T09:00:00Z
66,Bogotá,Tunja,148,3.0,CAMION,TCC,120.00,ACTIVA,2024-02-08T08:30:00Z
67,Medellin,Barrancabermeja,195,4.0,CAMION,FedEx Colombia,158.00,ACTIVA,2024-02-09T07:00:00Z
68,Cali,Bucaramanga,600,11.5,TRACTOMULA,TCC,490.00,SUSPENDIDA,2024-02-10T07:30:00Z
69,Bogotá,San José del Guaviare,580,12.0,TRACTOMULA,TCC,480.00,ACTIVA,2024-02-10T08:00:00Z
70,Barranquilla,Riohacha,290,6.0,CAMION,Servientrega,232.00,ACTIVA,2024-02-10T08:00:00Z
71,Pereira,Bogotá,290,5.5,CAMION,Envia,238.00,ACTIVA,2024-02-11T07:00:00Z
72,Pasto,Popayán,125,2.5,FURGONETA,Coordinadora,100.00,ACTIVA,2024-02-11T10:00:00Z
73,Bogotá,Medellin,415,7.5,TRACTOMULA,TCC,342.00,ACTIVA,2024-02-12T09:00:00Z
74,Cali,Manizales,265,5.0,CAMION,Servientrega,212.00,ACTIVA,2024-02-13T06:00:00Z
75,Medellin,Barranquilla,740,13.5,TRACTOMULA,Servientrega,622.00,ACTIVA,2024-02-13T07:00:00Z
76,Bogotá,Cartagena,1030,18.5,TRACTOMULA,TCC,865.00,ACTIVA,2024-02-14T06:00:00Z
77,Bogotá,Cartagena,1030,18.5,TRACTOMULA,TCC,865.00,ACTIVA,2024-02-14T06:00:00Z
78,Cúcuta,Medellín,580,11.0,TRACTOMULA,Coordinadora,488.00,ACTIVA,2024-02-14T07:00:00Z
79,Barranquilla,Cartagena,120,2.5,CAMION,Deprisa,98.00,ACTIVA,2024-02-15T09:00:00Z
80,Bogotá,Cali,460,9.0,TRACTOMULA,Servientrega,385.00,ACTIVA,2024-02-15T06:00:00Z
81,Medellín,Neiva,430,8.5,TRACTOMULA,TCC,360.00,ACTIVA,2024-02-16T07:00:00Z
82,Cali,Cartagena,1070,19.0,TRACTOMULA,FeDex Colombia,900.00,EN MANTENIMIENTO,2024-02-16T06:00:00Z
83,Bogotá,Barrancabermeja,310,6.0,CAMION,Coordinadora,248.00,ACTIVA,2024-02-17T08:00:00Z
84,Pereira,Manizales,50,1.0,MOTO_CARGO,Envía,40.00,ACTIVA,2024-02-17T10:30:00Z
85,Medellín,Ibagué,350,7.0,CAMION,TCC,290.00,ACTIVA,2024-02-18T07:00:00Z
86,Cali,Armenia,130,2.5,FURGONETA,Coordinadora,105.00,ACTIVA,2024-02-18T09:00:00Z
87,Bogotá,Montería,500,9.5,TRACTOMULA,Servientrega,420.00,ACTIVA,2024-02-19T06:00:00Z
88,Barranquilla,Montería,310,6.5,TRACTOMULA,ML Colombia,260.00,SUSPENDIDA,2024-02-19T07:00:00Z
89,Pasto,Medellín,810,16.0,TRACTOMULA,TCC,680.00,ACTIVA,2024-02-20T06:00:00Z
90,Cúcuta,Barranquilla,780,14.5,TRACTOMULA,Coordinadora,635.00,ACTIVA,2024-02-20T07:00:00Z
91,Bogotá,Buenaventura,530,10.0,TRACTOMULA,FeDex Colombia,445.00,ACTIVA,2024-02-21T06:00:00Z
92,Medellín,Pasto,870,17.0,TRACTOMULA,TCC,730.00,ACTIVA,2024-02-21T07:00:00Z
93,Cali,Santa Marta,1100,20.0,TRACTOMULA,TCC,820.00,INACTIVA,2024-02-22T06:00:00Z
94,Bogotá,Santa Marta,975,17.5,TRACTOMULA,Coordinadora,820.00,ACTIVA,2024-02-23T06:00:00Z
95,Medellín,Barranquilla,495,9.5,TRACTOMULA,DHL Colombia,415.00,ACTIVA,2024-02-23T06:00:00Z
96,Pereira,Tunja,340,6.5,CAMION,TCC,272.00,ACTIVA,2024-02-23T08:00:00Z
97,Manizales,Cali,126,2.0,CAMION,Envía,212.00,ACTIVA,2024-02-24T07:00:00Z
98,Bogotá,Valledupar,1060,19.5,TRACTOMULA,Servientrega,892.00,ACTIVA,2024-02-24T06:00:00Z
99,Medellín,Florencia,560,11.0,TRACTOMULA,TCC,470.00,EN MANTENIMIENTO,2024-02-25T07:00:00Z
100,Cali,Barranquilla,1050,18.0,TRACTOMULA,FeDex Colombia,882.00,ACTIVA,2024-02-25T06:00:00Z
```

---