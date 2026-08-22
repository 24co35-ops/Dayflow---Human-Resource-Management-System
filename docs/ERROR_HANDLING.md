# Dayflow Error Handling

`401` means the session is missing or expired, `403` means ownership or role access failed, `404` means the resource is absent, and `422` means the input is invalid. The UI preserves form input when possible, explains the next correction, and shows an offline fallback for enhancement-layer failures. Errors should never expose stack traces or secrets.
