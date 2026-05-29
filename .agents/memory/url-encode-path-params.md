---
name: slash-bearing path params
description: Encode identifiers containing slashes before placing them in URL path segments
---

# Slash-bearing path params

Identifiers that contain `/` (e.g. certificate numbers like `LAG/2026/00001`) break when interpolated raw into a URL path segment such as `/api/verify/:certificateNumber` — the slashes are read as extra path segments and the route either 404s or only captures the first chunk.

**Why:** Orval/codegen-generated clients interpolate params raw (`/api/verify/${certificateNumber}`) with no encoding. Express's `:param` only captures one segment.

**How to apply:** `encodeURIComponent(value)` before passing such a value to a generated hook/path builder (so `/` → `%2F`). The server-side Express param decodes it back. Verified end-to-end through the shared proxy. Alternatively, design the contract to take the identifier as a query parameter instead of a path segment.
