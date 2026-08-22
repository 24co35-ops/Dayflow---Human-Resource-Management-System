# Dayflow Frontend Flaw Audit

## Scope

This audit covers the current React/Tailwind frontend and its integration boundary with the Dayflow API. It separates defects that were fixed in this pass from limitations that still need product or infrastructure work. The app is intentionally a hackathon-grade API-aware demo, not yet a production multi-tenant SaaS platform.

## Fixed in this pass

| Finding | Impact | Status |
|---|---|---|
| The shared logo component rendered FastAPI assets and used FastAPI alt text. | The product looked like the scaffold rather than Dayflow and weakened brand credibility. | Fixed with a custom Dayflow inline mark and wordmark. |
| The browser favicon still pointed to the inherited FastAPI PNG. | Browser tabs showed the wrong product identity. | Fixed with `frontend/public/dayflow-mark.svg`. |
| Secondary route titles referenced FastAPI Template. | Login, signup, password, admin, items, and settings pages were visibly unbranded. | Fixed with Dayflow HRMS titles. |
| Footer linked to FastAPI’s GitHub, X, and LinkedIn accounts. | Users could be sent to unrelated external accounts. | Fixed with a truthful Dayflow repository link. |
| Fallback activity labels such as `Today · 10:15 AM` were parsed as dates because they contained the letter `T`. | The dashboard rendered `Invalid Date`. | Fixed with strict ISO timestamp detection and invalid-date fallback. |
| Overview had a large amount of stale, disconnected content and no coherent SaaS command-center hierarchy. | The app felt like a collection of demo cards rather than a product workspace. | Replaced with a modular SaaS overview containing workspace health, quick actions, approval queue, activity stream, and responsive hero. |
| Search and notification affordances were missing or inert. | Users had no fast navigation or update center. | Fixed with a keyboard-accessible command palette and notification center. |
| Several dashboard KPI values were hardcoded despite API data being available. | The UI could mislead users about current attendance and leave state. | Partially fixed with API-aware people, presence, approval, leave, and sync signals. |

## Remaining frontend flaws

| Finding | Impact | Recommended next step |
|---|---|---|
| The dashboard still contains intentional fallback fixtures for streaks, payday, notification content, attendance bars, and some profile values. | Offline mode is useful for demos but cannot be treated as authoritative business data. | Replace each fixture with an explicit typed API field or a clearly labeled empty state. |
| The command palette navigates workspaces but does not search employees, leave requests, or activity records. | Search is a navigation shortcut, not yet a true global search. | Add server-side search endpoints with tenant-scoped filtering. |
| The notification center is presentation-only. | It does not persist read state, notification history, or delivery preferences. | Add durable notification records, unread counts, read mutations, and email/push delivery. |
| The People and Payroll surfaces still use a static employee list when API data is unavailable. | Demo data can diverge from the real organization. | Use an explicit loading/empty/error state and only allow fallback fixtures in an opt-in demo mode. |
| The existing dashboard route remains dense and combines state, orchestration, and many feature components in one file. | Changes are harder to review and regression risk is higher. | Split Overview, Attendance, Leave, People, Payroll, and Profile into feature modules with shared hooks. |
| The displayed date and several August 2026 labels are fixed demo copy. | The interface becomes stale outside the judging scenario. | Format dates from the user’s timezone and active payroll period. |
| Salary access and salary configuration are not a complete policy system. | Role visibility is improved but not equivalent to production authorization. | Enforce salary scopes on the server and provide an audited configuration workflow for HR/Admin. |
| Certificate selection stores metadata only. | No file bytes, download URL, storage reference, malware scan, or access revocation exists. | Upload to object storage, persist a file key, generate authorized URLs, and scan uploads. |
| The responsive shell has not been validated across a full device matrix. | Edge widths may still produce cramped navigation or long card layouts. | Add stable Playwright viewport coverage for mobile, tablet, and desktop. |
| TanStack Router and Query devtools are visible in local development. | They should not be shipped or exposed in a production build. | Verify build-time gating and ensure devtools are disabled in production. |

## Remaining platform and SaaS flaws

| Finding | Impact | Recommended next step |
|---|---|---|
| Demo actor headers are not production authentication. | A real deployment must not authorize users from client-controlled demo identity. | Resolve the Supabase/JWT subject server-side and derive role/profile from verified claims. |
| JSON demo persistence is not transactional or horizontally scalable. | Multiple instances can lose updates or race on state. | Move profiles, attendance, leave, payroll, and activity to Supabase/Postgres with migrations and RLS. |
| Tenant isolation is not implemented as a first-class boundary. | Organizations cannot safely share one deployment without cross-tenant risk. | Add organization IDs to every business table, enforce RLS, and scope every API query. |
| Realtime behavior is an intention rather than a verified production subscription. | Dashboards do not reliably receive cross-user updates. | Add Supabase Realtime channels and test reconnect, authorization, and stale-state recovery. |
| Vercel hosts the frontend snapshot only. | FastAPI APIs, persistence, secrets, and background jobs are not hosted by that frontend deployment. | Deploy the backend separately, configure CORS/secrets, and point `VITE_API_URL` at the verified service. |
| Vercel is connected to a private mirror rather than the authoritative `24co35-ops` repository. | Future pushes to the authoritative branch do not automatically redeploy the latest code. | Grant the Vercel GitHub integration access to `24co35-ops` and reconnect the project. |
| Billing, plans, quotas, invite onboarding, audit exports, and support tooling are absent. | The app is SaaS-styled but lacks the commercial operating layer of a SaaS product. | Add organization onboarding, plan entitlements, billing provider integration, usage metering, and admin audit controls. |

## Validation evidence

The current pass was checked with the frontend production build, the existing 41-test backend QA suite, backend compilation, dependency lockfile checks, `git diff --check`, and browser smoke checks for the new logo, dashboard overview, command palette, notifications, connectivity labeling, and activity timestamps.
