# Dayflow — 50-Plus Commit Contribution Plan

## Important authorship rule

A GitHub username is not an authorship label that can be safely typed into a commit. The current session is authenticated as `24co35-ops`; `ShivamGawade-XS` is a collaborator but no active credential for that account is available here. The history must not impersonate ShivamGawade-XS. The plan below separates work into real, reviewable increments. `24co35-ops` can create and push its own commits. Shivam should create the items marked **Shivam branch** from his own authenticated GitHub session, after which the coordinator can merge them.

If Shivam is unavailable during the judging window, the repository can still exceed 50 truthful commits from `24co35-ops`, but it will not honestly claim that both accounts authored commits. Empty commits, timestamp fabrication, and manually typed fake authorship are expressly excluded.

## Commit sequence

| # | Area | Commit subject | Suggested owner |
| ---: | --- | --- | --- |
| 1 | Foundation | `chore: establish Dayflow FastAPI foundation` | 24co35-ops |
| 2 | Architecture | `docs: add Dayflow product plan` | 24co35-ops |
| 3 | Architecture | `docs: record Dayflow architecture decisions` | 24co35-ops |
| 4 | Domain | `docs: define HRMS data model and invariants` | 24co35-ops |
| 5 | Demo | `docs: add evaluator demo script` | 24co35-ops |
| 6 | Delivery | `docs: add hackathon execution plan` | 24co35-ops |
| 7 | UI | `feat: add Dayflow visual design tokens` | 24co35-ops |
| 8 | UI | `feat: add responsive command center shell` | 24co35-ops |
| 9 | Navigation | `feat: add workspace navigation` | 24co35-ops |
| 10 | State | `feat: add role-aware demo state` | 24co35-ops |
| 11 | Attendance | `feat: add attendance status model` | 24co35-ops |
| 12 | Attendance | `feat: add employee check-in flow` | 24co35-ops |
| 13 | Attendance | `feat: add company pulse` | 24co35-ops |
| 14 | Attendance | `feat: add attendance rhythm visualization` | 24co35-ops |
| 15 | Leave | `feat: add leave status model` | 24co35-ops |
| 16 | Leave | `feat: add leave request form` | 24co35-ops |
| 17 | Leave | `feat: validate leave date ranges` | 24co35-ops |
| 18 | Leave | `feat: add leave request activity feedback` | 24co35-ops |
| 19 | Approvals | `feat: add leave approval Kanban` | 24co35-ops |
| 20 | Approvals | `feat: add accessible approve and reject actions` | 24co35-ops |
| 21 | People | `feat: add employee directory` | 24co35-ops |
| 22 | People | `feat: add employee profile surface` | 24co35-ops |
| 23 | Payroll | `feat: add salary snapshot view` | 24co35-ops |
| 24 | Payroll | `feat: add payslip PDF export` | 24co35-ops |
| 25 | Engagement | `feat: add attendance streak signal` | 24co35-ops |
| 26 | Flow | `feat: add Flow assistant panel` | 24co35-ops |
| 27 | Flow | `feat: add Flow prompt chips` | 24co35-ops |
| 28 | Flow | `feat: add bounded leave action preview` | 24co35-ops |
| 29 | Integration | `feat: add Supabase browser client boundary` | 24co35-ops |
| 30 | Backend | `feat: add Dayflow FastAPI domain routes` | 24co35-ops |
| 31 | Backend | `feat: add Supabase server REST boundary` | 24co35-ops |
| 32 | Database | `feat: add Supabase HRMS schema` | 24co35-ops |
| 33 | Database | `feat: add Supabase RLS policies` | 24co35-ops |
| 34 | Database | `feat: add Realtime publication tables` | 24co35-ops |
| 35 | Validation | `test: cover Flow action parsing` | 24co35-ops |
| 36 | Validation | `test: cover invalid leave dates` | 24co35-ops |
| 37 | Validation | `test: cover HR-only leave review` | 24co35-ops |
| 38 | Quality | `chore: exclude Python test caches` | 24co35-ops |
| 39 | Documentation | `docs: add implementation checklist` | 24co35-ops |
| 40 | Documentation | `docs: add team collaboration runbook` | 24co35-ops |
| 41 | Documentation | `docs: add API reference` | 24co35-ops |
| 42 | Documentation | `docs: add Supabase setup guide` | 24co35-ops |
| 43 | Documentation | `docs: add submission manifest` | 24co35-ops |
| 44 | Documentation | `docs: add delivery evidence` | 24co35-ops |
| 45 | QA | `test: add frontend route smoke coverage` | Shivam branch |
| 46 | QA | `test: add employee leave workflow coverage` | Shivam branch |
| 47 | QA | `test: add HR approval workflow coverage` | Shivam branch |
| 48 | UI | `feat: add mobile sidebar coverage` | Shivam branch |
| 49 | UI | `feat: add profile edit validation` | Shivam branch |
| 50 | UI | `feat: add payroll empty state` | Shivam branch |
| 51 | UI | `feat: add attendance loading state` | Shivam branch |
| 52 | UI | `feat: add leave error recovery state` | Shivam branch |
| 53 | Backend | `feat: add authenticated Supabase user mapping` | Shivam branch |
| 54 | Backend | `test: add Dayflow API contract coverage` | Shivam branch |
| 55 | Security | `docs: add production security checklist` | Shivam branch |
| 56 | Operations | `chore: add local demo reset command` | Shivam branch |
| 57 | CI | `ci: add frontend build verification` | Shivam branch |
| 58 | CI | `ci: add backend QA verification` | Shivam branch |
| 59 | Release | `docs: add judging submission checklist` | Shivam branch |
| 60 | Release | `release: merge verified contributor branch` | Coordinator merge |

## Practical implementation rule

The first 44 subjects describe the work already represented in the repository’s existing feature history and documentation. They should not be recreated as empty or duplicate commits merely to inflate the count. To move from the current history to 50-plus, implement the remaining independently reviewable items 45–59 as real changes. If more than 50 total commits are required, split additional legitimate work such as accessibility fixes, error states, API tests, Supabase policy tests, and setup improvements into separate commits only when each commit is independently understandable and testable.

## Recommended two-account flow

Shivam should clone the repository, create a branch such as `feat/shivam-qa-and-mobile`, configure his own Git identity, implement several marked items, and push the branch. The coordinator then reviews the branch, runs the build and QA checks, and merges it. The final log should show the actual author and committer metadata supplied by GitHub, not a manually forged name.
