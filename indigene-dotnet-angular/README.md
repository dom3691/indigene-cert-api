# Automated Indigene Certificate Issuance System (.NET + Angular + SQL Server)

A multi-tenant government SaaS where each Nigerian state (tenant) issues digital
indigene certificates. Applicants apply online, pay a fee, officers review and
approve, and a verifiable certificate (unique number + QR code) is generated.
Anyone can publicly verify a certificate by its number.

This is a full re-implementation of the original (TypeScript/Express/React/
Postgres) system on a new stack so it can be run on a local Windows machine:

| Layer | Technology |
|---|---|
| Database | Microsoft SQL Server (managed with SSMS) |
| Backend API | ASP.NET Core 8 Web API + Entity Framework Core |
| Frontend | Angular 17+ (standalone components) |

> This project is delivered as source code to run on your own machine. It is not
> hosted or runnable on Replit.

---

## Prerequisites (install on Windows)

1. **.NET 8 SDK** — https://dotnet.microsoft.com/download/dotnet/8.0
   (verify with `dotnet --version` → should be `8.x`).
2. **Node.js 18+ and npm** — https://nodejs.org (verify `node -v`, `npm -v`).
3. **Angular CLI** — `npm install -g @angular/cli`.
4. **SQL Server** — any one of:
   - SQL Server Express (free) — https://www.microsoft.com/sql-server/sql-server-downloads, or
   - SQL Server LocalDB (ships with Visual Studio / SSDT), or
   - SQL Server Developer Edition.
5. **SQL Server Management Studio (SSMS)** — https://aka.ms/ssmsfullsetup
   (used to run the database scripts).

---

## Project layout

```
indigene-dotnet-angular/
├── database/          # T-SQL scripts to create + seed the SQL Server database
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── backend/           # ASP.NET Core 8 Web API (EF Core, SQL Server)
├── frontend/          # Angular 17+ single-page app
└── docs/
    └── SPEC.md        # Authoritative contract shared by all three layers
```

---

## Step 1 — Create the database

You have two options. **Option A (scripts) is recommended** so the data lives in
a real SQL Server database you can browse in SSMS.

### Option A — Run the SQL scripts in SSMS (recommended)

1. Open **SSMS** and connect to your SQL Server instance
   (e.g. `localhost`, `localhost\SQLEXPRESS`, or `(localdb)\MSSQLLocalDB`).
2. Open `database/01_schema.sql`, make sure "SQLCMD Mode" is not required, and
   click **Execute**. This creates the `IndigeneCertDb` database and all 10 tables.
   The script is re-runnable (it drops existing tables first).
3. Open `database/02_seed.sql` and click **Execute**. This loads the demo tenants,
   users, geography, applications, payments, the issued certificate, notifications,
   and audit logs. It is also re-runnable (it clears and re-seeds every table and
   resets identity counters).

### Option B — Let the backend create + seed automatically

The backend calls `EnsureCreated()` and an EF seeder on startup. If the database
does not yet exist, it will be created from the EF model and seeded with the same
demo data. This means you can skip Option A entirely and just run the backend —
but you will not have run the raw scripts. (If you ran Option A first, the seeder
detects existing data and does nothing.)

---

## Step 2 — Run the backend API

```
cd backend
dotnet restore
dotnet run
```

By default the API listens on **http://localhost:5000** (and https on 5001). The
first run will create/seed the database if needed.

Quick check: open **http://localhost:5000/api/healthz** → `{"status":"ok"}`.
In Development you also get Swagger UI at **http://localhost:5000/swagger**.

### Connection string

Edit `backend/appsettings.json` → `ConnectionStrings:DefaultConnection` to match
your SQL Server instance. Common values:

- Default instance, Windows auth:
  `Server=localhost;Database=IndigeneCertDb;Trusted_Connection=True;TrustServerCertificate=True`
- SQL Express:
  `Server=localhost\\SQLEXPRESS;Database=IndigeneCertDb;Trusted_Connection=True;TrustServerCertificate=True`
- LocalDB:
  `Server=(localdb)\\MSSQLLocalDB;Database=IndigeneCertDb;Trusted_Connection=True;TrustServerCertificate=True`

### Changing the backend port

If you run the API on a different port, update `frontend/proxy.conf.json` so the
frontend proxies `/api` to the same port (see Step 3).

---

## Step 3 — Run the frontend

```
cd frontend
npm install
ng serve
```

Open **http://localhost:4200**.

The Angular dev server proxies all `/api/*` requests to the backend via
`frontend/proxy.conf.json` (configured to `http://localhost:5000`). If your
backend runs on a different port, edit that file and restart `ng serve`.

The backend is configured with CORS allowing `http://localhost:4200`, so direct
calls work too.

---

## Using the app (demo accounts)

Authentication is an intentional **demo account switcher** — there is no real
login/SSO (this mirrors the original system). On the **Sign In** page you pick one
of the seeded accounts; the choice is stored in the browser's `localStorage`.

| Account | Role | What they can do |
|---|---|---|
| Adaeze Okafor (superadmin@indigene.gov.ng) | Platform Super Admin | View platform overview, manage tenants (states) |
| Bola Adeyemi (admin@lagosstate.gov.ng) | Tenant Admin (Lagos) | Dashboard, settings/branding/fees, LGAs & wards, officers, audit log |
| Chinedu Eze (officer1@lagosstate.gov.ng) | Issuing Officer (Lagos) | Review queue, approve/reject, generate/revoke certificates |
| Tunde Balogun (tunde@example.com) | Applicant | Apply, upload documents, pay, track, download certificate |
| Ngozi Okwu (ngozi@example.com) | Applicant | Same as above |
| Ibrahim Sani / Aisha Yusuf | Kano admin / officer | Same roles, scoped to Kano State |

**Public certificate verification** is genuinely public (no sign-in): go to
**/verify** and enter a certificate number such as `LAG/2026/00001` (the year
matches the year you seeded). The seeded issued certificate belongs to Tunde
Balogun in Lagos State.

### Typical end-to-end flow

1. Sign in as **Tunde Balogun** (applicant) → start a new application, fill the
   wizard, save the draft, then submit it (status becomes *awaiting payment*).
2. Pay the fee (simulated) → status becomes *paid*.
3. Sign in as **Chinedu Eze** (officer) → open the application from the review
   queue → approve. A certificate with a unique number and QR code is generated;
   the application becomes *issued*.
4. Sign back in as the applicant → view/print the certificate.
5. Anyone can open **/verify** and confirm the certificate number is valid.

---

## How it maps to the original system

The contract in `docs/SPEC.md` is faithful to the original:

- **Same 10 tables**, same fields, same status flow:
  `draft → awaiting_payment → paid → (under_review) → issued / rejected`, and
  `revoke → revoked`.
- **Same API surface** under `/api` (accounts, tenants, geography, officers,
  applications with state-machine guards, certificates + public verify, platform
  overview, audit logs, notifications).
- **Same business rules:** certificate numbers are per-tenant
  `PREFIX/YEAR/paddedId(5)`; an officer must belong to the application's tenant and
  have the `officer` role to approve/reject; application details are editable only
  while in *draft*; re-approving a revoked application reactivates the existing
  certificate **keeping the same number**.
- **Multi-tenant isolation** by `tenantId` throughout.

---

## Notes & gotchas

- **Certificate numbers contain slashes** (e.g. `LAG/2026/00001`). The backend
  exposes verification as a catch-all route (`/api/verify/{*certificateNumber}`)
  and the Angular client sends the slashes literally, so verification works
  without percent-encoding issues.
- **JSON shape:** the API uses camelCase property names; numeric fields (fees,
  amounts, revenue) are JSON numbers; dates are ISO-8601 strings; null fields are
  emitted as `null` — matching the original frontend's expectations.
- **Re-seeding:** re-running `02_seed.sql` resets all identity counters, so row
  IDs restart at 1 each time. The certificate number uses the current year.
- **No emojis** anywhere in the UI, by design.
- This codebase is intended to be compiled and run locally (`dotnet run`,
  `ng serve`); it is not deployed or run on Replit.
