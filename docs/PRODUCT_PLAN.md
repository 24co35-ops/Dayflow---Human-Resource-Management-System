# Dayflow — Product Plan

**Version:** Hackathon build, 22 August 2026  
**Product promise:** *Every workday, perfectly aligned.*

## Product thesis

Dayflow should not feel like a collection of HR tables. It should feel like a calm operational cockpit for the workday: employees can understand their own status in seconds, while HR can see what needs attention, act on it, and explain decisions. The winning loop is deliberately narrow and memorable: **check in → ask Flow → request leave → approve in Kanban → understand attendance → generate a payslip**.

The supplied requirements define an HRMS for two user classes: Admin/HR and Employee. Dayflow therefore treats role-based access, attendance, leave approvals, employee profiles, and payroll visibility as the non-negotiable skeleton. The UI differentiators are a live Company Pulse, Flow AI, an approval Kanban, streak progress, and a polished payslip artifact.

## Scope for the hackathon

| Capability | Employee | Admin / HR | Demo priority | Implementation decision |
| --- | --- | --- | --- | --- |
| Sign in and role-aware access | Required | Required | P0 | Supabase Auth-compatible adapter with demo mode fallback |
| Employee dashboard | Required | Optional | P0 | Quick cards, alerts, today’s status, streak |
| Admin dashboard | No | Required | P0 | KPI cards, pulse, pending work, attendance snapshot |
| Profile view | Own profile | All profiles | P0 | Read-only salary section for employee; admin sees full record |
| Limited profile edit | Address, phone, avatar | All editable fields | P1 | React Hook Form + Zod validation |
| Check-in / check-out | Own record | View all records | P0 | Idempotent daily action; UTC timestamp persistence |
| Attendance view | Own daily/weekly | All employees | P0 | Table plus weekly chart; statuses Present/Absent/Half-day/Leave |
| Leave application | Required | Review | P0 | Paid, Sick, Unpaid; date range, remarks, status |
| Leave approvals | No | Required | P0 | Three-column Kanban with approve/reject and comments |
| Payroll visibility | Own read-only | All employees | P0 | Salary components and generated payslip |
| Flow AI assistant | Ask own HR questions and draft actions | Ask company questions and draft actions | P0 | Bounded action parser; no arbitrary database writes |
| Company Pulse | Personal context | Required | P0 | Realtime-ready event stream with local fallback |
| Attendance streak | Required | View team signal | P1 | Explainable count from attendance records |
| Notifications | In-app | In-app | P1 | Toasts and activity feed; email is future scope |
| Onboarding, performance, expenses, taxation | No | No | P2 | Documented extension points only; excluded from the 8-hour cut |

## Role rules

Employees can read and update only their own profile’s permitted fields, read their own attendance and payroll information, check in or out, and create or view their own leave requests. Admin/HR users can read all employee records, edit employee data, view all attendance, review leave requests, manage salary components, and generate payslips. The frontend may hide controls for clarity, but every privileged mutation must also be enforced by the API/data policy layer.

## Experience principles

The interface uses a dark navy workspace, warm off-white surfaces, and a single electric lime accent for actions and live status. The persistent sidebar keeps the app navigable during a demo. Cards are information-dense but spacious, with strong hierarchy and clear empty/loading/error states. Animations are reserved for the pulse, Kanban drop, and confirmation moments so the product feels alive without becoming distracting.

The wireframe’s profile concepts are preserved as practical sections rather than placeholder copy: personal information, professional information, salary information, private information, documents, and interests. Salary information remains privileged. The dashboard should make the next action obvious: **check in, resolve a leave request, or ask Flow**.

## Acceptance criteria

A build is demo-ready when a reviewer can sign in using seeded demo identities, land on a role-appropriate dashboard, complete the employee leave flow, observe the admin’s live-ready pulse update, move a leave card from Pending to Approved, ask Flow for a ranked attendance insight, and download a payslip PDF. All visible forms must reject invalid dates, missing required values, and impossible salary totals with human-readable messages. The app must remain usable on a laptop viewport and a narrow mobile viewport.

## Explicit non-goals

The hackathon build will not attempt to replicate the full breadth of Frappe HR, implement tax law, process real bank transfers, collect biometric or geolocation data, or make unreviewed AI decisions. Flow is an assistant and workflow accelerator. Human approval remains required for leave and payroll changes.

## References

[1]: https://github.com/tiangolo/full-stack-fastapi-template "FastAPI full-stack template specified as the foundation"
[2]: https://github.com/alan2207/bulletproof-react "React architecture reference specified by the user"
[3]: https://github.com/frappe/hrms "Frappe HRMS domain reference"
[4]: https://github.com/shadcn-ui/ui "shadcn/ui component reference"
[5]: https://github.com/TanStack/table "TanStack Table reference"
[6]: https://github.com/recharts/recharts "Recharts reference"
[7]: https://github.com/react-hook-form/react-hook-form "React Hook Form reference"
[8]: https://github.com/colinhacks/zod "Zod validation reference"
[9]: https://github.com/pmndrs/zustand "Zustand state reference"
[10]: https://github.com/supabase/supabase-js "Supabase JavaScript client reference"
