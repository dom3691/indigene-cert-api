---
name: Application state-machine transition guards
description: How/why application status transitions are enforced server-side, and the revoke→re-approve reactivation policy.
---

# Application state-machine guards

Server-side transition guards live in `artifacts/api-server/src/routes/applications.ts`.

Status flow: `draft → awaiting_payment → paid → (under_review) → issued / rejected`, plus `issued → revoked` (via certificate revoke) and `revoked → issued` (re-approval).

Enforced rules:
- **PATCH /applications/:id** — self-service endpoint. Validates `status` against the known enum; only allows `draft → awaiting_payment` (submit) or a no-op status. Applicant detail fields may only be edited while status is `draft`. Officer-driven transitions go through dedicated endpoints, not PATCH.
- **POST /pay** — requires status `awaiting_payment` (blocks re-pay / paying a draft). Note: body (`payerName`) is validated *before* the status check, so a bad body returns 400 not 409.
- **POST /approve** — requires status in `{paid, under_review, revoked}`; officer must exist, belong to the app's tenant, and have role `officer` (else 403). The status check runs *before* the officer check.
- **POST /reject** — requires status in `{paid, under_review}` plus the same officer-tenant-role check.

**Revoke → re-approve policy (Why):** revoking a certificate sets the application status to `revoked`. To make reconsideration reachable (and since PATCH forbids arbitrary transitions), `approve` accepts `revoked` as a valid prior state. On re-approval, if a certificate already exists but is non-`valid`, it is reactivated in place (status→`valid`, `revokedReason` cleared) — the original certificate number is preserved rather than minting a new one.

**How to apply:** any new status-changing endpoint must guard its allowed prior states explicitly; do not rely on PATCH for transitions. Certificate schema has `revokedReason` only (no `revokedAt`).
