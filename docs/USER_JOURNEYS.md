# Dayflow — User Journeys

## Employee journey

An employee opens Dayflow and immediately sees today’s attendance state, leave balance, streak, and next payday. The primary action is either Check in or continue the workday. Flow provides a conversational shortcut for questions and can draft a leave request, but the employee confirms the request before it is submitted. The employee can then see the request status and later the approved result without navigating through administrative screens.

## HR journey

HR opens the same product and receives a command-center view: people present, pending approvals, attendance signal, and team pulse. A new leave request is visible in the approval queue and can be approved or rejected from the Kanban. HR can ask Flow an attendance question, open the filtered people directory, inspect salary snapshots, and generate a payslip artifact. Every high-impact change leaves an activity signal.

## Failure journey

If Supabase is unavailable, the header clearly labels offline demo mode and the seeded workflow remains usable. If an AI provider is unavailable, prompt chips provide deterministic answers and action previews. If drag-and-drop is unavailable, approve and reject buttons remain accessible. A user should never be blocked from completing the core workday loop because an enhancement layer is down.
