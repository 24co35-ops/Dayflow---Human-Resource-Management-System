# Dayflow API Reference

The Dayflow API is exposed under `/api/v1/dayflow`. The repository now includes an explicit **demo data plane** for hackathon judging. In demo mode, the API uses actor headers and optionally persists workflow state to a JSON file. This is not a substitute for verified Supabase Auth in production.

## Actor contract

Every Dayflow request must provide the following headers when `DAYFLOW_DEMO_MODE=true`:

```http
X-Dayflow-Demo-Role: employee | hr | admin
X-Dayflow-Demo-Profile-Id: emp-001 | emp-002 | emp-003 | emp-004 | hr-001
```

The server validates the role/profile combination. Query-string `role` and `profile_id` values are ignored for authorization and cannot impersonate another actor. Without demo mode, the current reference adapter returns `401` until a verified Supabase JWT dependency is configured.

## Endpoint catalog

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/me` | Actor headers | Resolve the current profile and role |
| `GET` | `/dashboard` | Actor headers | Return KPIs, pulse, pending leaves, and recent activity |
| `GET` | `/people` | HR/Admin | Read the workforce directory |
| `GET` | `/attendance` | Own profile or HR/Admin | Read attendance records; HR/Admin may use an explicit filter |
| `POST` | `/attendance/check-in` | Own profile | Create or idempotently update today’s present record |
| `POST` | `/attendance/check-out` | Own profile | Close today’s record and calculate worked minutes |
| `GET` | `/leave-requests` | Own profile or HR/Admin | Read personal or team requests |
| `POST` | `/leave-requests` | Own profile | Create a pending leave request with inclusive day count |
| `PATCH` | `/leave-requests/{request_id}` | HR/Admin only | Approve or reject a pending request |
| `GET` | `/payroll` | Own profile or HR/Admin | Read server-owned salary snapshots |
| `GET` | `/activity` | Own profile or HR/Admin | Read actor/team activity events |
| `POST` | `/flow/message` | Actor headers | Return a safe answer and optional allow-listed action proposal |
| `POST` | `/demo/reset` | HR/Admin | Reset the explicit demo adapter to seed data |

## Persistence modes

Set the following variables for the local API-backed demo:

```env
DAYFLOW_DEMO_MODE=true
DAYFLOW_PERSIST_DEMO_STATE=true
DAYFLOW_STATE_FILE=/tmp/dayflow-demo-state.json
```

When persistence is enabled, attendance, leave, and activity mutations survive browser refreshes and backend process reuse through the configured JSON file. A corrupt demo file is discarded in favor of seed data. This adapter is intentionally limited to local/demo use; production deployments must use database transactions and verified user identity.

## Leave request example

```json
{
  "leave_type": "sick",
  "start_date": "2026-08-25",
  "end_date": "2026-08-26",
  "remarks": "Recovering from a fever"
}
```

The server validates date order, computes inclusive day count, associates the request with the actor profile, rejects overlap with an existing pending or approved request, and returns `status: "pending"`. A request cannot move to Approved or Rejected through the employee path.

## Leave review example

```json
{
  "status": "approved",
  "review_comment": "Approved — please rest and recover."
}
```

The review route requires an HR/Admin actor, rejects already-reviewed requests, records the reviewer identity from the actor context, and emits an activity event.

## Attendance state machine

A workday begins in either an absent/no-record state or a present record with a check-in timestamp. Check-in is idempotent for the same day. Check-out requires a check-in, is idempotent after the first close, records a UTC timestamp, and computes non-negative worked minutes. The current demo implementation uses process-local records with optional file persistence; it does not yet provide database-level locking for concurrent production requests.

## Flow response example

```json
{
  "answer": "I can draft a 2-day Sick Leave request for 25–26 August. It will remain pending until HR reviews it.",
  "action": {
    "action": "apply_leave",
    "data": {
      "leave_type": "sick",
      "start_date": "2026-08-25",
      "end_date": "2026-08-26",
      "remarks": "I need sick leave"
    }
  }
}
```

The `action` object is an allow-listed proposal. The frontend shows an action preview and confirmation step; the server validates the final leave payload again before mutation. Model output must never be treated as executable SQL, arbitrary code, or an authorization decision.

## Error semantics

`401` means the actor context is missing or production authentication is not configured. `403` means the caller is authenticated but lacks the required role, ownership, or valid role/profile combination. `404` means the requested resource does not exist. `409` means a workflow conflict such as overlapping leave or reviewing a completed request. `422` means the request body or date range is invalid. UI error states should show a short human-readable message while preserving form values so the user can correct the request.

## Production migration boundary

The Supabase schema and RLS migration remain the intended production boundary. A deployment must replace `get_dayflow_actor` with a verified Supabase JWT/session dependency, map UUID-backed profiles to the domain models, move workflow mutations into transactional repository methods, and subscribe to `attendance_records`, `leave_requests`, and `activity_events` through Realtime. The repository does not claim those live Supabase operations have been deployed or verified.

## References

[1]: https://fastapi.tiangolo.com "FastAPI documentation"
[2]: https://supabase.com/docs/guides/realtime "Supabase Realtime documentation"
[3]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"
