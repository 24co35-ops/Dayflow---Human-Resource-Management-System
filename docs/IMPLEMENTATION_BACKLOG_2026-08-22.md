# Dayflow HRMS — Implementation Backlog

This backlog follows the brutal audit and separates trust-critical work from demo polish. Items are ordered by risk reduction and user value, not by implementation convenience.

| ID | Priority | Work package | Current flaw | Definition of done |
| --- | --- | --- | --- | --- |
| AUTH-01 | P0 | Derive actor from verified auth | Role and profile are caller-supplied query parameters | Every protected route derives actor and role server-side; employee access to another profile returns 403 or 404. |
| AUTH-02 | P0 | Lock profile role fields | Employee profile update can potentially change role | Self-service update cannot touch role, employee code, salary, or reviewer fields; HR/Admin role change uses a dedicated protected operation. |
| DATA-01 | P1 | Real persistence adapter | Dashboard uses React state and Python arrays | Reloading preserves attendance, leave, activity, and profile data through Supabase or a clearly selected fixture adapter. |
| DATA-02 | P1 | One DTO contract | UI types and API models are duplicated | Dashboard queries use generated/centralized Dayflow DTOs and contract tests exercise HTTP endpoints. |
| ATT-01 | P1 | Attendance state machine | Check-out is a UI toggle and worked time is not server-calculated | Check-in, check-out, idempotency, timezone boundaries, and worked-minute calculation are server-backed and tested. |
| LEAVE-01 | P1 | Leave policy service | Only date order is checked | Working days, weekends, holidays, overlap, balance, rejection comments, and valid state transitions are enforced. |
| LEAVE-02 | P1 | Transactional review | Review uses hardcoded reviewer and memory state | Reviewer identity and review timestamp are persisted with an atomic audit event. |
| PAY-01 | P1 | Server-owned payroll | Payslip values and PDF strings are fixed | Authorized user receives employee-specific server-calculated payslip data and the PDF is generated from that DTO. |
| FLOW-01 | P1 | Safe action bridge | Keyword matching creates a fixed sick-leave action | Flow produces a typed draft; confirmation revalidates actor and policy server-side and is idempotent. |
| AUDIT-01 | P1 | Append-only events | Activity trail disappears on restart | Business mutations and audit events are persisted together and read through an HR-scoped endpoint. |
| UX-01 | P1 | Session-derived shell | Header identity conflicts with dashboard identity | One current-user object drives greeting, avatar, role, and profile surfaces. |
| UX-02 | P1 | Honest connectivity states | “All systems live” only means a client object exists | Badge reports demo, syncing, live, or offline-with-last-sync based on actual data queries. |
| UX-03 | P2 | Router ownership | Hash mutation and TanStack Router coexist | Workspace navigation has one source of truth and supports refresh/deep links. |
| A11Y-01 | P2 | Accessible interaction audit | Custom dashboard lacks keyboard/focus/axe coverage | Flow, navigation, dialogs, icon buttons, status announcements, and responsive states pass accessibility checks. |
| QA-01 | P1 | Dayflow E2E suite | Upstream Playwright tests measure template flows | Employee check-in, leave request, HR approval, Flow confirmation, payroll access, and mobile nav run in deterministic demo mode. |
| OPS-01 | P2 | Release workflow | Scaffold workflows obscure Dayflow status | One Dayflow release pipeline runs migration checks, build, contract tests, security scan, and smoke tests. |
| OPS-02 | P2 | Demo reset | Local state and fixtures are difficult to reset consistently | One documented seed/reset command produces the same judge-ready data every time. |
| SEC-01 | P0 | Secret and placeholder gate | Placeholder credentials and local URLs remain easy to ship | Production startup rejects placeholders; secret scanning and environment checks run in CI. |

## Immediate implementation slice

The next high-value slice is intentionally small: remove arbitrary-profile fallback, add server-side invariants for the demo API, add a real check-out route, make leave review transitions explicit, and replace contradictory shell identity/date strings with a shared session/demo context. These changes improve truthfulness without pretending that the full Supabase data plane is already complete.

## Deferred work

Realtime subscriptions, payroll calculation, holiday calendars, mobile E2E coverage, and production migration promotion should follow after the actor context and persistence adapter are in place. Building these on top of caller-supplied roles or local arrays would create attractive but unsafe complexity.
