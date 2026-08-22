import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from app.api.routes.dayflow import (  # noqa: E402
    DemoActor,
    FlowMessage,
    LeaveCreate,
    LeaveReview,
    create_leave,
    flow_message,
    get_attendance,
    review_leave,
)

EMPLOYEE_ACTOR = DemoActor(role="employee", profile_id="emp-001")
HR_ACTOR = DemoActor(role="hr", profile_id="hr-001")


def test_flow_drafts_known_leave_action() -> None:
    response = flow_message(
        FlowMessage(message="I need two days of sick leave"), actor=EMPLOYEE_ACTOR
    )
    assert response.action is not None
    assert response.action["action"] == "apply_leave"
    assert response.action["data"]["leave_type"] == "sick"


def test_leave_dates_cannot_run_backwards() -> None:
    payload = LeaveCreate(
        leave_type="paid", start_date="2026-08-28", end_date="2026-08-27"
    )
    with pytest.raises(HTTPException) as error:
        create_leave(payload, actor=EMPLOYEE_ACTOR)
    assert error.value.status_code == 422


def test_employee_cannot_review_leave() -> None:
    with pytest.raises(HTTPException) as error:
        review_leave(
            "leave-001",
            LeaveReview(status="approved"),
            actor=EMPLOYEE_ACTOR,
        )
    assert error.value.status_code == 403


def test_unknown_profile_is_not_silently_replaced() -> None:
    with pytest.raises(HTTPException) as error:
        get_attendance(actor=DemoActor(role="employee", profile_id="missing-profile"))
    assert error.value.status_code == 404


def test_check_out_calculates_worked_minutes(monkeypatch: pytest.MonkeyPatch) -> None:
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
    result = dayflow.check_out(actor=EMPLOYEE_ACTOR)
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
            ),
            actor=EMPLOYEE_ACTOR,
        )
    assert error.value.status_code == 409


def test_rejection_requires_a_comment() -> None:
    with pytest.raises(HTTPException) as error:
        review_leave(
            "leave-001",
            LeaveReview(status="rejected"),
            actor=HR_ACTOR,
        )
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
            actor=HR_ACTOR,
        )
    assert error.value.status_code == 409


def test_supabase_profile_policy_blocks_role_escalation() -> None:
    migration = (
        Path(__file__).parents[1]
        / "supabase"
        / "migrations"
        / "202608220001_dayflow_schema.sql"
    ).read_text()
    assert 'create policy "profile self update"' not in migration
    assert 'create policy "profile self update safe"' in migration
    assert "prevent_profile_privilege_escalation" in migration
    assert "new.role is distinct from old.role" in migration


def test_demo_state_round_trips_to_disk(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    import app.api.routes.dayflow as dayflow

    monkeypatch.setenv("DAYFLOW_DEMO_MODE", "true")
    monkeypatch.setenv("DAYFLOW_PERSIST_DEMO_STATE", "true")
    monkeypatch.setenv("DAYFLOW_STATE_FILE", str(tmp_path / "state.json"))
    record = dayflow.Attendance(
        id="att-round-trip",
        profile_id="emp-001",
        attendance_date=dayflow.date.today(),
        status="present",
        worked_minutes=123,
    )
    request = dayflow.LeaveRequest(
        id="leave-round-trip",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=dayflow.date(2026, 9, 1),
        end_date=dayflow.date(2026, 9, 1),
        days=1,
    )
    monkeypatch.setattr(dayflow, "attendance", [record])
    monkeypatch.setattr(dayflow, "leave_requests", [request])
    monkeypatch.setattr(dayflow, "activity_events", [])
    dayflow._persist_state()
    dayflow.attendance.clear()
    dayflow.leave_requests.clear()
    dayflow._restore_state()
    assert dayflow.attendance[0].id == "att-round-trip"
    assert dayflow.leave_requests[0].id == "leave-round-trip"


def test_hr_provisioning_generates_collision_safe_login_id(monkeypatch: pytest.MonkeyPatch) -> None:
    import app.api.routes.dayflow as dayflow

    monkeypatch.setattr(
        dayflow,
        "profiles",
        [
            dayflow.Profile(
                id="emp-existing",
                employee_code="OIJODO20220001",
                full_name="John Doe",
                email="john@example.test",
                role="employee",
                department="Engineering",
                job_position="Developer",
                joining_year=2022,
            )
        ],
    )
    provisioned = dayflow.create_person(
        dayflow.EmployeeCreate(
            full_name="John Doe",
            email="new-john@example.test",
            department="Engineering",
            job_position="Senior Developer",
            joining_year=2022,
        ),
        actor=HR_ACTOR,
    )
    assert provisioned.employee_code == "OIJODO20220002"
    assert provisioned.temporary_password == "Dayflow-0002!"


def test_employee_can_only_read_own_profile() -> None:
    import app.api.routes.dayflow as dayflow

    with pytest.raises(HTTPException) as error:
        dayflow.get_person("emp-002", actor=EMPLOYEE_ACTOR)
    assert error.value.status_code == 403

    own_profile = dayflow.get_person("emp-001", actor=EMPLOYEE_ACTOR)
    assert own_profile.employee_code == "EMP-042"


def test_leave_attachment_size_requires_a_filename() -> None:
    with pytest.raises(ValueError, match="Attachment name is required"):
        LeaveCreate(
            leave_type="sick",
            start_date="2026-08-28",
            end_date="2026-08-28",
            attachment_size=1200,
        )


def test_payroll_counts_only_cross_month_leave_days(monkeypatch: pytest.MonkeyPatch) -> None:
    import app.api.routes.dayflow as dayflow
    from datetime import timedelta

    today = dayflow.date.today()
    period_start = today.replace(day=1)
    period_end = (period_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    next_month_start = period_end + timedelta(days=1)
    cross_month_leave = dayflow.LeaveRequest(
        id="leave-cross-month",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=period_end,
        end_date=next_month_start,
        days=2,
        status="approved",
    )
    monkeypatch.setattr(dayflow, "attendance", [])
    monkeypatch.setattr(dayflow, "leave_requests", [cross_month_leave])

    payable_days, scheduled_days = dayflow._payroll_days("emp-001")

    assert scheduled_days == 22
    assert payable_days == 1
