# Dayflow HRMS — Audit Remediation Log

**Audit baseline:** `docs/BRUTAL_AUDIT_2026-08-22.md`  
**Implementation backlog:** `docs/IMPLEMENTATION_BACKLOG_2026-08-22.md`  
**Remediation branch:** `feat/shivam-audit-remediation`  
**Commit author for this slice:** Shivam_Gawade `<24ec25@aitdgoa.edu.in>`

## Completed in this remediation slice

| Finding | Remediation | Evidence | Commit |
| --- | --- | --- | --- |
| Caller-supplied profile IDs silently fell back to a default employee | Centralized profile lookup now raises `404 Profile not found`; employee-scoped reads validate the requested profile before returning data | `qa/test_dayflow.py`, `qa/test_dayflow_http.py` | `1e480a4` / `75b5de6` |
| Attendance had no server-backed check-out transition | Added check-out endpoint, conflict when no check-in exists, idempotent repeated check-out, and UTC worked-minute calculation | `test_check_out_calculates_worked_minutes`, HTTP idempotency test | `1e480a4` / `75b5de6` |
| Leave dates could overlap and review transitions were permissive | Added overlap conflict for pending/approved requests, required rejection comments, and blocked review of non-pending requests | Leave unit and HTTP regression tests | `1e480a4` / `75b5de6` |
| RLS allowed a broad profile self-update policy | Replaced it with safe employee and HR policies, added a security-definer trigger for role/employee-code/email changes, and split attendance update policies | Migration guard asserts the broad policy is absent | `4c9a5d6` |
| Header identity and active navigation were hardcoded or contradictory | Shared shell now follows the selected employee/HR demo context, persists the selection locally, and derives active navigation from the current hash | Frontend typecheck and Vite build | `8155e17` |
| Audit findings had no durable implementation order | Published evidence-backed backlog and this commit-to-finding log | Repository documentation | `28964a5` |
| Hosted Python 3.14 migration could not resolve the inherited User/Item forward reference | Made both SQLModel relationship sides explicit and revalidated mapper configuration locally | `check_dayflow_models.py` plus backend QA | `7f90037` |

## Validation evidence

The isolated suite currently reports **24 passed** tests. Backend compilation passes with `python3 -m compileall -q backend/app`. The frontend production build passes with `bun run --filter frontend build`, including TypeScript compilation and Vite bundling. `git diff --check` is clean.

The HTTP tests use a minimal FastAPI application that includes the real Dayflow router. This deliberately avoids requiring optional Sentry or production database configuration during isolated QA, while still exercising serialization, validation, status codes, and route behavior over HTTP. The TestClient emits one upstream Starlette/httpx deprecation warning; it is not a Dayflow assertion failure and should be resolved during dependency maintenance.

## Still open and not overstated

The main dashboard still uses local React state for core data and is not yet wired to Supabase or the Dayflow FastAPI service. The backend demo records remain process-memory state, so they are not durable across process restarts. Query-string role/profile values remain a demo adapter contract rather than verified authentication; production authorization must derive actor identity from a validated session/JWT and must not trust those parameters.

Payroll values, Flow action execution, realtime subscriptions, and append-only activity persistence remain incomplete. The Supabase migration has been corrected in source control but has **not** been claimed as applied to a live project. The inherited upstream CI workflows still need separate cleanup; this log does not claim all GitHub Actions checks are green.

## Next recommended slice

Build one typed Dayflow client and persistence adapter behind an explicit `DAYFLOW_DEMO_MODE` boundary. Wire the employee check-in, leave request, HR approval, and activity refresh flows to that adapter with loading/error states. Only after that contract is stable should the implementation replace the adapter with Supabase calls and verified auth context.
