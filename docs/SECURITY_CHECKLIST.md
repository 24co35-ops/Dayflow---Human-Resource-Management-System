# Dayflow — Production Security Checklist

Dayflow handles employee profile, attendance, leave, and salary information. The hackathon build uses synthetic demo data, but the production boundary must treat salary and private profile fields as sensitive information.

| Control | Required implementation | Verification |
| --- | --- | --- |
| Authentication | Validate Supabase JWTs in FastAPI and map `auth.uid()` to one profile | Expired and malformed tokens return `401` |
| Authorization | Enforce employee ownership and HR/Admin privileges server-side | Direct API calls cannot bypass role rules |
| Salary privacy | Return salary structures only to the subject employee or HR/Admin | Cross-employee salary read test returns `403` |
| Service-role key | Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only | Search frontend build and source for the secret name |
| Row-level security | Enable RLS on every Supabase table and test policies | Policy tests cover self, peer, and HR access |
| AI minimization | Send only fields needed for the user’s question to Flow | Prompt logs contain no secrets or unnecessary private data |
| Auditability | Record leave review, salary change, and payslip events | Activity feed includes actor and timestamp |
| Input safety | Validate dates, enumerations, lengths, and numeric ranges | Invalid payloads return `422` with safe messages |
| Synthetic demo data | Use fictional names, emails, and salary values | No real personal or banking data is committed |

The demo mode is a reliability fallback, not a security bypass. When cloud credentials are configured, the application must prefer authenticated profile resolution and Supabase policies over client-controlled role parameters.
