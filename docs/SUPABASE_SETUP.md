# Dayflow — Supabase Setup

## Purpose

Dayflow can run in two modes. **Offline demo mode** uses fictional seeded data and keeps the hackathon walkthrough resilient when the network or cloud project is unavailable. **Supabase mode** uses Supabase Auth, Postgres, row-level security, and Realtime for the production-shaped data boundary. Both modes use the same product concepts and UI states.

## Create a project

Create a Supabase project, then copy its project URL and public anon key into the frontend environment. Keep the service-role key exclusively on the server. Never place the service-role key in `frontend/.env`, browser code, screenshots, commits, or a client-side build.

```bash
# frontend/.env.local
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

```bash
# root .env or deployment secret store
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SERVER_ONLY_SERVICE_ROLE_KEY
```

## Apply the schema

Run `supabase/migrations/202608220001_dayflow_schema.sql` in the Supabase SQL Editor or through the Supabase CLI. The migration creates profiles, salary structures, attendance records, leave requests, payslips, and activity events. It also creates role-aware policies and adds the realtime tables used by Company Pulse.

The SQL migration is intentionally explicit rather than hidden in application startup. That keeps schema changes reviewable, repeatable, and safe to apply in a fresh project. If the migration has already been applied, do not rerun it without first checking which statements have completed; enum and policy statements may need to be applied selectively in an existing database.

## Seed fictional demo data

For judging, use synthetic identities such as Arjun Singh, Priya Nair, Rahul Mehta, Sara D'Souza, Karan Shah, and Meera Joshi. Seed one HR/Admin profile and several employee profiles with a mix of present, late, leave, and not-yet-checked-in states. Add pending, approved, and rejected leave requests plus one salary structure that produces the sample ₹51,800 net payslip.

Do not seed real personal information, real bank details, production salary records, or private credentials. The checked-in repository intentionally uses the offline demo adapter so a judge can run the experience without access to a private Supabase project.

## Verify Realtime

In Supabase, confirm that `attendance_records`, `leave_requests`, and `activity_events` are included in the `supabase_realtime` publication. Open the Dayflow dashboard in two browser tabs, perform a check-in or leave transition in one tab, and confirm the Company Pulse or approval queue updates in the other tab. If the channel cannot connect, the UI should show offline demo mode rather than failing the complete workflow.

## Production checklist

Before production use, replace the demo adapter with authenticated user lookup, validate Supabase JWTs in FastAPI, enable and test RLS policies for every table, add audit logging for salary changes and leave review, rotate keys through a secret manager, and verify that salary fields cannot be read by an employee belonging to another profile. The hackathon build is a demonstrable foundation, not a claim of production payroll compliance.

## Related files

| File | Role |
| --- | --- |
| `.env.example` | Safe variable names and local defaults |
| `frontend/src/lib/supabase.ts` | Public browser client and offline-mode switch |
| `backend/app/core/supabase.py` | Optional server-side REST boundary |
| `supabase/migrations/202608220001_dayflow_schema.sql` | Postgres schema, policies, indexes, and realtime tables |
| `docs/ARCHITECTURE.md` | System topology and security decisions |
