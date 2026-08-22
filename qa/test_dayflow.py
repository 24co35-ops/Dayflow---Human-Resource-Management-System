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


def test_unknown_profile_is_not_silently_replaced() -> None:
    from app.api.routes.dayflow import get_attendance

    with pytest.raises(HTTPException) as error:
        get_attendance(role="employee", profile_id="missing-profile")
    assert error.value.status_code == 404


def test_check_out_calculates_worked_minutes(monkeypatch: pytest.MonkeyPatch) -> None:
    from datetime import datetime, timezone

    import app.api.routes.dayflow as dayflow

    check_in_at = datetime.now(timezone.utc)
    record = dayflow.Attendance(
        id="att-test",
        profile_id="emp-001",
        attendance_date=dayflow.date.today(),
        status="present",
        check_in_at=check_in_at,
    )
    monkeypatch.setattr(dayflow, "attendance", [record])
    result = dayflow.check_out("emp-001")
    assert result.check_out_at is not None
    assert result.worked_minutes >= 0


def test_overlapping_leave_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    import app.api.routes.dayflow as dayflow

    existing = dayflow.LeaveRequest(
        id="leave-test",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=dayflow.date(2026, 8, 20),
        end_date=dayflow.date(2026, 8, 22),
        days=3,
    )
    monkeypatch.setattr(dayflow, "leave_requests", [existing])
    with pytest.raises(HTTPException) as error:
        dayflow.create_leave(
            LeaveCreate(
                leave_type="sick",
                start_date="2026-08-21",
                end_date="2026-08-21",
            )
        )
    assert error.value.status_code == 409


def test_rejection_requires_a_comment() -> None:
    with pytest.raises(HTTPException) as error:
        review_leave("leave-001", LeaveReview(status="rejected"), role="hr")
    assert error.value.status_code == 422


def test_non_pending_leave_cannot_be_reviewed(monkeypatch: pytest.MonkeyPatch) -> None:
    import app.api.routes.dayflow as dayflow

    approved = dayflow.LeaveRequest(
        id="leave-approved",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=dayflow.date(2026, 8, 20),
        end_date=dayflow.date(2026, 8, 21),
        days=2,
        status="approved",
    )
    monkeypatch.setattr(dayflow, "leave_requests", [approved])
    with pytest.raises(HTTPException) as error:
        dayflow.review_leave(
            "leave-approved",
            LeaveReview(status="rejected", review_comment="Changed plans"),
            role="hr",
        )
    assert error.value.status_code == 409
