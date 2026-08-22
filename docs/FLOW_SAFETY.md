# Dayflow Flow Safety

Flow is a conversational accelerator, not an authorization system. Model output may return only an allow-listed action such as `apply_leave`, `check_in`, or `check_out`. The UI shows a confirmation preview, and FastAPI validates the action again. Flow cannot execute arbitrary SQL, expose another employee’s salary, approve its own request, or bypass RLS.
