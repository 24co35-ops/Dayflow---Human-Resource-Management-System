# Dayflow HRMS — Attached Requirements Traceability

This document converts the attached HRMS screen and behavior brief into an implementation checklist for the repository. Statuses are deliberately conservative: **Implemented** means the behavior exists in the current demo and is locally testable; **Partial** means the UI or contract exists but the production boundary is incomplete; **Planned** means the requirement still needs implementation.

## Identity, authentication, and navigation

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| HRMS sign-up and sign-in pages | Partial | Retain template authentication pages and add Dayflow labels/logo treatment without enabling public employee registration. | Login and sign-up routes render; normal users cannot self-register. |
| HR/Admin creates employee accounts | Implemented | Keep the HR-only employee creation form and protected people API. | HR creates an employee; generated credentials are displayed once and never stored in the UI. |
| Login ID format `OI` + first two letters of first/last name + joining year + serial | Implemented | Keep the deterministic backend generator with collision-safe per-year serial allocation in demo persistence. | `OIJODO20220001`-style IDs are generated and unique within a company/year. |
| First password is system-generated and can be changed after login | Partial | Add server-generated temporary password marker and force-change-password state to the existing auth/profile boundary. | First login requires password change; new password is never returned after creation. |
| Successful login lands on the Dayflow dashboard | Implemented | Keep root route as the authenticated Dayflow workspace. | Authenticated navigation resolves to `/`; protected route redirects unauthenticated users to login. |
| Company logo/upload logo | Partial | Use existing logo boundary and add admin-only company branding upload metadata. | Admin can select a logo; shell uses the configured logo or safe default. |
| Avatar dropdown contains My Profile and Log Out | Implemented | Keep the shell avatar menu connected to profile navigation and available session cleanup. | Avatar menu exposes both actions; My Profile opens the existing profile view and logout clears browser auth/demo state. |
| Clickable employee cards open view-only employee information | Implemented | Keep accessible keyboard/click selection and the inline read-only profile panel. | Clicking or pressing Enter on a People row opens non-editable profile information. |

## Employee profile and salary visibility

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| My Profile opens the employee form view | Partial | Add a profile workspace using the actor-scoped `/me` payload. | Employee sees their own profile; another profile cannot be selected by query parameters. |
| Profile fields include name, department, login ID, email, mobile, manager, job position, location, company, private info, resume, and about | Partial | Extend the profile DTO and read-only profile view; keep sensitive fields role-gated. | DTO and view render the required field groups with empty states when unavailable. |
| Salary Info visible only to Admin | Partial | Hide salary navigation and endpoint data from employees; allow HR/Admin policy according to the final product decision. | Employee receives `403`; Admin sees the salary tab and data. |
| Skills, certifications, interests, and hobbies | Planned | Add structured profile arrays and editable self-profile fields that cannot alter role, email ownership, or employee code. | Employee can update allowed profile content; protected identity fields remain server-owned. |
| Bank details, PAN, UAN, DOB, gender, nationality, marital status, address | Planned | Add privacy-scoped profile fields and explicit access policy; never expose them in the employee list. | Detail view shows fields only to permitted actors and redacts them elsewhere. |

## Salary configuration and payroll

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| Fixed wage type | Implemented | Keep fixed-wage snapshot in the server-owned payroll DTO; add configurable salary structure. | Payroll payload identifies fixed wage and source employee. |
| Basic, HRA, Standard Allowance, Performance Bonus, LTA, Fixed Allowance | Partial | Add salary component model with amount/percentage mode and dependency references. | Salary editor exposes all six components and calculated monthly values. |
| Fixed amount or percentage computation type | Implemented | Keep the pure payroll calculator with validated component definitions. | Fixed and percentage components calculate deterministically in `qa/test_payroll_calculator.py`. |
| Basic as percentage of wage; HRA as percentage of Basic | Implemented | Keep server-side component bases and dependency calculation. | Wage `₹50,000`, Basic `50%` yields `₹25,000`; HRA `50%` of Basic yields `₹12,500` in calculator tests. |
| Fixed Allowance equals wage minus other components | Implemented | Keep residual allowance calculation and negative-residual validation. | Component total never exceeds wage; invalid structures fail calculator validation. |
| PF rate and Professional Tax configuration | Implemented | Keep the demo salary policy defaults and server-calculated deductions. | PF and professional tax values are visible and calculated from configured bases in the payroll payload. |
| Salary values update automatically when wage changes | Planned | Recompute server-side on every salary update and return a fresh snapshot. | Updating wage changes all dependent component amounts without a page reload. |
| Attendance determines payable days; unpaid leave/missing attendance reduce pay | Partial | Keep the attendance/leave-fed calculator, with the documented demo scheduled-day assumptions. | Payroll payload explains payable days and net result; full calendar/holiday accounting is not yet production payroll. |
| Payslip generation | Partial | Keep existing PDF preview but bind every value to the server payroll snapshot and attendance calculation. | Downloaded PDF matches the displayed server response. |

## Attendance and employee directory

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| Employee Check In changes status dot from red to green | Implemented | Keep API-backed check-in and make status derive from the current attendance record. | Successful check-in changes UI status; repeated check-in is idempotent. |
| Check Out records end time and work hours | Implemented | Keep server state machine and expose worked minutes in attendance rows. | Check-out without check-in is rejected; repeated check-out does not duplicate state. |
| Attendance list defaults to current month/day-wise records | Partial | Add month filter and day-wise response fields to the attendance workspace. | Employee sees their current-month records; HR can inspect the current workforce day. |
| HR/Admin sees attendance for all employees | Implemented | Keep protected HR attendance filter and add directory selector. | Employee is scoped to self; HR/Admin can query the workforce. |
| Status indicators: green present, airplane leave, yellow absent | Partial | Derive status from attendance plus approved leave; avoid fixture-only labels. | Status is computed from server data and documented. |
| Attendance is source for payslip payable days | Implemented | Keep attendance and approved leave as calculator inputs. | Payroll tests cover missing attendance and unpaid leave deductions; API exposes payable days. |
| Employee cards show avatar, basic information, and status icon | Implemented | Keep protected people mapping, accessible row selection, and attendance-derived status when records are available. | Directory rows render server profiles, status dots, and a read-only profile panel. |

## Time off and HR review

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| Employee can view own time off records | Implemented | Keep actor-scoped leave query and add allocation summary. | Employee cannot see another employee’s requests. |
| HR/Admin can view and approve/reject all requests | Implemented | Keep protected review endpoint and add explicit review comments/status history. | HR approves/rejects pending requests; repeated review is rejected. |
| Paid time off, sick leave, and unpaid leave | Implemented | Preserve allow-listed leave types and expose allocation balances. | Form and API reject unknown types. |
| New request form has validity period, type, allocation, attachment, submit/discard | Partial | Keep date/type validation, reset-on-success, and certificate metadata boundary. | Form validates dates/type and preserves values on server error; allocation enforcement and binary storage remain pending. |
| Sick-leave certificate attachment | Partial | Keep extension/size validation and linked metadata; add authenticated object storage before production use. | PDF/PNG/JPG/JPEG metadata up to 5 MB is accepted and persisted; no file bytes or download ACLs are implemented. |
| Leave conflicts are rejected | Implemented | Preserve overlap rule for pending/approved requests. | Overlapping request returns `409`. |

## Product and operational quality

| Attached requirement | Current status | Fastest implementation target | Acceptance evidence |
| --- | --- | --- | --- |
| Responsive Employee and HR/Admin views | Implemented | Continue using shared shell/mobile nav and test both role contexts. | Desktop and mobile smoke tests cover navigation and core actions. |
| Data must be dynamic rather than static-only JSON | Partial | API-backed demo is implemented with explicit mode; next production step is Supabase repository/auth integration. | Refresh persistence works in demo mode; production boundary is not falsely claimed. |
| Role separation must be enforced server-side | Implemented for demo actor contract | Replace demo actor headers with verified Supabase JWT claims before production deployment. | Missing/mismatched actor context returns `401/403`. |
| Realtime updates | Planned | Subscribe to Supabase attendance, leave, and activity tables after verified auth/persistence is deployed. | Second tab receives a controlled update without full refresh. |

## Delivery rule

The fastest credible hackathon path is to finish the **Implemented/Partial** rows that are visible in the judging flow first: generated employee identity, clickable read-only profiles, role-gated salary, attendance-driven payroll, leave attachment metadata, and deterministic mobile/E2E coverage. Live Supabase deployment, verified JWT actor resolution, transactional payroll, and Realtime remain infrastructure-dependent and must not be represented as complete until deployed and tested.
