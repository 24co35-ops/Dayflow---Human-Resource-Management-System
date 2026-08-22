# Dayflow — API Reference

The Dayflow API is exposed under `/api/v1/dayflow`. The current implementation includes a deterministic seeded adapter for offline judging. When Supabase is configured, these contracts are the boundary that should be backed by authenticated profiles, database queries, and Realtime events.

## Endpoint catalog

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/me?role=employee\|hr` | Demo or signed-in user | Resolve the current profile and role |
| `GET` | `/dashboard?role=employee\|hr` | Signed-in user | Return KPIs, pulse, pending leaves, and recent activity |
| `GET` | `/attendance?role=employee\|hr&profile_id=...` | Own profile or HR/Admin | Read attendance records |
| `POST` | `/attendance/check-in?profile_id=...` | Own profile | Create or idempotently update today’s present record |
| `POST` | `/leave-requests?profile_id=...` | Own profile | Create a pending leave request |
| `GET` | `/leave-requests?role=employee\|hr&profile_id=...` | Own profile or HR/Admin | Read personal or team requests |
| `PATCH` | `/leave-requests/{request_id}?role=hr` | HR/Admin only | Approve or reject a pending request |
| `POST` | `/flow/message?role=employee\|hr` | Signed-in user | Return a safe answer and optional known action proposal |

## Leave request example

```json
{
  "leave_type": "sick",
  "start_date": "2026-08-25",
  "end_date": "2026-08-26",
  "remarks": "Recovering from a fever"
}
```

The server validates the date order, computes inclusive day count, associates the request with the profile, and returns `status: "pending"`. A request cannot move to Approved or Rejected through the employee path.

## Leave review example

```json
{
  "status": "approved",
  "review_comment": "Approved — please rest and recover."
}
```

The review route requires an HR/Admin role. In Supabase mode, the corresponding update must be protected by the RLS policy and should emit an `activity_events` row for the Company Pulse.

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

The `action` object is an allow-listed proposal. The frontend should show an action preview and confirmation step; the server should validate the payload again before mutating state. Model output must never be treated as executable SQL, arbitrary code, or an authorization decision.

## Error semantics

`401` means the caller is not authenticated. `403` means the caller is authenticated but lacks the required role or ownership. `404` means the requested resource does not exist. `422` means the request body or date range is invalid. UI error states should show a short human-readable message while preserving the form values so the user can correct the request.

## Realtime events

The Supabase subscription surface should listen to `attendance_records`, `leave_requests`, and `activity_events`. Normalize database events to the pulse event shape documented in `docs/DATA_MODEL.md`, then update the dashboard store without forcing a full page refresh.

## References

[1]: https://fastapi.tiangolo.com "FastAPI documentation"
[2]: https://supabase.com/docs/guides/realtime "Supabase Realtime documentation"
[3]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"
