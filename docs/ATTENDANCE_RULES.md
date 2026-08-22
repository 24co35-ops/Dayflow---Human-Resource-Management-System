# Dayflow Attendance Rules

One attendance record exists per profile and date. Check-in is idempotent, check-out closes the open record, and worked minutes are derived from UTC timestamps. Present, Absent, Half-day, and Leave are explicit states. HR can read team attendance; employees can read only their own records. Attendance is an input to payable-day calculation.
