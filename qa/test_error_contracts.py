from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from fastapi import HTTPException
from app.api.routes.dayflow import LeaveCreate, create_leave

def test_invalid_leave_returns_422():
    try:
        create_leave(LeaveCreate(leave_type="paid", start_date="2026-08-30", end_date="2026-08-29"))
    except HTTPException as error:
        assert error.status_code == 422
    else:
        raise AssertionError("invalid leave was accepted")
