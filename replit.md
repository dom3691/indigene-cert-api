# Automated Indigene Certificate Issuance System

A multi-tenant government SaaS web app where each Nigerian state (tenant) issues digital indigene certificates. Applicants apply online, pay a fee, officers review and approve, and a verifiable certificate (unique number + QR) is generated. Anyone can publicly verify a certificate.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/indigene-portal run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/scripts run seed` — (re)seed demo tenants, users, geography, applications, one issued certificate
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + wouter + TanStack Query + shadcn/ui (Tailwind); `qrcode.react` for QR codes
- Build: esbuild (CJS bundle) for the API server

## Where things live

- DB schema (source of truth): `lib/db/src/schema/` — 10 tables: tenants, users, lgas, wards, applications, documents, payments, certificates, auditLogs, notifications. Exported from `index.ts`.
- API contract (source of truth): `lib/api-spec/openapi.yaml`. Codegen output: hooks in `@workspace/api-client-react`, Zod schemas in `@workspace/api-zod`.
- Backend routes: `artifacts/api-server/src/routes/` (accounts, tenants, applications, certificates, platform) registered in `routes/index.ts`. Helpers in `src/lib/` (serialize, relations, audit).
- Frontend: `artifacts/indigene-portal/src/` — pages grouped by role under `pages/` (public, applicant, officer, admin, superadmin); `lib/auth.tsx` (demo session), `components/layout/AppShell.tsx`.
- Seed script: `scripts/src/seed.ts`.

## Architecture decisions

- **Demo auth, no SSO.** `GET /api/accounts` lists demo accounts; the frontend picks one and stores it in `localStorage` via `useAuth`. Public certificate verification is genuinely public (no auth).
- **Contract-first.** OpenAPI is the source of truth; never hand-edit generated client/zod code — change the spec and run codegen. Do not change the OpenAPI `info.title` (controls generated filenames).
- **Tenant isolation** is enforced in queries by `tenantId`; certificate numbers are per-tenant `PREFIX/YEAR/paddedId`.
- **App status flow:** draft → awaiting_payment (submit) → paid → (under_review) → issued (approve generates certificate) / rejected; revoke → revoked.
- **Numeric/date serialization:** Postgres `numeric` fields come back as strings (coerce with `Number()`); dates are returned as ISO strings via mappers in `src/lib/serialize.ts`.

## Product

- Roles: Platform Super Admin (tenants/platform overview), Tenant Admin (branding, fees, LGAs/wards, officers, audit), Issuing Officer (review queue, approve/reject, generate certificate), Applicant (apply, upload docs, pay, track, download certificate).
- Public certificate verification by certificate number, returning validity + holder/state details.

## User preferences

- No emojis in the product UI.

## Gotchas

- **wouter nested layout routing:** the authenticated section uses a bare catch-all `<Route>` (no `path`) to wrap `AppShell`, NOT `<Route path="/:rest*">`. A path ending in `*` triggers wouter's nested-base stripping, which silently blanks any multi-segment child route (e.g. `/apply/new`). Keep the wrapper path-less.
- **Verification URL encoding:** certificate numbers contain slashes (`LAG/2026/00001`). When calling `useVerifyCertificate`, pass `encodeURIComponent(...)` so the slashes survive the `/api/verify/:certificateNumber` path param.
- **Query hooks:** when passing query options, `queryKey` is required — use the generated `getXQueryKey(...)`.
- After running an e2e test (which mutates the dev DB), re-run the seed script to restore clean demo state. Re-seeding clears and re-inserts all rows, so DB IDs change every run — never hardcode IDs in tests; fetch them from `/api/accounts` and `/api/applications` first.
- **State-machine guards** are enforced per-endpoint in `applications.ts` (PATCH/pay/approve/reject), not via a generic status setter. PATCH only allows `draft→awaiting_payment`; approve/reject require a valid prior state plus officer-tenant match. `approve` accepts a `revoked` app and reactivates its existing certificate in place (status→valid, reason cleared, same cert number). See memory `state-machine-guards.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
