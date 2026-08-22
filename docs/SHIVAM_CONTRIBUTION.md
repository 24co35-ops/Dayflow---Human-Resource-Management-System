# ShivamGawade-XS Contribution

This branch records a contributor-owned Dayflow improvement package for the hackathon repository. The changes are intentionally split into reviewable commits so the history shows implementation decisions rather than empty activity.

## Delivered changes

The branch adds a responsive mobile workspace navigation bar that follows the active hash route, exposes accessible labels, and keeps all primary workspaces reachable on narrow screens. It adds a reusable asynchronous state component for directory empty states so a zero-result search is explained instead of rendering an ambiguous blank table.

The backend now records a role-scoped activity feed for attendance check-ins, leave creation, and HR leave reviews. Each event has an actor, entity, event type, message, and UTC timestamp. Employee requests remain scoped to the acting profile, while HR and Admin can inspect the shared activity stream.

The branch also hardens the Dayflow quality workflow with immutable action pins, least-privilege read permissions, and non-persistent checkout credentials. The Bun workspace lockfile is synchronized so frozen installs are deterministic. The upstream SQLModel User–Item mapping is explicitly configured for the Python 3.14 CI runtime.

## Verification evidence

The following checks pass locally from the repository root:

```bash
bun ci
cd frontend
./node_modules/.bin/tsc -p tsconfig.build.json --pretty false
./node_modules/.bin/vite build
cd ..
PYTHONPATH=backend python3 -m pytest qa -q
PYTHONPATH=backend python3 /home/ubuntu/check_dayflow_models.py
```

The isolated Dayflow suite reports **13 passed**. The SQLModel mapper smoke test reports `SQLModel relationship mapper configuration passed`. The Dayflow Quality workflow and Zizmor security scan pass on the contributor branch.

## Review checklist

Reviewers should confirm that the mobile navigation remains keyboard reachable, the People empty state is announced with a status role, activity events never expose another employee’s events to an employee caller, and the service-role Supabase key remains backend-only. The branch should be merged through PR #5 after the repository’s external upstream workflows are green or their infrastructure failures have been separately acknowledged.
