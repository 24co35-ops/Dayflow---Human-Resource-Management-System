# Dayflow SaaS Upgrade Notes

## Product surface

Dayflow now presents a SaaS-style HR workspace rather than a collection of disconnected screens. The Overview workspace includes a command-center hero, API-aware KPI cards, workspace health progress, quick actions, approval attention, activity stream, and a responsive action guide. HR users see people and approval operations; employees see their workday, leave, attendance, and profile actions.

The shared shell now includes responsive workspace navigation, a searchable command palette, keyboard shortcut support with `Cmd/Ctrl + K`, a notification center, profile actions, Settings navigation, and logout behavior. Search results navigate through the existing hash-based workspace routes without creating duplicate page routes.

## Truthful data behavior

When `VITE_DAYFLOW_API_ENABLED=true`, the Overview derives people count, present-today count, pending approvals, leave balance, activity, and workspace health from the Dayflow API where those signals are available. When the API is disabled, the interface uses intentionally labeled local fixtures. The Overview explicitly displays `Local demo mode · no data is persisted` and uses `Demo` rather than `Live` for workspace synchronization.

The notification center and fallback activity feed are presentation fixtures until a durable notification model is added. They are not claims of production push notifications, email delivery, or realtime subscriptions.

## Validation evidence

The SaaS upgrade was validated with the existing QA suite, backend compilation, frontend TypeScript/Vite production build, dependency lockfile consistency checks, and `git diff --check`. Browser smoke verification covered the Overview workspace, command palette, notification center, responsive layout, and the corrected fallback activity timestamps.

## Deliberate next steps for production SaaS

A production SaaS rollout still requires verified Supabase/JWT session enforcement, tenant and organization isolation, durable notification storage and delivery, realtime subscriptions, server-backed audit logs, invite and onboarding workflows, billing/plan enforcement, and deployment of the FastAPI backend with configured secrets. Those items are intentionally not represented as complete by the current demo workspace.
