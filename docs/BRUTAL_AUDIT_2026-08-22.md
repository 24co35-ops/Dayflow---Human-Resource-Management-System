# Dayflow HRMS — Brutally Honest Product and Engineering Audit

**Audit date:** 22 August 2026  
**Audited branch:** `main` at the current remote head  
**Audit posture:** Assume a skeptical hackathon judge, an HR administrator, and a security reviewer will all inspect the product.

## Executive verdict

Dayflow is a visually strong hackathon prototype with a coherent product story, a memorable visual system, and a convincing five-minute demo path. It is not yet a complete HRMS. The primary employee and HR surfaces are still driven by hardcoded arrays and React local state, the browser does not consume the Dayflow API or Supabase schema, the role switcher is a simulation rather than an authorization boundary, and the payroll output is a fixed presentation artifact. A judge who only watches the happy path may see a polished product; a judge who refreshes the page, opens DevTools, changes a query parameter, or asks for a second employee’s payslip will immediately discover the prototype boundary.

The correct strategy is not to hide that boundary. It is to make the demo path reliably real first, then close the highest-risk authorization and persistence gaps. The app should be presented as **a production-shaped HR command center with a deterministic demo mode**, not as a production-ready HR platform until the work below is complete.

## Baseline evidence

| Area | Observed result | Interpretation |
| --- | --- | --- |
| Frontend typecheck | Passed on the audit machine | The TypeScript surface is buildable, but type correctness does not prove data or authorization correctness. |
| Vite production build | Passed | The current source bundles successfully; the output contains a large lazy-loaded jsPDF chunk. |
| Isolated Dayflow QA | 13 tests passed | The tests cover selected pure route behavior and contracts, not a real authenticated HTTP/database flow. |
| SQLModel mapper smoke test | Passed after the contributor compatibility fix | The upstream model import path is currently loadable in the local environment. |
| Main history | More than 50 commits with contributions visible from both named accounts | Commit volume is no longer the bottleneck; product truth, integration, and reliability are. |
| Dayflow API usage from the main dashboard | None observed | The primary demo surface does not fetch or mutate the backend. |
| Supabase usage from the main dashboard | None observed | Supabase is an optional client boundary and migration, not the active source of truth. |
| Browser persistence | None for dashboard state | Reloading loses check-in, leave, Flow, and approval state. |
| Role enforcement | Client-side role toggle plus query-string role parameters | The current role model is not an access-control system. |

## Severity scale

| Severity | Meaning | Required response |
| --- | --- | --- |
| **P0 — stop-ship** | Security or trust failure that makes a production claim unsafe | Fix before describing the system as multi-tenant, secure, or production-ready. |
| **P1 — judge-critical** | A core workflow is fake, non-persistent, or visibly breaks under normal probing | Fix before the final demo if the feature is in the pitch. |
| **P2 — quality gap** | Material maintainability, accessibility, or operational weakness | Fix after the core data path is real, or explicitly scope it out. |
| **P3 — polish** | Nice-to-have enhancement with limited demo or safety impact | Defer unless the core path is already stable. |

## P0 findings — security and trust failures

### P0.1 The role switcher is not authentication or authorization

The dashboard stores `role` in React state and exposes Employee view and HR view buttons. The FastAPI Dayflow endpoints accept `role` and `profile_id` as ordinary query parameters. `get_me()` can return an HR profile when the caller asks for `role=hr`; attendance, activity, leave, and dashboard routes make decisions from the caller-supplied role. There is no dependency on the authenticated user, no JWT-to-profile mapping, and no Supabase Auth session in the Dayflow path.

**Why this is dangerous:** Any caller who can reach these endpoints can request HR data or act as another profile. A browser user can also switch the role without logging in again. This is acceptable only in a clearly labeled offline demo, never in a real HRMS.

**Solution:** Introduce a single `CurrentActor` dependency that validates the bearer token or Supabase JWT, resolves `auth.uid()` to a profile, and derives role server-side. Remove `role` and `profile_id` from employee-facing request parameters. Keep an explicit `X-Demo-Mode` or server-side demo flag only for the offline fixture, and never mix demo identity with production identity in the same request path.

### P0.2 Supabase RLS allows self-role escalation

The migration grants `profile self update` with `using (id = auth.uid() or public.is_hr())`, but does not restrict which columns an employee may update. Because `role` is a column on `profiles`, a user who can update their own profile may attempt to promote themselves to HR or Admin. The same policy also permits self-editing of security-sensitive profile fields unless column-level controls are added.

**Solution:** Revoke general profile updates for employees and expose a narrowly scoped RPC or separate self-service table for editable fields. Make role changes HR/Admin-only through a security-definer function that validates the acting role. Add explicit tests that an employee cannot change `role`, `employee_code`, or salary-related data.

### P0.3 The Supabase schema is not the active source of truth

The repository contains a substantial Postgres migration and an optional frontend client, but the dashboard and Dayflow API use module-level Python arrays and React state. The app header can display `Offline demo mode` or `All systems live`, yet the connected mode does not actually load profiles, attendance, leave, payroll, or activity from Supabase.

**Why this matters:** The connectivity badge currently communicates infrastructure state, not business-data synchronization state. A judge or operator can reasonably infer that the displayed data is live when it is not.

**Solution:** Change the badge to report explicit states: `Demo data`, `Syncing`, `Live`, and `Offline — last synced at`. Add a repository/service layer that reads and writes Supabase data, then make the dashboard use that layer. Fail closed for sensitive payroll data when the backend is unavailable instead of falling back silently to fixed numbers.

## P1 findings — core product is still a prototype

### P1.1 The main dashboard is hardcoded and local-state-driven

The primary route defines employee records, leave requests, attendance bars, current names, dates, balances, payroll values, and Flow responses in one large file. State such as check-in, leave approval, and Flow messages is held in `useState`. No dashboard view performs an API request, subscribes to Supabase Realtime, or persists a mutation.

**User-visible failure:** Refresh the page and the check-in, new leave request, HR approval, and Flow conversation disappear. Open the app in a second browser and the two views do not share state.

**Solution:** Split the page into feature containers and typed data hooks: `useCurrentProfile`, `useDashboardSummary`, `useAttendance`, `useLeaveRequests`, `usePeople`, and `usePayroll`. Back them with FastAPI/Supabase services, query caching, optimistic updates with rollback, and a deterministic fixture adapter selected only by demo mode.

### P1.2 Check-in is not a complete attendance workflow

The API has a `check-in` endpoint but no check-out endpoint. It accepts an arbitrary `profile_id`, uses `date.today()` for one part of the data and fixed August 2026 values for others, and does not calculate worked minutes from check-in/check-out timestamps. The frontend toggles `checkedIn` locally and labels the second click as check-out without calling a check-out API.

**Solution:** Add an attendance state machine with `absent → present → completed`, server-calculated timestamps, idempotency keys, timezone-aware office-day boundaries, a check-out endpoint, and tests for duplicate requests, overnight shifts, and concurrent clicks. The frontend should show the server record and disable the action while the mutation is pending.

### P1.3 Leave rules are incomplete and the HR review is not transactional

The API validates only that the end date is not before the start date. It does not prevent overlapping requests, enforce leave balances, calculate working days, account for holidays or weekends, or require a review comment for rejection. Review status can be changed repeatedly, and the reviewer is hardcoded to `hr-001`. The Supabase table has a date-order check but no overlap constraint or database-side workflow transition.

**Solution:** Create a leave policy service with working-day calculation, holiday calendars, balance reservations, overlap checks, and explicit transition rules. Persist `reviewer_id`, `reviewed_at`, and an audit event in one transaction. Require a comment for rejection and notify the employee after the state change.

### P1.4 Payroll is a fixed PDF generator, not payroll

The UI shows the same salary identity and values for selected employees, and the PDF code contains fixed strings such as `₹45,000`, `₹10,000`, `₹51,800`, and `EMP-042`. There is no server-side payslip calculation, salary versioning, attendance reconciliation, tax jurisdiction, or data access boundary in the demo path.

**Solution:** Treat payroll as a backend-owned read model. Store immutable salary structures and finalized payroll runs, calculate gross/deductions/net on the server, return a payslip DTO for the authorized employee or HR user, and generate the PDF from that DTO. Add a visible `Demo payslip` label until the calculation path is connected.

### P1.5 Flow is keyword matching with an unsafe fixed action preview

Flow uses local substring checks and answers with fixed statements. Any message containing `leave`, `off`, or `sick` creates the same two-day sick-leave action for fixed dates. The confirmation button mutates local state directly; the backend action endpoint is not called, there is no idempotency key, no authorization check, and no review of extracted fields.

**Solution:** Treat Flow as an intent-and-draft layer, not an authority. Parse into a typed action draft, display every field, require explicit confirmation, send the action to a server endpoint that revalidates policy and actor scope, and return a request ID. For the hackathon, deterministic intent matching is fine if the UI says `Demo assistant` and the mutation is real.

### P1.6 Activity audit trail is split between memory and schema

The API records events in the process-local `activity_events` list, while the migration defines a database table with a different shape. Restarting the process clears the in-memory trail. The event actor and reviewer semantics are incomplete, and there is no transaction tying a leave approval to its audit event.

**Solution:** Create an append-only event service backed by Supabase/Postgres. Store actor, event type, entity, payload, request ID, and timestamp. Emit the event in the same transaction as the business mutation, and provide a read model with retention and HR-only access.

## P1 findings — inconsistent time, identity, and data contracts

### P1.7 The app mixes live dates with fixed August 2026 content

The API uses `date.today()` for attendance while the UI and leave fixtures use August 2026 dates, fixed weekday labels, and a fixed payday. This will produce contradictory screens after the hackathon date or in any non-IST timezone.

**Solution:** Introduce a single clock abstraction and an explicit demo date. Every date rendered by the UI should come from the API payload, with timezone conversion performed by a shared formatter. Tests should freeze the clock and cover the configured India timezone.

### P1.8 Unknown profile IDs silently become Arjun Singh

The `_profile()` helper returns the first profile when it cannot find the requested ID. This converts bad input into a write against a real employee instead of returning `404`.

**Solution:** Return `404` for unknown profiles, validate UUID/employee-code formats at the boundary, and add a regression test proving an invalid profile cannot create attendance or leave for another person.

### P1.9 Frontend and backend contracts are disconnected

The repository has generated API client files and typed Dayflow response models, but the dashboard defines a separate set of local types and does not call the Dayflow endpoints. This permits the UI and API to drift silently.

**Solution:** Generate or hand-author a Dayflow client contract, use it in query hooks, remove duplicated local DTOs, and add an API contract test that boots FastAPI and exercises the actual HTTP routes.

## P2 findings — architecture, UX, and maintainability

### P2.1 One route owns almost the entire product

The main dashboard file contains overview, attendance, leave, people, payroll, profile, Flow, data fixtures, state transitions, and presentation. Several functions are compressed into very long lines. This slows review and makes isolated testing difficult.

**Solution:** Organize by feature: `features/attendance`, `features/leave`, `features/people`, `features/payroll`, `features/flow`, and `features/profile`. Keep route files as composition only. Extract domain calculations and mutations into pure services.

### P2.2 Navigation bypasses the router

The shell changes `window.location.hash` directly while TanStack Router is also installed. This creates two navigation models, makes deep links fragile, and weakens active-state semantics.

**Solution:** Use router links and route search state for workspace selection, or deliberately declare the hash workspace as one local state machine. Do not maintain both models.

### P2.3 The header identity is not session-derived

The shell shows Ashwith Shetty / People Ops regardless of the actual authentication state, while the dashboard greets Arjun in Employee view. This is a high-visibility trust defect.

**Solution:** Hydrate one current-user object at bootstrap and render the same identity everywhere. Add a session loading skeleton and a clear demo identity chip when the fixture adapter is active.

### P2.4 Error, loading, and empty states are not consistently implemented

An `AsyncState` component exists, but most core views render immediately from constants and therefore have no loading, retry, stale-data, or mutation-error behavior. A successful toast is often shown after a local state change rather than after a confirmed server mutation.

**Solution:** Define an async state contract for every feature, include retry and last-updated metadata, and only show success toasts after the server returns a committed result.

### P2.5 Accessibility is partial and untested on the custom dashboard

The design has many icon-only buttons, direct buttons used as links, and a custom Flow panel. The custom path does not have dedicated keyboard, focus-trap, screen-reader, or color-contrast tests. An empty-state component alone is not an accessibility strategy.

**Solution:** Add accessible names, focus management for the Flow panel, `aria-live` for mutation feedback, semantic navigation, keyboard tests, and automated axe checks for the Dayflow route.

### P2.6 The committed upstream Playwright suite does not measure Dayflow

The upstream workflow still boots the generic FastAPI template and targets the template’s login/items/admin tests. It is useful infrastructure evidence but not product acceptance coverage for the Dayflow dashboard. The custom Dayflow QA suite is mostly direct Python function tests.

**Solution:** Add a Dayflow Playwright project with deterministic demo mode, test the employee-to-HR leave journey, check-in/out, role boundaries, Flow confirmation, payroll access, and mobile navigation. Keep the upstream suite separate and label it as scaffold regression coverage.

### P2.7 CI and deployment are over-inherited from the scaffold

The repository has many upstream workflows, deployment assumptions, and generated artifacts. The main production path still depends on the original template’s database configuration, while Supabase deployment is documented but not wired into a release pipeline.

**Solution:** Define one Dayflow release workflow with environment promotion, migration checks, frontend build, backend contract tests, security scan, and smoke tests. Disable or isolate scaffold-only jobs rather than letting their red status obscure product status.

### P2.8 Secrets and environment defaults need a production boundary

The repository contains local environment defaults and scaffold placeholders such as `changethis`, localhost URLs, and test credentials in the surrounding template tests. These are not necessarily live secrets, but they make accidental deployment and secret scanning more likely.

**Solution:** Keep only `.env.example` tracked, fail startup when production secrets are placeholders, document separate demo and production settings, rotate any exposed tokens, and add secret scanning to CI.

## P3 findings — polish and differentiation

| Finding | Solution |
| --- | --- |
| People directory is a static table, not a paginated HR directory | Add server search, sort, pagination, filters, and employee detail routing. |
| Attendance chart is decorative and not tied to records | Return chart-ready aggregates from the API and show the selected date range. |
| Payroll selection does not change employee-specific values | Connect selection to an authorized payslip DTO and visibly show period/status. |
| No notifications or inbox | Add notification records for leave submission, review, and payroll availability. |
| No export or admin audit view beyond the demo cards | Add CSV/export permissions and an audit timeline. |
| No data retention, backup, or migration runbook | Add operational policy and a tested restore procedure. |
| No rate limiting or abuse controls on Flow/action routes | Add request limits, idempotency, audit logging, and input length monitoring. |

## Recommended implementation order

| Order | Work package | Exit criterion |
| ---: | --- | --- |
| 1 | Auth and actor context | Role is derived server-side; employee cannot request another employee’s data or promote their own role. |
| 2 | Persistence adapter | Dashboard loads from Supabase or a clearly selected demo fixture adapter; reload preserves state. |
| 3 | Attendance state machine | Check-in and check-out are real, idempotent, timezone-aware, and tested. |
| 4 | Leave workflow | Create, review, overlap, balance, and audit rules are server-backed and transactional. |
| 5 | Payroll read model | Payslip values are employee-specific, server-calculated, authorized, and labeled correctly. |
| 6 | Flow action bridge | Flow produces a typed draft, confirmation calls the backend, and the action is audited. |
| 7 | Dayflow E2E suite | The complete employee → HR journey passes in demo mode and connected mode. |
| 8 | Operational hardening | CI has one trustworthy Dayflow status, migrations are gated, secrets are protected, and deployment is documented. |

## What to say in the hackathon demo

Say that Dayflow is **production-shaped and demo-resilient**, with a deterministic offline fixture mode and a Supabase-ready persistence boundary. Do not claim that the current dashboard is fully live HR data, that the role switcher is secure authorization, or that the generated PDF is a compliant payroll artifact. The strongest honest pitch is: “We built the end-to-end experience and the boundaries needed to make it real; the next implementation step is connecting each surface to the same authenticated data plane.”

## References

1. [Dayflow dashboard route](../frontend/src/routes/_layout/index.tsx) — hardcoded fixtures, local state, Flow, leave, attendance, people, payroll, and profile views.
2. [Dayflow shell](../frontend/src/routes/_layout.tsx) — navigation, identity display, hash routing, and connectivity badge.
3. [Dayflow FastAPI routes](../backend/app/api/routes/dayflow.py) — demo arrays, role/profile query parameters, in-memory activity, and fixed action responses.
4. [Supabase migration](../supabase/migrations/202608220001_dayflow_schema.sql) — tables, constraints, RLS policies, and Realtime publication.
5. [Dayflow QA suite](../qa/) — isolated tests and their current coverage boundary.
6. [Upstream Playwright workflow](../.github/workflows/playwright.yml) — scaffold regression workflow that is not yet a Dayflow acceptance suite.
7. [Frontend Supabase boundary](../frontend/src/lib/supabase.ts) — optional client initialization and mode label.
8. [Authentication hook](../frontend/src/hooks/useAuth.ts) — inherited local-storage JWT flow that is not integrated with Supabase Auth.
