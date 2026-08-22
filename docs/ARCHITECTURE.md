# Dayflow — Architecture Decision Record

## Decision summary

Dayflow uses the requested **FastAPI full-stack template as its foundation**, with a React + TypeScript + Vite frontend styled with Tailwind CSS and shadcn/ui primitives. The hackathon implementation adds a thin, explicit Supabase integration boundary for Auth, Postgres, and Realtime while preserving a FastAPI API layer for validated business operations and a deterministic demo-mode adapter when cloud credentials are absent.

This is intentional rather than accidental. The upstream FastAPI template is designed around a Python API, PostgreSQL, SQLModel, generated OpenAPI client, and a React/Tailwind/shadcn frontend. Supabase provides managed Auth, Postgres, and Realtime, but it does not remove the need for server-side authorization and business rules. Dayflow keeps privileged operations behind FastAPI and uses Supabase from the browser only for the safe, user-scoped flows and realtime subscription surface.

## System topology

```text
┌──────────────────────┐
│ React + Vite frontend │
│ Tailwind + shadcn/ui  │
│ TanStack Table        │
│ Recharts              │
│ RHF + Zod             │
│ Zustand                │
└──────────┬───────────┘
           │ REST / OpenAPI client
           ▼
┌────────────────────────────┐
│ FastAPI application API     │
│ role checks + domain rules  │
│ attendance / leave / payroll│
│ Flow action validation      │
└───────┬──────────┬─────────┘
        │          │
        │          └──────────────────┐
        ▼                             ▼
┌───────────────┐             ┌─────────────────┐
│ Supabase REST │             │ Supabase Auth   │
│ / Postgres    │             │ + Realtime      │
│ RLS policies  │             │ event channels  │
└───────────────┘             └─────────────────┘
```

In local judging without Supabase credentials, the same UI uses a seeded in-memory adapter with the same response shapes. That mode is a resilience feature, not a static-only product: it lets the team demo the complete workflow offline while production configuration can point the API and browser client at Supabase.

## Frontend structure

The frontend is organized by feature boundaries inspired by Bulletproof React: `features/auth`, `features/dashboard`, `features/attendance`, `features/leave`, `features/payroll`, `features/employees`, and `features/flow`. Shared design primitives live under `components/ui`; app shell and cross-cutting components live under `components`; API client and formatting helpers live under `lib`; and small cross-feature state such as selected demo role and theme lives in `stores`.

The navigation shell is established before feature pages so no route becomes a dead end. The main routes are `/login`, `/dashboard`, `/attendance`, `/leave`, `/employees`, `/payroll`, `/profile`, and `/settings`. Admin-only routes are guarded in the router and rechecked by FastAPI. The employee dashboard is the default route for an employee; the admin dashboard is the default route for Admin/HR.

## Backend boundaries

FastAPI owns authentication verification, role authorization, input validation at the API boundary, attendance idempotency, leave state transitions, salary-total validation, payslip generation metadata, and Flow action execution. Flow may propose `apply_leave`, `check_in`, `check_out`, or `payroll_summary` actions, but the server accepts only known actions with validated schemas and never executes arbitrary SQL or arbitrary code from model output.

Supabase Auth is the external identity provider when configured. The API accepts a verified Supabase access token and maps its subject to an employee record. In demo mode, a clearly labeled seeded identity switcher avoids a login wall while preserving role-specific rendering. This separation makes the demo reliable without hiding the production integration requirements.

## Realtime strategy

The Company Pulse subscribes to `attendance`, `leave_requests`, and `activity_events` changes through Supabase Realtime when configured. Each event is normalized into a small pulse item and inserted into the UI store. The local adapter emits the same event shape after a successful mutation, so the demo still visibly updates without a network refresh. The UI shows a small connection indicator and degrades gracefully to “synced locally” when a realtime channel is unavailable.

## Security decisions

Supabase service-role credentials never enter the browser. Salary and private profile fields are returned only from privileged FastAPI endpoints. Row-level security policies should be enabled in Supabase before production use, with employee-scoped policies for personal data and an HR policy for management views. The demo seed contains fictional employees and synthetic salary values only. AI prompts should contain the minimum data required for a question, and Flow should avoid exposing salary or private fields to users without the appropriate role.

## Reference alignment

The FastAPI template contributes the Python API, configuration, migrations, testing, and deployment shape. Bulletproof React contributes feature-oriented organization and cross-cutting concerns. Frappe HR informs the domain vocabulary around employee lifecycle, leave/attendance, payroll and salary slips. shadcn/ui, Lucide, TanStack Table, Recharts, React Hook Form, Zod, Zustand, and Supabase JS provide focused UI, visualization, forms, state, and cloud-client primitives without introducing unnecessary abstractions.

## References

[1]: https://github.com/fastapi/full-stack-fastapi-template "FastAPI full-stack template"
[2]: https://github.com/alan2207/bulletproof-react "Bulletproof React architecture"
[3]: https://github.com/frappe/hrms "Frappe HRMS domain reference"
[4]: https://github.com/shadcn-ui/ui "shadcn/ui"
[5]: https://github.com/supabase/supabase-js "Supabase JavaScript client"
