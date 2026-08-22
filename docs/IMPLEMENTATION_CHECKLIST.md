# Dayflow — Implementation and Judging Checklist

## Functional requirements

| Requirement | Artifact | Verified |
| --- | --- | --- |
| Secure sign-in foundation | FastAPI template auth routes and Supabase client boundary | Scaffold retained; demo shell is accessible without cloud credentials |
| Role-based access | Employee / HR view switcher, API `role` parameters, RLS policies | Employee and HR dashboards verified in browser |
| Employee profile | Profile route surface with personal, professional, and salary visibility copy | Included in dashboard code; salary is role-labelled |
| Attendance | Check-in CTA, daily/weekly rhythm chart, status dots, team pulse | Check-in state and attendance view verified visually |
| Leave application | React Hook Form + Zod request form, Flow draft action, API create route | Flow draft and confirm verified; form uses date/order validation |
| Leave approval | Pending / Approved / Rejected Kanban and API review route | HR approval moved a card and updated counts in browser |
| Payroll visibility | Salary component cards, deductions, net salary, payslip export | PDF export path implemented with jsPDF |
| Dynamic data | Shared React state mutations, FastAPI demo API, optional Supabase tables/realtime | Leave/check-in mutations change the rendered experience |
| Responsive UI | Mobile-first Tailwind layouts and overflow-safe people table | Narrow viewport structure is supported by layout classes |
| Input validation | Zod form schema and Pydantic API models | Invalid date ordering and API role tests pass |

## Demo-critical paths

The reviewer should be able to start at `/`, open Flow, trigger the sick-leave chip, confirm the action, switch to HR view, open Leave & time off, approve the new card, open Attendance, open Payroll, and generate a PDF. If the reviewer starts on another route, the persistent sidebar provides an escape route to the same screens.

## Quality gates

The direct TypeScript compiler completes without errors. Vite produces a production bundle. The isolated Python QA suite passes three focused tests covering Flow action parsing, invalid leave dates, and HR-only review. The backend source compiles under the sandbox’s Python runtime after correcting an invalid upstream exception tuple and a forward-reference import issue. The full upstream integration suite still expects the template’s full database/test environment and is not used as the hackathon smoke test.

## Known limitations to disclose

The browser demo defaults to a seeded offline adapter when Supabase environment variables are missing. The Flow response is deterministic in the visible hackathon path; the backend endpoint is structured so an LLM provider can be added without changing the action contract. The current payslip artifact uses synthetic values. Real Supabase Auth and RLS need a configured project and should be smoke-tested with the supplied migration before production use.
