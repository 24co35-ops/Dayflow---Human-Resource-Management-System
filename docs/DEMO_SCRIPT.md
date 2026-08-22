# Dayflow — Five-Minute Demo Script

## Opening: establish the problem (0:00–0:30)

Open the sign-in screen and select the seeded Employee demo. Say: “Dayflow is an HR operating layer for the workday. Employees should not have to hunt through menus to answer simple HR questions, and HR should not have to wait for spreadsheets to understand what is happening right now.” Land on the employee dashboard and point to today’s status, attendance streak, leave balance, and recent activity.

## Flow turns a sentence into a workflow (0:30–1:30)

Open the Flow assistant and type: **“I need two days off next Friday and Monday because I am sick.”** Flow responds with a concise summary and a draft Sick Leave action. Show the structured confirmation card with dates, type, and remarks. Confirm the action. The request appears immediately in My Leave with Pending status. Say: “The assistant is not replacing approval; it removes the form-filling friction and leaves the decision auditable.”

If the model is unavailable, use the deterministic demo prompt chip **Draft sick leave**. The same action preview and backend mutation should run through the local adapter.

## The Company Pulse is alive (1:30–2:30)

Switch to the Admin demo from the role switcher. The admin dashboard shows the Company Pulse: green present employees, a yellow late employee, an airplane for approved leave, and a not-yet-checked-in state. The pending leave card for the employee appears in the Pending Kanban column without a manual refresh. Say: “This is the difference between a database view and an operating system. The team can see the next decision as soon as it exists.”

Drag or use the Approve action on the leave card. The card moves to Approved and the activity feed records the reviewer and time. Switch back to the employee view and show the status as Approved.

## Ask the team, not a table (2:30–3:30)

In the admin Flow assistant, type: **“Who has been absent most this week?”** Show a ranked answer with names, counts, and a link to the filtered attendance view. Explain that Flow uses the same live attendance data already displayed in the dashboard and that its actions are bounded by the user’s role.

## Make the output tangible (3:30–4:30)

Open Payroll, select the fictional employee, and click Generate Payslip. Show the salary components, deductions, payable days, and net salary. Download the PDF and briefly display the branded document. Open the employee profile and point to the attendance streak: **23-day streak — keep it up**. Say: “The product ends in an artifact someone can actually use, not just another status change.”

## Close with proof (4:30–5:00)

Return to the Flow assistant and say: “Dayflow keeps every workday aligned: one conversation for the employee, one live pulse for HR, and one accountable workflow underneath.” Show the GitHub history with meaningful commits from the configured contributor identities, the README, architecture diagram, and test status. End on the Dayflow wordmark and tagline.

## Judge questions to anticipate

| Question | Answer |
| --- | --- |
| Is this only a frontend mock? | No. The UI calls typed FastAPI endpoints, applies real validation, mutates shared state, and has a Supabase adapter boundary plus an offline seeded mode for resilient judging. |
| Can AI approve leave by itself? | No. Flow can draft or submit an employee request, but Admin/HR approval remains a distinct human-controlled transition. |
| What happens without internet? | The seeded demo adapter keeps the core workflow usable locally; Supabase and AI are enhancement layers activated by environment configuration. |
| How are roles enforced? | The UI hides irrelevant controls, while FastAPI and the data policy layer enforce role and employee ownership on every privileged operation. |
| What would you build next? | Email notifications, configurable leave policies, richer payroll/tax rules, document storage, audit exports, and mobile-friendly check-in with the same domain contracts. |

## Demo safety checklist

Before recording, seed the two demo identities, verify the leave card is Pending, verify one payslip can be generated, check that the Flow prompt chip works without a model, close unrelated browser tabs, and prepare a one-sentence fallback for each network-dependent feature. Never expose secrets, real employee data, or the Supabase service-role key on screen.
