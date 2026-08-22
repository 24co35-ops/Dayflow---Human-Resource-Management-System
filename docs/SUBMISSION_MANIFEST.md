# Dayflow — Submission Manifest

## Repository

**Remote:** [24co35-ops/Dayflow---Human-Resource-Management-System](https://github.com/24co35-ops/Dayflow---Human-Resource-Management-System)  
**Default branch:** `main`  
**Working tree:** clean at the time of packaging.

## What the evaluator should open

Start at the frontend root route `/`. The initial Employee view presents the workday dashboard, a check-in action, leave balance, attendance streak, next payday, Company Pulse, activity feed, and Flow entry points. Switch to HR view to reveal the approval queue and broader Company Pulse. Use the sidebar to navigate to Attendance, Leave & time off, People, and Payroll.

## What to read

| Document | Why it exists |
| --- | --- |
| `README.md` | Setup, demo identities, stack, repository map, security notes, and reference projects |
| `docs/PRODUCT_PLAN.md` | Scope, role rules, feature priorities, acceptance criteria, and non-goals |
| `docs/ARCHITECTURE.md` | FastAPI + React + Supabase boundary, realtime strategy, security, and topology |
| `docs/DATA_MODEL.md` | HRMS entities, enums, business rules, API shape, event shape, and seed strategy |
| `docs/DEMO_SCRIPT.md` | Five-minute evaluator narrative and fallback prompts |
| `docs/EXECUTION_PLAN_2026-08-22.md` | 10:30 AM–3:30 PM IST build window and milestone cadence |
| `docs/IMPLEMENTATION_CHECKLIST.md` | Requirement-to-artifact mapping and verification gates |
| `docs/TEAM_RUNBOOK.md` | Branch, review, authorship, and demo reset protocol |
| `docs/API_REFERENCE.md` | Endpoint catalog, payloads, errors, and Flow action contract |
| `docs/SUPABASE_SETUP.md` | Supabase project, migration, Realtime, and production checklist |
| `supabase/migrations/202608220001_dayflow_schema.sql` | Supabase schema, RLS policies, indexes, and Realtime publication tables |

## Validation evidence

The frontend TypeScript compiler completes without errors and Vite produces a production bundle served into the FastAPI frontend directory. The isolated QA suite passes three tests for Flow action parsing, invalid leave date ordering, and HR-only leave review. Browser verification covered the dashboard render, Flow sick-leave draft, action confirmation, employee-to-HR handoff, Kanban approval, and updated pending count.

## Commit history

| Commit | IST timestamp | Author | Purpose |
| --- | --- | --- | --- |
| `91f93c6` | 10:22:52 | `24co35-ops` | FastAPI foundation, product/architecture docs, Supabase migration, typed demo API, initial shell |
| `b7fda0b` | 10:31:12 | `24co35-ops` | Flow, leave approval workflow, validated leave form, Supabase client boundary, navigation, QA suite |
| `2b1d985` | 10:31:22 | `24co35-ops` | Remove generated test cache and isolate validation artifacts |
| `264836d` | 10:31:59 | `24co35-ops` | Finalize hackathon runbook and implementation checklist |
| `3a95d08` | 10:33:22 | `24co35-ops` | Final delivery evidence |

The current authenticated GitHub session is `24co35-ops`. `ShivamGawade-XS` is verified as a collaborator on the repository, but no active Shivam credentials are available in this session. The manifest therefore records authorship truthfully instead of fabricating a second account’s commits. To make the history display a genuine Shivam commit, he should push one feature branch from his own authenticated GitHub session and the coordinator can merge it.
