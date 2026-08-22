# Dayflow Hackathon Research Notes

## Competition constraints

- Event: Odoo x NMIT Bangalore Hackathon 2026.
- Virtual round: 22 August 2026, coding window listed as 9:00 AM–5:00 PM; the requested implementation/commit focus is 10:30 AM–3:30 PM.
- Must use dynamic or real-time data sources rather than only static JSON for the final experience.
- Must deliver a responsive, clean, consistently styled UI with robust input validation, intuitive navigation, and evidence of proper version control with more than one contributor.
- Problem statement: Dayflow.

## Product requirements from attached PDF

Dayflow is an HRMS for Admin/HR and Employee roles. Required areas are secure sign-up/sign-in, role-based access, employee profile management, daily/weekly attendance with check-in/check-out and statuses (Present, Absent, Half-day, Leave), leave/time-off application and approval workflow with Pending/Approved/Rejected states, and payroll/salary visibility with read-only employee access and admin controls. Employee profile fields include personal/job/salary/document/profile-picture information; employees may edit limited personal fields while admins can edit all employee details.

## Product direction from attached pasted content

The differentiated concept is to make Dayflow feel like a living operational system rather than a static CRUD app. Core differentiators proposed are: Flow, an AI HR companion that answers live-data questions and can pre-fill or execute bounded actions; a real-time Company Pulse showing check-ins, late employees, approved leave, and not-yet-checked-in employees; a Kanban leave approval board; attendance streak gamification; and a one-click polished payslip PDF. The recommended demo narrative is Employee uses Flow to request leave, Admin sees the request in real time and approves it in Kanban, Admin asks Flow an attendance question, then generates a payslip and shows the streak.

## Reference repository findings

1. FastAPI template: https://github.com/fastapi/full-stack-fastapi-template (the user-provided tiangolo URL redirects here). Current repository describes FastAPI + SQLModel + PostgreSQL + React + TypeScript + Vite + Tailwind + shadcn/ui, with JWT auth, password recovery, Playwright, Docker Compose, CI/CD, and a same-domain API/frontend arrangement.
2. React architecture: https://github.com/alan2207/bulletproof-react. Its documentation emphasizes project standards, feature-oriented project structure, component/styling conventions, API layer, state management, testing, error handling, security, performance, and deployment.

## Repository state

The selected target repository is `24co35-ops/Dayflow---Human-Resource-Management-System`. It cloned successfully but is empty: no commits, no tracked files, and a `main` branch whose remote branch is not yet present. Remote is the selected organization repository.

## Initial architecture decision to validate after inspecting the repo

Because the target repository is empty, the implementation will need a clearly documented scaffold. The user explicitly asks for the FastAPI template as the base but also requests React + Tailwind + shadcn/ui and Supabase. We should avoid claiming Supabase is already wired into the FastAPI template. We will either build the requested hybrid intentionally (FastAPI API + Supabase Auth/Postgres/Realtime through explicit environment configuration) or document a pragmatic hackathon-safe boundary where Supabase is the data/auth provider and FastAPI is the validated application API layer.

## Outstanding research

Inspect the provided Excalidraw text elements for screen names/layout hints, inspect the target repo/account permissions, and inspect the selected reference repositories only where needed to keep implementation within the hackathon window. Save exact source URLs and decisions in `docs/` as the project is built.

## Additional reference findings

3. Frappe HRMS: https://github.com/frappe/hrms. The reference describes a mature HR/payroll product spanning employee lifecycle, onboarding, promotions/transfers, leave and attendance, check-in/out, expense claims, performance management, payroll/taxation, salary structures, salary slips, and mobile access. Dayflow’s hackathon scope should stay focused on the supplied requirements while using these concepts for credible naming and extension points.
4. shadcn/ui: https://github.com/shadcn-ui/ui. It is an accessible component set and code distribution platform that works across frameworks. The repository includes modern component packages/templates and a substantial emphasis on composable UI primitives, making it suitable for a fast, consistent implementation rather than a custom design system from scratch.

## Time-boxed product thesis

Ship one coherent “day-in-the-life” workflow instead of a broad shallow HR suite: Employee signs in, checks in, asks Flow for leave, Admin sees the live Company Pulse, approves the request on a Kanban board, asks Flow for an attendance insight, and generates a payslip. Every non-core item should be judged by whether it strengthens this demo loop or increases failure risk.

## GitHub contribution constraint

The selected repository belongs to `24co35-ops`; the user also named `ShivamGawade-XS`. A Git commit can only truthfully show the configured local author identity or a co-author trailer, and pushing on behalf of another GitHub account requires that account’s credentials/permissions. The build should therefore create clean, meaningful commits with authorship configured only from identities available in the session, and explicitly verify remote permissions before promising dual-account attribution.
