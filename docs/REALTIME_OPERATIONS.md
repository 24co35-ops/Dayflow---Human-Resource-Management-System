# Dayflow Realtime Operations

Company Pulse listens to attendance, leave, and activity events through Supabase Realtime. Events are normalized before entering the UI store so database payloads do not leak into presentation components. The connection state is visible, reconnection is safe, and the offline adapter emits the same shape after local mutations.
