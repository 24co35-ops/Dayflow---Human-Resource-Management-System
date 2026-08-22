# Dayflow Authentication Model

Supabase Auth is the production identity boundary. FastAPI verifies the access token, maps the subject to a profile, and applies role and ownership checks. The offline demo mode is explicitly labelled and uses fictional role switching for judging only. Client-controlled role parameters must never replace server-side token claims in production.
