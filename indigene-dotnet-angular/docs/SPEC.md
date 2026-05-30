# Indigene Certificate System — Port Specification (.NET + Angular + SQL Server)

This is the authoritative contract for a faithful port of the existing
multi-tenant "Automated Indigene Certificate Issuance System" from
(pnpm/TypeScript/Express/Postgres/React) to:

- **Backend:** ASP.NET Core 8 Web API + Entity Framework Core (SQL Server provider)
- **Database:** Microsoft SQL Server (managed via SSMS); raw T-SQL schema + seed scripts
- **Frontend:** Angular 17+ (standalone components, HttpClient, RxJS, Angular Router)

All three pieces share this single contract. Field names, response shapes,
endpoints, state-machine rules, and seed data MUST match exactly so the parts
interoperate. This product CANNOT run on Replit; it is delivered for the user to
run on their own Windows machine.

## Product summary

A government SaaS where each Nigerian **state = tenant** issues digital indigene
certificates. Applicants apply online, pay a fee, officers review/approve, and a
verifiable certificate (unique number + QR) is generated. Anyone can publicly
verify a certificate by its number.

**Roles:** `super_admin` (platform), `tenant_admin` (state admin), `officer`
(issuing officer), `applicant`.

**Auth is a DEMO account switcher** — NO real SSO. `GET /api/accounts` lists demo
accounts; the frontend picks one and stores it in `localStorage`. Public
certificate verification is genuinely public (no auth). Do NOT add real
authentication.

**No emojis anywhere in the UI.**

---

## 1. Database schema (10 tables)

Conventions for SQL Server:
- Postgres `serial` PK → `INT IDENTITY(1,1) PRIMARY KEY`.
- Postgres `text` → `NVARCHAR(MAX)` (or `NVARCHAR(256)` for short codes is fine; keep simple with NVARCHAR(MAX) unless noted).
- Postgres `numeric(12,2)` → `DECIMAL(12,2)`.
- Postgres `timestamp with time zone` → `DATETIMEOFFSET`.
- Postgres `boolean` → `BIT`.
- Table names are snake_case plural (`tenants`, `users`, `lgas`, `wards`,
  `applications`, `documents`, `payments`, `certificates`, `audit_logs`,
  `notifications`). Column names snake_case. EF Core entities use PascalCase C#
  property names mapped to these snake_case columns.

Defaults: `created_at`/`uploaded_at`/`paid_at`/`issue_date` default to
`SYSDATETIMEOFFSET()`. `status` defaults as noted. `read` BIT defaults 0.

### tenants
| column | type | notes |
|---|---|---|
| id | INT IDENTITY PK | |
| name | NVARCHAR | NOT NULL |
| code | NVARCHAR | NOT NULL (e.g. "LA") |
| slug | NVARCHAR | NOT NULL (lowercased, hyphenated name) |
| certificate_prefix | NVARCHAR | NOT NULL (e.g. "LAG") |
| fee | DECIMAL(12,2) | NOT NULL default 0 |
| currency | NVARCHAR | NOT NULL default 'NGN' |
| status | NVARCHAR | NOT NULL default 'active' (active|suspended) |
| contact_email | NVARCHAR NULL | |
| contact_phone | NVARCHAR NULL | |
| address | NVARCHAR NULL | |
| capital | NVARCHAR NULL | |
| logo_url | NVARCHAR NULL | |
| primary_color | NVARCHAR NULL | hex like #1f7a4d |
| tagline | NVARCHAR NULL | |
| created_at | DATETIMEOFFSET | NOT NULL default now |

### users
| id INT IDENTITY PK | name NVARCHAR NOT NULL | email NVARCHAR NOT NULL | role NVARCHAR NOT NULL (super_admin|tenant_admin|officer|applicant) | tenant_id INT NULL | status NVARCHAR NOT NULL default 'active' | created_at DATETIMEOFFSET NOT NULL default now |

### lgas
| id INT IDENTITY PK | tenant_id INT NOT NULL | name NVARCHAR NOT NULL | code NVARCHAR NULL |

### wards
| id INT IDENTITY PK | lga_id INT NOT NULL | name NVARCHAR NOT NULL |

### applications
| column | type | notes |
|---|---|---|
| id | INT IDENTITY PK | |
| tenant_id | INT NOT NULL | |
| applicant_id | INT NOT NULL | |
| first_name | NVARCHAR NULL | |
| middle_name | NVARCHAR NULL | |
| last_name | NVARCHAR NULL | |
| gender | NVARCHAR NULL | |
| date_of_birth | NVARCHAR NULL | stored as string (e.g. "1990-04-12") |
| nin | NVARCHAR NULL | |
| email | NVARCHAR NULL | |
| phone | NVARCHAR NULL | |
| residential_address | NVARCHAR NULL | |
| state_of_origin | NVARCHAR NULL | |
| lga_id | INT NULL | |
| ward_id | INT NULL | |
| father_name | NVARCHAR NULL | |
| mother_name | NVARCHAR NULL | |
| community | NVARCHAR NULL | |
| status | NVARCHAR NOT NULL default 'draft' | draft|awaiting_payment|paid|under_review|issued|rejected|revoked |
| rejection_reason | NVARCHAR NULL | |
| submitted_at | DATETIMEOFFSET NULL | |
| reviewed_at | DATETIMEOFFSET NULL | |
| reviewed_by_id | INT NULL | |
| created_at | DATETIMEOFFSET NOT NULL default now | |
| updated_at | DATETIMEOFFSET NOT NULL default now | set to now on every update |

### documents
| id INT IDENTITY PK | application_id INT NOT NULL | name NVARCHAR NOT NULL | type NVARCHAR NOT NULL | file_name NVARCHAR NOT NULL | size_kb INT NULL | uploaded_at DATETIMEOFFSET NOT NULL default now |

### payments
| id INT IDENTITY PK | application_id INT NOT NULL | tenant_id INT NOT NULL | amount DECIMAL(12,2) NOT NULL default 0 | currency NVARCHAR NOT NULL default 'NGN' | reference NVARCHAR NOT NULL | gateway NVARCHAR NULL | status NVARCHAR NOT NULL default 'success' | payer_name NVARCHAR NULL | receipt_number NVARCHAR NULL | paid_at DATETIMEOFFSET NOT NULL default now |

### certificates
| id INT IDENTITY PK | application_id INT NOT NULL | tenant_id INT NOT NULL | certificate_number NVARCHAR NOT NULL | applicant_display_name NVARCHAR NOT NULL | lga_name NVARCHAR NULL | ward_name NVARCHAR NULL | state_of_origin NVARCHAR NULL | issue_date DATETIMEOFFSET NOT NULL default now | status NVARCHAR NOT NULL default 'valid' (valid|revoked) | issued_by_id INT NULL | issued_by_name NVARCHAR NULL | revoked_reason NVARCHAR NULL |

### audit_logs
| id INT IDENTITY PK | tenant_id INT NULL | actor_name NVARCHAR NOT NULL | actor_role NVARCHAR NULL | action NVARCHAR NOT NULL | record_type NVARCHAR NULL | record_id NVARCHAR NULL (stored as string) | outcome NVARCHAR NULL | detail NVARCHAR NULL | created_at DATETIMEOFFSET NOT NULL default now |

### notifications
| id INT IDENTITY PK | user_id INT NOT NULL | application_id INT NULL | type NVARCHAR NOT NULL | title NVARCHAR NOT NULL | message NVARCHAR NOT NULL | read BIT NOT NULL default 0 | created_at DATETIMEOFFSET NOT NULL default now |

No FK constraints are strictly required (the original uses logical references only),
but adding non-cascading FKs is acceptable. Keep IDENTITY so inserts auto-number.

---

## 2. API contract — base path `/api`

All endpoints are under `/api`. Responses are JSON. Dates serialized as ISO-8601
strings (UTC, e.g. `2026-05-30T10:00:00.000Z` — use `DateTimeOffset.ToUniversalTime()`
with `o`/round-trip or equivalent ISO format). Numeric fields (`fee`, `amount`,
`revenue`, `totalRevenue`) serialized as JSON **numbers**, not strings. Null fields
are emitted as `null`.

JSON property naming: **camelCase** (configure ASP.NET Core
`JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase`).

Error responses: `{ "error": "message" }` with appropriate status code
(400 invalid body/params, 403 unauthorized officer, 404 not found, 409 illegal
state transition).

### Health
- `GET /api/healthz` → `{ "status": "ok" }`

### Accounts (demo auth)
- `GET /api/accounts` → list of all users ordered by id ascending. Each:
  `{ id, name, email, role, tenantId (nullable), tenantName (nullable) }`.

### Tenants
- `GET /api/tenants?status=active|suspended` (status optional) → array of Tenant
  DTO, **sorted by name ascending**.
- `POST /api/tenants` body `TenantInput {name, code, certificatePrefix, fee,
  currency?, contactEmail?, contactPhone?, address?, capital?, primaryColor?,
  tagline?}` → 201 Tenant DTO. Server sets `slug = slugify(name)`,
  `currency` defaults "NGN", `status` defaults "active". Writes audit:
  actorName "Platform Super Admin", actorRole super_admin, action "Created tenant",
  recordType tenant, recordId id, outcome success, detail "Onboarded {name}".
- `GET /api/tenants/{id}` → Tenant DTO or 404.
- `PATCH /api/tenants/{id}` body `TenantUpdate` (all optional: name,
  certificatePrefix, fee, currency, status, contactEmail, contactPhone, address,
  capital, primaryColor, tagline) → Tenant DTO. Only provided fields update.
  Writes audit: actorName "Administrator", actorRole tenant_admin, action
  (`Set tenant status to {status}` if status provided else "Updated tenant
  settings"), recordType tenant, recordId id, outcome success, detail
  "Updated {name}".

**Tenant DTO:** `{ id, name, code, slug, certificatePrefix, fee (number),
currency, status, contactEmail, contactPhone, address, capital, logoUrl,
primaryColor, tagline, createdAt (iso) }`.

### Geography
- `GET /api/tenants/{id}/lgas` → array of Lga DTO sorted by name; each Lga has
  nested `wards` (sorted by name). `Lga DTO {id, tenantId, name, code, wards: [{id, lgaId, name}]}`.
- `POST /api/tenants/{id}/lgas` body `{name, code?}` → 201 Lga DTO (empty wards).
  Audit: actorName "Administrator", tenant_admin, "Added LGA", recordType lga,
  recordId id, success, "Added {name}".
- `POST /api/lgas/{id}/wards` body `{name}` → 201 Ward DTO `{id, lgaId, name}`.

### Officers (staff)
- `GET /api/tenants/{id}/officers` → users of that tenant with role `officer` OR
  `tenant_admin`, sorted by name. Each Officer DTO:
  `{ id, tenantId, name, email, role, status, reviewedCount, createdAt (iso) }`
  where `reviewedCount` = number of applications in that tenant whose
  `reviewedById` == user id.
- `POST /api/tenants/{id}/officers` body `{name, email, role?}` (role defaults
  "officer") → 201 Officer DTO (reviewedCount 0). status "active". Audit:
  "Administrator", tenant_admin, "Added officer", recordType user, recordId id,
  success, "Granted {role} access to {name}".

### Applications
- `GET /api/applications` query filters (all optional, AND-combined):
  `applicantId`, `tenantId`, `status`, `lgaId`, `officerId` (maps to
  reviewedById), plus `search` (case-insensitive substring match against
  applicantName, nin, email, certificate.certificateNumber — applied AFTER
  building DTOs). Ordered by `createdAt` descending. → array of Application DTO.
- `POST /api/applications` body `ApplicationInput {tenantId, applicantId, ...
  optional detail fields}` → 201 Application DTO. New apps start status "draft".
- `GET /api/applications/{id}` → Application DTO or 404.
- `PATCH /api/applications/{id}` body `ApplicationUpdate` (optional detail fields
  + optional `status`). **State-machine guards (CRITICAL):**
  - If `status` provided: must be a valid status. Allowed transitions via this
    endpoint ONLY: `draft → awaiting_payment` (submit) or a no-op
    (`status == current.status`). Any other transition → **409**.
  - Detail field edits (any non-status field) are allowed ONLY while
    `current.status == "draft"`; otherwise → **409** "Application details can
    only be edited while in draft".
  - When transitioning to `awaiting_payment`, set `submittedAt = now` and write
    audit: actorName = applicant display name, actorRole applicant, action
    "Submitted application", recordType application, recordId id, outcome
    success, detail "Application submitted, awaiting payment".
- `POST /api/applications/{id}/documents` body `{name, type, fileName, sizeKb?}`
  → 201 Document DTO `{id, applicationId, name, type, fileName, sizeKb,
  uploadedAt (iso)}`.
- `POST /api/applications/{id}/pay` body `PaymentInput {payerName, method?}`.
  Guard: app status MUST be `awaiting_payment` else **409**. Looks up tenant for
  `fee`/`currency` (defaults 0 / "NGN"). If no payment row exists for the app,
  insert one: amount=fee, currency, reference=ref("PAY"), gateway=method ??
  "Card", status "success", payerName, receiptNumber=ref("RCPT"). Set app status
  → "paid". Audit: actorName payerName, applicant, "Paid application fee",
  recordType payment, recordId app id, success, detail "{currency} {fee with
  thousands separators} received". → Application DTO.
- `POST /api/applications/{id}/approve` body `ApprovalInput {officerId, note?}`.
  Guards: app status MUST be one of `paid|under_review|revoked` else **409**.
  Officer (users row with that id) must exist AND `officer.tenantId ==
  app.tenantId` AND `officer.role == "officer"` else **403**.
  - Resolve lgaName/wardName from app.lgaId/wardId (lookups).
  - displayName = applicant display name.
  - If NO certificate exists for the app: create one. certificateNumber =
    `{tenant.certificatePrefix ?? "CERT"}/{currentYear}/{app.id padded to 5}`,
    applicantDisplayName=displayName, lgaName, wardName, stateOfOrigin =
    app.stateOfOrigin ?? tenant.name, status "valid", issuedById officer.id,
    issuedByName officer.name.
  - Else if certificate exists but status != "valid" (revoked re-approval):
    update it in place → status "valid", revokedReason null, issuedById/
    issuedByName to this officer. **Keep the same certificate number.**
  - Update app: status "issued", reviewedById officerId, reviewedAt now,
    rejectionReason null.
  - Insert notification: userId app.applicantId, applicationId, type "approved",
    title "Certificate issued", message "Your indigene certificate
    {certNumber} has been issued."
  - Audit: actorName officer.name, officer, "Approved application", recordType
    certificate, recordId certNumber, outcome "issued", detail "Issued
    certificate to {displayName}". → Application DTO.
- `POST /api/applications/{id}/reject` body `RejectionInput {officerId, reason}`.
  Guards: app status MUST be `paid|under_review` else **409**. Officer authz same
  as approve (else 403). Update app: status "rejected", reviewedById, reviewedAt
  now, rejectionReason reason. Notification: type "rejected", title "Application
  rejected", message reason. Audit: officer.name, officer, "Rejected
  application", recordType application, recordId app id, outcome "rejected",
  detail reason. → Application DTO.

**`ref(prefix)` helper:** generates a pseudo-unique string like
`PREFIX-{base36 timestamp upper}-{random 1000..9999}`. Any equivalent unique ref
is fine.

**Application DTO:** `{ id, tenantId, tenantName, applicantId, applicantName,
firstName, middleName, lastName, gender, dateOfBirth, nin, email, phone,
residentialAddress, stateOfOrigin, lgaId, lgaName, wardId, wardName, fatherName,
motherName, community, status, rejectionReason, submittedAt (iso|null), reviewedAt
(iso|null), reviewedById, reviewedByName, createdAt (iso), updatedAt (iso),
documents: [Document DTO], payment: Payment DTO|null, certificate: Certificate
DTO|null }`.
- `applicantName` = full name from first/middle/last (space-joined, blanks
  dropped) OR the applicant user's name OR "Applicant".
- `tenantName`, `lgaName`, `wardName`, `reviewedByName` resolved via lookups.

**Payment DTO:** `{ id, applicationId, tenantId, amount (number), currency,
reference, gateway, status, payerName, receiptNumber, paidAt (iso|null) }`.

**Certificate DTO:** `{ id, applicationId, tenantId, tenantName, certificateNumber,
applicantDisplayName, lgaName, wardName, stateOfOrigin, issueDate (iso), status,
verificationUrl, issuedByName, revokedReason }`. `verificationUrl` =
`/verify?cert={URL-encoded certificateNumber}`.

### Certificates & verification
- `GET /api/certificates/{id}` → Certificate DTO (tenantName from tenant lookup) or 404.
- `POST /api/certificates/{id}/revoke` body `{reason}`. Update cert status
  "revoked", revokedReason reason. Also set the linked application status →
  "revoked". Insert notification to applicant: type "revoked", title
  "Certificate revoked", message "Certificate {number} has been revoked.
  {reason}". Audit: actorName "Issuing Officer", officer, "Revoked certificate",
  recordType certificate, recordId certNumber, outcome "revoked", detail reason.
  → Certificate DTO. (404 if cert missing.)
- `GET /api/verify/{certificateNumber}` — **PUBLIC**. certificateNumber contains
  slashes; the path segment is URL-encoded by the client and decoded by the
  server. Look up by exact certificateNumber.
  - Not found → `{ found:false, status:"not_found", result:"No certificate
    matches this number. It may be invalid or fraudulent.", certificateNumber }`.
  - Found → `{ found:true, status:(cert.status), result:(valid? "This is a
    genuine, valid indigene certificate." : "This certificate has been revoked
    and is no longer valid."), certificateNumber, applicantDisplayName,
    tenantName, lgaName, stateOfOrigin, issueDate (iso) }`.

### Dashboard / platform / audit / notifications
- `GET /api/tenants/{id}/dashboard` → TenantDashboard (404 if tenant missing):
  `{ tenantId, tenantName, totalApplications, pendingReview (apps status paid OR
  under_review), issuedCertificates (certs status valid), rejectedApplications
  (apps status rejected), totalRevenue (sum of successful payment amounts),
  successfulPayments (count), statusBreakdown: [{status, count}] in canonical
  status order, lgaBreakdown: [{lgaName, count}] sorted by count desc
  (null lga → "Unassigned"), monthlyTrend: [{month (short name e.g. "Jan"),
  applications, certificates}] for the last 6 months including current,
  recentApplications: up to 6 most recent Application DTOs (payment/certificate/
  documents may be null/empty here — only summary fields needed), recentActivity:
  up to 8 most recent audit logs for the tenant }`.
- `GET /api/platform/overview` → `{ totalTenants, activeTenants, suspendedTenants,
  totalApplications, totalCertificates (valid only), totalRevenue, tenants:
  [{tenantId, tenantName, status, applications, certificates (valid), revenue}]
  sorted by applications desc, recentActivity: up to 10 most recent audit logs
  (platform-wide) }`.
- `GET /api/audit-logs?tenantId={id}&limit={n}` (both optional; limit default 50)
  → array of AuditLog DTO ordered by createdAt desc. AuditLog DTO:
  `{ id, tenantId, tenantName, actorName, actorRole, action, recordType,
  recordId, outcome, detail, createdAt (iso) }`.
- `GET /api/notifications?userId={id}` (userId required, else 400) → array of
  Notification DTO ordered by createdAt desc. Notification DTO:
  `{ id, userId, applicationId, type, title, message, read (bool), createdAt }`.
- `POST /api/notifications/{id}/read` → set read=true, return Notification DTO
  (404 if missing).

---

## 3. Seed data (translate to T-SQL and/or an EF seeder)

Insert in dependency order. Use relative dates computed from "today" (e.g.
`DATEADD(day, -N, SYSDATETIMEOFFSET())`).

**Tenants (3):**
1. Lagos State — code LA, slug lagos, prefix LAG, fee 5000, NGN, active,
   indigene@lagosstate.gov.ng, +234 1 700 0001, "The Secretariat, Alausa, Ikeja,
   Lagos", capital Ikeja, color #1f7a4d, tagline "Centre of Excellence".
2. Kano State — code KN, slug kano, prefix KAN, fee 3500, NGN, active,
   indigene@kanostate.gov.ng, +234 64 700 0002, "Government House, Kano", capital
   Kano, color #0f5b8a, tagline "Centre of Commerce".
3. Enugu State — code EN, slug enugu, prefix ENU, fee 4000, NGN, **suspended**,
   indigene@enugustate.gov.ng, +234 42 700 0003, "Government House, Independence
   Layout, Enugu", capital Enugu, color #7a3b1f, tagline "Coal City State".

**Users (8)** (role, tenant):
1. Adaeze Okafor — superadmin@indigene.gov.ng — super_admin — no tenant
2. Bola Adeyemi — admin@lagosstate.gov.ng — tenant_admin — Lagos
3. Chinedu Eze — officer1@lagosstate.gov.ng — officer — Lagos
4. Funke Bello — officer2@lagosstate.gov.ng — officer — Lagos
5. Tunde Balogun — tunde@example.com — applicant — Lagos
6. Ngozi Okwu — ngozi@example.com — applicant — Lagos
7. Ibrahim Sani — admin@kanostate.gov.ng — tenant_admin — Kano
8. Aisha Yusuf — officer@kanostate.gov.ng — officer — Kano

**Geography:** Lagos LGAs: Ikeja, Eti-Osa, Alimosho, Surulere, Badagry. Kano LGAs:
Nassarawa, Fagge, Dala, Gwale. Each LGA gets 3 wards named "{LGA} Ward 1..3".

**Applications (5):**
1. Issued (Tunde, Lagos, Ikeja, Ikeja Ward 1): full bio (Male, 1990-04-12, NIN
   12345678901, phone +234 802 111 2222, 14 Allen Avenue Ikeja, father Rasheed
   Balogun, mother Sefiat Balogun, community "Ikeja Indigenous Community"), status
   issued, submitted ~20d ago, reviewed ~18d ago by officer1, created ~21d ago.
   - 3 documents: Birth Certificate (birth_certificate, birth-certificate.pdf,
     240kb), Passport Photograph (photo, passport.jpg, 120kb), Letter of
     Attestation (attestation, attestation.pdf, 180kb).
   - 1 payment: 5000 NGN, Card, success, payer Tunde Balogun, paid ~19d ago.
   - 1 certificate: number `LAG/{currentYear}/00001`, applicant "Tunde Balogun",
     lga Ikeja, ward "Ikeja Ward 1", state "Lagos State", issued ~18d ago, valid,
     issued by officer1.
2. Paid (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 1): Female, 1995-09-30, NIN
   23456789012, +234 803 333 4444, 5 Lekki Phase 1, father Emeka Okwu, mother
   Chioma Okwu, community "Eti-Osa Community", status paid, submitted ~3d,
   created ~4d. 2 documents (Birth Certificate ngozi-birth.pdf 210kb, Passport
   ngozi-passport.jpg 110kb). 1 payment 5000 NGN Bank Transfer success payer
   Ngozi Okwu paid ~2d.
3. Draft (Tunde 2nd app, Lagos, Ikeja, Ikeja Ward 2): same bio as #1, status
   draft, created ~1d. No docs/payment.
4. Rejected (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 2): same bio as #2, status
   rejected, rejectionReason "Submitted birth certificate was illegible. Please
   re-upload a clear copy.", submitted ~12d, reviewed ~10d by officer2, created
   ~13d.
5. Paid (Kano, applicant = Tunde's user id, Nassarawa, Nassarawa Ward 1): Musa
   Abdullahi, Male, 1988-01-20, NIN 34567890123, musa@example.com, +234 805 555
   6666, 10 Zoo Road Nassarawa, father Abdullahi Sule, mother Hauwa Abdullahi,
   community "Nassarawa Community", status paid, submitted ~5d, created ~6d. 1
   payment 3500 NGN Card success payer Musa Abdullahi paid ~4d.

**Notifications (2):** (1) to Tunde, app #1, type approved, "Certificate issued",
"Your indigene certificate LAG/{year}/00001 has been issued.", unread, ~18d.
(2) to Ngozi, app #2, type payment, "Payment received", "We received your
application fee. Your application is now awaiting review.", unread, ~2d.

**Audit logs (7):** mirror the originals (Created tenant ~40d; Added officer ~35d;
Submitted application ~20d; Paid application fee "NGN 5,000 received" ~19d;
Approved application recordId `LAG/{year}/00001` outcome issued ~18d; Rejected
application "Illegible birth certificate" outcome rejected ~10d; Kano "Reviewed
queue" outcome pending ~3d). Use the correct tenant ids and actor names.

---

## 4. Frontend (Angular) — pages, routing, behavior

Use Angular 17+ standalone components, `provideHttpClient`, `provideRouter`.
A single `ApiService` wraps all HTTP calls (base URL `/api`, proxied in dev to
the backend — see frontend README). An `AuthService` manages the demo session.

### Auth (demo)
`AuthService` stores the selected account in `localStorage` key
`indigene_auth_user` as JSON `{id, name, email, role, tenantId, tenantName}`.
Expose `currentUser` (signal or BehaviorSubject), `signInAs(account)`,
`signOut()`. After sign-in, redirect by role: applicant→`/apply`,
officer→`/officer`, tenant_admin→`/admin`, super_admin→`/platform`.

### Routing (Angular Router)
Public (no shell): `/` Landing, `/signin` SignIn, `/verify` Verify.
Authenticated (wrapped in `AppShell` layout with role-based sidebar):
- applicant: `/apply` (dashboard), `/apply/new`, `/apply/:id`
- officer: `/officer`, `/officer/:id`
- tenant_admin: `/admin`, `/admin/settings`, `/admin/geography`,
  `/admin/officers`, `/admin/audit`
- super_admin: `/platform`, `/platform/tenants`
- wildcard `**` → NotFound.
A route guard should redirect unauthenticated users to `/signin`.

### AppShell
Left sidebar with role-specific nav links (labels):
- applicant: "My Applications" → /apply
- officer: "Review Queue" → /officer
- tenant_admin: "Dashboard" /admin, "Settings" /admin/settings, "Geography"
  /admin/geography, "Officers" /admin/officers, "Audit Log" /admin/audit
- super_admin: "Platform Overview" /platform, "Tenants" /platform/tenants
Header shows app name "Indigene Certificate Portal", current account name + role,
and a sign-out action. Brand color is government green (`#1f7a4d` / `hsl(142 72%
29%)`). Sans-serif font (system/Inter). The certificate template uses a serif
(Georgia) for a formal look.

### Pages (16) — purpose, API calls, forms
1. **Landing** (`/`): hero, value prop, CTAs "Start Application" (→/signin or
   /apply) and "Verify a Certificate" (→/verify); link to sign in. No API.
2. **SignIn** (`/signin`): calls `GET /api/accounts`, lists demo accounts grouped
   by role; clicking one calls `signInAs` and redirects by role.
3. **Verify** (`/verify`): single input for certificate number; on submit calls
   `GET /api/verify/{encodeURIComponent(number)}`; shows a result card (valid /
   revoked / not found) with holder name, tenant/state, LGA, issue date when
   found. Public.
4. **ApplyDashboard** (`/apply`): `GET /api/applications?applicantId={userId}`;
   grid of cards (state/tenant, LGA, status badge, created date); "New
   Application" button → /apply/new.
5. **ApplyNew** (`/apply/new`): multi-step wizard. Step 1 bio (firstName,
   lastName, middleName, gender, dateOfBirth, nin, email, phone,
   residentialAddress). Step 2 origin (tenantId=state via `GET /api/tenants`,
   lgaId via `GET /api/tenants/{id}/lgas`, wardId from chosen LGA's wards,
   community, fatherName, motherName). Step 3 review + submit → `POST
   /api/applications` (applicantId = current user, status draft). Redirect to
   /apply/:id after create.
6. **ApplyDetail** (`/apply/:id`): `GET /api/applications/{id}`. Tabs Details /
   Documents; status timeline sidebar. Actions depending on status:
   - draft: edit details via `PATCH`, add documents via `POST .../documents`,
     submit via `PATCH {status:"awaiting_payment"}`.
   - awaiting_payment: pay via `POST .../pay {payerName, method}`.
   - issued: show certificate view with QR (encode the absolute verify URL or the
     `verificationUrl`) and a print/download action.
7. **OfficerDashboard** (`/officer`): review queue table. `GET
   /api/applications?tenantId={officer.tenantId}` plus client/server filters by
   status and lgaId (`GET /api/tenants/{id}/lgas` for the LGA filter) and a
   search box (passes `search`). Columns: applicant, NIN, LGA, status, submitted
   date; row → /officer/:id.
8. **OfficerDetail** (`/officer/:id`): `GET /api/applications/{id}`; show
   applicant profile + claim of origin + document list. Approve via `POST
   .../approve {officerId}` (officerId = current user id). Reject via `POST
   .../reject {officerId, reason}` (reason from a textarea). If issued, show the
   certificate and a revoke action (`POST /api/certificates/{certId}/revoke
   {reason}`).
9. **AdminDashboard** (`/admin`): `GET /api/tenants/{tenantId}/dashboard`. 4 KPI
   cards (total apps, pending review, issued certs, revenue), a status breakdown
   chart (pie/donut), an LGA volume chart (bars), monthly trend, recent activity
   list. Use a lightweight chart approach (CSS bars or a small chart lib —
   ng2-charts/Chart.js acceptable).
10. **AdminGeography** (`/admin/geography`): `GET /api/tenants/{id}/lgas`;
    accordion of LGAs with nested wards. Add LGA (`POST /api/tenants/{id}/lgas
    {name}`), add ward (`POST /api/lgas/{lgaId}/wards {name}`).
11. **AdminOfficers** (`/admin/officers`): `GET /api/tenants/{id}/officers`; table
    of staff with role + reviewedCount. Create staff (`POST
    /api/tenants/{id}/officers {name, email, role}` role officer|tenant_admin).
12. **AdminSettings** (`/admin/settings`): `GET /api/tenants/{id}`; form for name,
    capital, tagline, certificatePrefix, fee, contactEmail, contactPhone,
    address; save via `PATCH /api/tenants/{id}`.
13. **AdminAudit** (`/admin/audit`): `GET /api/audit-logs?tenantId={id}`; table of
    timestamp, actor (+role), action, outcome, detail.
14. **PlatformDashboard** (`/platform`): `GET /api/platform/overview`; 4 KPI cards
    (tenants, applications, certificates, revenue) + a per-tenant comparison bar
    chart + recent activity.
15. **PlatformTenants** (`/platform/tenants`): `GET /api/tenants`; table of states
    with status; suspend/activate toggle via `PATCH /api/tenants/{id}
    {status}`. New tenant via `POST /api/tenants {name, code, certificatePrefix,
    fee}`.
16. **NotFound** (`**`): simple "Page Not Found" card with a link home.

### Visual style
Government, trustworthy, clean. Primary green `#1f7a4d`. Light gray app background
(`#f8fafc`), white cards with subtle border/shadow, rounded corners. Status
badges color-coded (draft gray, awaiting_payment amber, paid blue, under_review
indigo, issued/valid green, rejected red, revoked red/strikethrough). No emojis.
Certificate template: serif font, formal border, state name + tagline header,
holder details, certificate number, issue date, QR code (use a QR library such as
`angularx-qrcode`). Keep components small and split into files; use a global
styles.css design system (custom CSS or Angular Material — custom CSS preferred
for portability).

---

## 5. Cross-cutting requirements
- Backend enables CORS for the Angular dev origin (e.g. http://localhost:4200).
- Connection string in `appsettings.json` (`DefaultConnection`) targeting SQL
  Server / LocalDB; document how to change it.
- Provide a way to create + seed the DB: (a) raw T-SQL scripts in `database/` for
  SSMS, AND (b) optionally an EF seeder that runs on startup if the DB is empty.
  Both must produce identical data.
- Everything must compile with `dotnet build` and `ng build` on the user's
  machine. It will NOT be run/tested on Replit.
