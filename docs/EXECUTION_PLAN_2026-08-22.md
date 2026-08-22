# Dayflow — Execution Plan for 22 August 2026

## Working window

The requested focused window is **10:30 AM–3:30 PM IST on 22 August 2026**. The official event notes in the supplied brief list a broader 9:00 AM–5:00 PM coding window, with repository/evaluator actions earlier in the day. The schedule below treats 10:30 AM–3:30 PM as the build sprint and reserves the remaining event time for rehearsal, recording, and submission.

| Time (IST) | Workstream | Definition of done | Commit checkpoint |
| --- | --- | --- | --- |
| 10:30–10:45 | Foundation | Base template copied, env examples present, app boots locally | `chore: establish Dayflow FastAPI foundation` |
| 10:45–11:15 | Product shell | Dayflow theme, sidebar, route map, role switcher, seeded adapter | `feat: add Dayflow shell and demo identities` |
| 11:15–11:50 | Attendance | Check-in/out, daily/weekly view, status badges, pulse data | `feat: add attendance tracking and company pulse` |
| 11:50–12:25 | Leave workflow | Apply form, validation, Kanban, approve/reject transition | `feat: add leave workflow and approval board` |
| 12:25–12:40 | Sync break | Team confirms demo path, secrets, and branch/author map | `docs: align team runbook and demo data` |
| 12:40–1:30 | Flow | Chat surface, prompt chips, bounded action preview, live-data answers | `feat: add Flow HR companion workflow` |
| 1:30–2:10 | Payroll | Salary cards, component math, payslip PDF artifact | `feat: add payroll summaries and payslip export` |
| 2:10–2:40 | Profiles and polish | Profile sections, streak, responsive states, accessible focus/keyboard behavior | `feat: polish profiles, streaks, and responsive states` |
| 2:40–3:00 | Verification | Typecheck, tests, build, demo reset script, no secrets tracked | `test: verify demo-critical workflows` |
| 3:00–3:20 | Documentation | README, setup, architecture, data model, demo script, screenshots if available | `docs: finalize hackathon submission package` |
| 3:20–3:30 | Final handoff | Push main, inspect commit history, record exact SHA and remote URL | `release: prepare Dayflow hackathon handoff` |

## Team operating protocol

Each contributor should work from a short-lived branch named for the feature, keep commits focused, and rebase or merge only after the local build passes. The coordinator owns `main` and integration. The second contributor should own an independent feature branch and appear as the actual Git author; the integration commit should preserve co-author trailers when the work was performed together. Do not create empty commits or artificial noise. A reviewer should inspect the diff and run the critical path after every major checkpoint.

The current authenticated GitHub session has administrative permission on `24co35-ops/Dayflow---Human-Resource-Management-System` and recognizes `ShivamGawade-XS` as a collaborator. It does not expose a second login token for ShivamGawade-XS, so commits must not impersonate that account. If the team needs GitHub to display both accounts as commit authors, Shivam must commit from his own credentials or provide a valid collaborator-authenticated workflow. The repository itself can still visibly demonstrate multi-contributor work through genuine author identities and co-author trailers.

## Risk controls

If Supabase configuration is missing, the seeded local adapter must remain the default and the UI must label the mode clearly. If the AI model is unavailable, Flow prompt chips must produce deterministic answers and structured demo actions. If drag-and-drop is unstable on a touch device, each Kanban card must also expose an accessible Approve or Reject button. If PDF generation fails, display the payslip preview and expose a print-friendly fallback. No optional enhancement may block the attendance, leave, or payroll demo path.

## Final verification commands

```bash
cd /home/ubuntu/Dayflow---Human-Resource-Management-System
# frontend
cd frontend && pnpm install --frozen-lockfile=false && pnpm build
# backend
cd ../backend && uv run pytest
# repository hygiene
cd .. && git status --short && git log --date=iso --format='%h %ad %an <%ae> %s' -n 12
```

## Submission assets

The final repository should contain a clean README with setup and demo credentials, the product plan, architecture decision record, data model, demo script, execution plan, a database/seed strategy, and a visible license/attribution note for reference repositories. Screenshots or a short demo video may be added only after the core path is stable.
