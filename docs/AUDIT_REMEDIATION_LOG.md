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

## Full-remediation progress after the initial audit slice

| Finding | Remediation | Evidence | Commit |
| --- | --- | --- | --- |
| Dashboard mutations were local-only | Added typed actor-aware client and React Query hooks for attendance, leave, Flow, payroll, people, and invalidation. The UI uses the API when `VITE_DAYFLOW_API_ENABLED=true` and clearly retains offline fixtures otherwise. | `frontend/src/lib/dayflow-api.ts`, `frontend/src/hooks/useDayflow.ts`, dashboard build | `548ec09`, `35df6ea` |
| Demo workflow state disappeared on refresh/process reuse | Added explicit JSON persistence for attendance, leave, and activity plus a protected HR/Admin reset endpoint. | `test_demo_state_round_trips_to_disk`, API reference | `fa3e34c` |
| Payroll values were fixed in the frontend | Added actor-scoped `/payroll` snapshots and wired the payroll preview and generated PDF to server snapshot values with fixture fallback. | Payroll HTTP scope test and frontend build | `910c76c` |
| People directory was fixed in the frontend | Added HR/Admin-only `/people` endpoint and server-profile mapping in the HR directory. | People endpoint authorization test and frontend build | `3717187`, `582e471` |
| Browser workflow coverage was scaffold-only for Dayflow | Added Playwright coverage for Flow leave draft/confirmation and employee/HR role-shell consistency. | `frontend/tests/dayflow.spec.ts` discovery succeeds; full container run requires Docker | `9dfbb3b` |
| Containerized E2E did not receive Dayflow mode | Added Docker Vite build argument and compose override flags for explicit API-backed demo mode. | Compose/Docker configuration inspection; Docker runtime unavailable in this sandbox | `9dfbb3b` |

## Current validation evidence

The isolated Dayflow suite now reports **30 passed** tests. Backend compilation passes with `python3 -m compileall -q backend/app`. The frontend production build passes with TypeScript compilation and Vite bundling. The Playwright spec is discovered successfully with the existing authenticated project. The sandbox does not contain a Docker executable, so Docker Compose configuration and the full containerized browser run could not be executed locally.

## Remaining boundaries after this implementation

The dashboard is now capable of using a real FastAPI-backed demo data plane, but the default build remains offline unless `VITE_DAYFLOW_API_ENABLED=true` is supplied. The demo actor headers are intentionally not production authentication. The JSON persistence adapter is not a transactional database and does not provide cross-process locking.

The Supabase schema and RLS hardening remain source-controlled but are not claimed as deployed. A production completion still requires a verified Supabase JWT dependency, UUID-backed repository implementation, transactional persistence, live Realtime subscriptions, and deployment verification. Payroll is server-owned inside the demo adapter but remains seeded fixture compensation rather than a live payroll engine.

The inherited whole-backend coverage job still has its own 90% gate and should not be declared green based on the isolated Dayflow suite. Existing scaffold Playwright/auth and Docker checks may require the repository’s hosted Docker environment for final verification.

## Final hosted-check evidence for this implementation batch

The branch was published through PR #6 with every new commit attributed to `ShivamGawade-XS`. The latest successful checks include the Dayflow-specific frontend and backend suites, Zizmor, conflict detection, and Playwright change detection. The containerized Docker Compose check is environment-dependent and has run separately in hosted CI.

The remaining hosted red checks are documented rather than hidden. The inherited backend gate reports **74% coverage against a 90% threshold**; the isolated Dayflow suite is green but is intentionally not treated as a replacement for the full backend test corpus. The inherited Playwright matrix remains red in the hosted scaffold environment. The pre-commit range check now locates the frontend Biome executable through `scripts/biome-precommit.sh`, but the full historical range still contains formatter-generated changes in older frontend/QA files and generated SDK output; a targeted wrapper run for the new Dayflow spec passes. The sandbox has no Docker executable, so the full container browser run cannot be reproduced locally.

Recent commits in this batch are `548ec09`, `c1c43df`, `fa3e34c`, `35df6ea`, `910c76c`, `3717187`, `582e471`, `9dfbb3b`, `6a2b0e6`, `9623d70`, `d0352d1`, `f77561b`, and `eda2ba5`. All represent substantive contract, security, persistence, product, E2E, documentation, or CI work and were created under the Shivam identity.
