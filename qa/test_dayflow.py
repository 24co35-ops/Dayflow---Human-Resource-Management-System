import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from app.api.routes.dayflow import (  # noqa: E402
    FlowMessage,
    LeaveCreate,
    LeaveReview,
    create_leave,
    flow_message,
    review_leave,
)


def test_flow_drafts_known_leave_action() -> None:
    response = flow_message(FlowMessage(message="I need two days of sick leave"))
    assert response.action is not None
    assert response.action["action"] == "apply_leave"
    assert response.action["data"]["leave_type"] == "sick"


def test_leave_dates_cannot_run_backwards() -> None:
    payload = LeaveCreate(leave_type="paid", start_date="2026-08-28", end_date="2026-08-27")
    with pytest.raises(HTTPException) as error:
        create_leave(payload)
    assert error.value.status_code == 422


def test_employee_cannot_review_leave() -> None:
    with pytest.raises(HTTPException) as error:
        review_leave("leave-001", LeaveReview(status="approved"), role="employee")
    assert error.value.status_code == 403
