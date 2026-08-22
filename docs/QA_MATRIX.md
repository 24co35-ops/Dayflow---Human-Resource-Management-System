# Dayflow QA Matrix

| Area | Happy path | Boundary path | Evidence |
| --- | --- | --- | --- |
| Attendance | Check in once | Check in twice | Idempotent record contract |
| Leave | Submit a two-day request | End date before start date | `422` validation |
| Review | HR approves pending card | Employee attempts review | `403` authorization |
| Flow | Draft sick leave | Unknown prompt | Safe fallback answer |
| Payroll | Generate payslip | Missing cloud provider | Preview/print fallback |
