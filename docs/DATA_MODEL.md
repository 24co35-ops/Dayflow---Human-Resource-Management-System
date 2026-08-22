# Dayflow — Data Model and Business Rules

## Core entities

| Entity | Purpose | Important fields |
| --- | --- | --- |
| `profiles` | Employee identity and HR profile | `id`, `auth_user_id`, `employee_code`, `full_name`, `email`, `role`, `department`, `job_position`, `manager`, `location`, `phone`, `address`, `start_date,` `avatar_url` |
| `salary_structures` | Salary configuration and derived components | `id`, `profile_id`, `wage`, `basic_rate`, `hra_rate`, `standard_allowance`, `performance_bonus_rate`, `lta_rate`, `fixed_allowance`, `pf_rate`, `professional_tax`, `effective_from` |
| `attendance_records` | Daily work status and time accounting | `id`, `profile_id`, `attendance_date`, `check_in_at`, `check_out_at`, `status`, `worked_minutes`, `notes`, `source` |
| `leave_requests` | Employee time-off requests and approval state | `id`, `profile_id`, `leave_type`, `start_date`, `end_date`, `days`, `remarks`, `status`, `reviewer_id`, `review_comment`, `created_at`, `updated_at` |
| `payslips` | Generated salary snapshot | `id`, `profile_id`, `period_year`, `period_month`, `gross_salary`, `deductions`, `net_salary`, `payable_days`, `attendance_days`, `pdf_path`, `generated_at` |
| `activity_events` | Realtime and audit-friendly activity feed | `id`, `actor_id`, `event_type`, `entity_type`, `entity_id`, `payload`, `created_at` |

## Enumerations

| Enum | Values |
| --- | --- |
| `role` | `employee`, `hr`, `admin` |
| `attendance_status` | `present`, `absent`, `half_day`, `leave` |
| `leave_type` | `paid`, `sick`, `unpaid` |
| `leave_status` | `pending`, `approved`, `rejected` |
| `event_type` | `check_in`, `check_out`, `leave_submitted`, `leave_approved`, `leave_rejected`, `payslip_generated`, `profile_updated` |

## Business rules

An attendance record is unique for a profile and date. Check-in creates the day’s record if one does not exist and is idempotent if the employee has already checked in. Check-out updates the open record and calculates worked minutes from UTC timestamps. A leave request must have an end date on or after its start date, must use a supported leave type, and must not overlap another approved or pending request for the same employee. Only Admin/HR may transition a request from Pending to Approved or Rejected.

Salary components are derived from the configured wage. The hackathon demo uses the wireframe’s examples: Basic is a percentage of wage, HRA is a percentage of Basic, other components may be fixed or percentage-based, and Fixed Allowance is the balancing amount. The sum of components must never exceed wage. PF and professional tax are deductions in the payslip calculation. Payable days are based on attendance and approved leave; unpaid leave and missing attendance reduce payable days according to the selected period’s working-day count.

Employee profile edits are restricted to address, phone, and avatar metadata. Admin/HR edits may include professional and salary fields. A normal employee cannot read salary structures belonging to another employee, even if the frontend route is manually changed.

## API shape

The frontend consumes typed endpoint shapes generated from FastAPI’s OpenAPI document. The core operations are:

| Method | Endpoint | Access | Result |
| --- | --- | --- | --- |
| `GET` | `/api/v1/me` | Signed-in user | Current profile and role |
| `GET` | `/api/v1/dashboard` | Signed-in user | Role-specific KPIs and recent activity |
| `GET` | `/api/v1/attendance` | Own or HR | Filtered attendance records |
| `POST` | `/api/v1/attendance/check-in` | Own | Today’s present record |
| `POST` | `/api/v1/attendance/check-out` | Own | Closed attendance record |
| `GET` | `/api/v1/leave-requests` | Own or HR | Requests with filters |
| `POST` | `/api/v1/leave-requests` | Own | Pending leave request |
| `PATCH` | `/api/v1/leave-requests/{id}` | HR | Approved/rejected request |
| `GET` | `/api/v1/employees` | HR | Employee directory |
| `GET` | `/api/v1/payroll/{profile_id}` | Own or HR | Salary view and derived totals |
| `POST` | `/api/v1/payroll/{profile_id}/payslip` | HR | Payslip payload and PDF download URL |
| `POST` | `/api/v1/flow/message` | Signed-in user | Answer plus optional validated action proposal |

## Realtime event shape

```json
{
  "event": "leave_submitted",
  "entity": "leave_request",
  "entity_id": "leave-1004",
  "actor": {"id": "emp-004", "name": "Meera Joshi"},
  "summary": "Meera Joshi requested sick leave for Aug 25–26",
  "created_at": "2026-08-22T09:42:00Z"
}
```

## Seed data

The demo seed should include one Admin/HR identity and at least five fictional employees spread across Engineering, Design, Operations, and Finance. The initial dataset should contain a mix of present, late, on-leave, and not-yet-checked-in states; pending, approved, and rejected leave cards; and salary structures that produce readable payslips. Seed data is explicitly synthetic and must be replaceable by Supabase rows through the same adapter interface.

## References

[1]: https://github.com/frappe/hrms "Frappe HRMS modules and domain vocabulary"
[2]: https://github.com/TanStack/table "TanStack Table"
[3]: https://github.com/react-hook-form/react-hook-form "React Hook Form"
[4]: https://github.com/colinhacks/zod "Zod"
[5]: https://github.com/supabase/supabase-js "Supabase JavaScript client"
