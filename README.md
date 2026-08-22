# Dayflow — Human Resource Management System

> **Every workday, perfectly aligned.**

Dayflow is a people-operations cockpit built for the Odoo x NMIT Bangalore Hackathon 2026. It covers the required HRMS workflow—role-aware access, employee profiles, attendance, leave, approvals, and payroll visibility—while adding a more human operating layer: a live Company Pulse, a Flow HR companion, an approval Kanban, attendance streaks, and a one-click payslip artifact.

## Why this build is different

Most HRMS demos stop at Login → Dashboard → Table → Form. Dayflow is designed around the moment that matters: an employee wants to take action and HR wants to see the consequence immediately. The product’s demo loop is **check in → ask Flow → request leave → approve in Kanban → understand attendance → generate a payslip**.

## Stack

| Layer | Choice |
| --- | --- |
| Foundation | FastAPI full-stack template with Python backend and React/Vite frontend |
| Frontend | React + TypeScript + Vite + Tailwind CSS + shadcn/ui primitives |
| Domain API | FastAPI with Pydantic request/response contracts |
| Cloud boundary | Supabase Auth, Postgres, RLS, and Realtime-ready schema |
| UI utilities | Lucide, TanStack Table-compatible data patterns, Recharts-compatible chart area, React Hook Form/Zod-compatible validation patterns, Zustand-compatible store boundary |
| Artifact | jsPDF payslip export |

## Run the demo

The frontend is self-contained for resilient judging and starts with fictional seeded data. From the repository root:

```bash
cd frontend
pnpm install --ignore-scripts
pnpm dev
```

Open `http://localhost:5173`. The dashboard starts in Employee view. Use the Employee view / HR view switcher to move between role experiences. Use the left-side workspace navigation to open Attendance, Leave & time off, People, Payroll, or the profile surface. The Flow button opens the conversational HR companion; the prompt chips work even if an AI provider is not configured.

The FastAPI app can serve the compiled frontend and expose the typed demo API:

```bash
cd frontend
./node_modules/.bin/tsc -p tsconfig.build.json
./node_modules/.bin/vite build
cd ../backend
uv run fastapi dev app/main.py
```

The API endpoints are under `/api/v1/dayflow`. The default offline adapter is deliberately fictional and safe for the hackathon. Configure Supabase using `.env.example` and apply `supabase/migrations/202608220001_dayflow_schema.sql` before connecting real data.

## Demo identities

The UI role switcher is a judging convenience. The backend exposes the same concept as `GET /api/v1/dayflow/me?role=employee` and `GET /api/v1/dayflow/me?role=hr`. All names, email addresses, attendance records, and salary values are synthetic.

## Repository map

```text
docs/
  PRODUCT_PLAN.md
  ARCHITECTURE.md
  DATA_MODEL.md
  DEMO_SCRIPT.md
  EXECUTION_PLAN_2026-08-22.md
supabase/migrations/
  202608220001_dayflow_schema.sql
backend/app/api/routes/dayflow.py
backend/app/core/supabase.py
frontend/src/routes/_layout.tsx
frontend/src/routes/_layout/index.tsx
frontend/src/index.css
```

## Validation and security notes

Every user-entered leave date must be valid and chronologically ordered. Leave transitions are role-gated, salary totals must not exceed configured wage, and private salary data is intended to remain server-side and role-scoped. In production, the Supabase service-role key must remain backend-only and RLS policies must be enabled. Flow is a bounded workflow assistant: it may draft or propose known actions, but it cannot execute arbitrary SQL or bypass human approval.

## Reference projects

Dayflow’s foundation and design decisions were informed by the following open-source projects: [FastAPI full-stack template](https://github.com/fastapi/full-stack-fastapi-template), [Bulletproof React](https://github.com/alan2207/bulletproof-react), [Frappe HRMS](https://github.com/frappe/hrms), [shadcn/ui](https://github.com/shadcn-ui/ui), [TanStack Table](https://github.com/TanStack/table), [Recharts](https://github.com/recharts/recharts), [React Hook Form](https://github.com/react-hook-form/react-hook-form), [Zod](https://github.com/colinhacks/zod), [Zustand](https://github.com/pmndrs/zustand), and [Supabase JS](https://github.com/supabase/supabase-js). Each reference is used as a focused implementation guide rather than copied wholesale.

## Contribution workflow

Use feature branches and meaningful commits. A contributor should run the frontend typecheck/build and the backend test suite before opening a change. The repository keeps the hackathon execution plan and demo script in `docs/` so a new teammate can understand the product and record the final walkthrough without reverse-engineering the code.

## License

The upstream foundation remains under its original license. Dayflow-specific code is provided for the hackathon submission; review the repository licenses and attribution requirements before commercial redistribution.
