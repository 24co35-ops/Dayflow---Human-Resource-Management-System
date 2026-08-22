# Dayflow — Team Runbook

## Collaboration model

The coordinator integrates into `main`; each teammate works on one feature branch and owns one visible contribution. Branch names should describe the work: `feat/attendance-pulse`, `feat/leave-kanban`, `feat/flow-assistant`, or `feat/payroll-payslip`. A pull request is preferred for each major feature because the evaluator’s brief explicitly values version control and shared contribution.

## Commit standard

Every commit should answer what changed and why. Use prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `chore:`, and `release:`. Keep a commit focused, run the relevant check, and avoid generated caches, secrets, or unrelated template changes. The planned in-window milestones are listed in `docs/EXECUTION_PLAN_2026-08-22.md`.

## GitHub authorship constraint

The current session is authenticated as `24co35-ops` with admin permission on the target repository. The named `ShivamGawade-XS` account is a collaborator but no usable session token for that identity is available in this environment. Git commits therefore must not impersonate ShivamGawade-XS. For a genuine two-account history, Shivam should push at least one feature branch from his own GitHub session, after which the coordinator can merge it. If that is not possible during the judging window, keep the authored history truthful and show the collaborator list plus branch/PR evidence instead of fabricating authorship.

## Review checklist for every merge

The reviewer confirms that the feature is reachable from the sidebar, has loading/empty/error behavior where relevant, has keyboard-reachable actions, does not expose private salary data to employee view, validates user input, and does not require a network-only dependency for the primary demo. The reviewer runs the smallest relevant command and records the result in the PR description or commit body.

## Demo reset

Before recording, refresh the page, set Employee view, open Flow, confirm the sick-leave request once, switch to HR view, open the leave Kanban, approve the request, open Attendance, and generate the payslip. If the browser state is dirty, use a new private window or clear site storage; do not reset production data because the hackathon demo uses the local seeded adapter.
