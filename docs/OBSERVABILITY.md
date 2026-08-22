# Dayflow Observability

Production deployments should record request IDs, endpoint latency, Supabase error codes, realtime connection state, and the actor for every leave or payroll mutation. Never log access tokens, service-role keys, full salary records, or raw private profile payloads. The activity event table provides the product-facing audit trail; infrastructure logs provide operational diagnosis.
