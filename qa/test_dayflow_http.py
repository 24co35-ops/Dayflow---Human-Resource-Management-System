import sys
from datetime import date, datetime, timezone
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))

from app.api.routes import dayflow  # noqa: E402


app_for_tests = FastAPI()
app_for_tests.include_router(dayflow.router, prefix="/api/v1")


@pytest.fixture
def client() -> TestClient:
    return TestClient(app_for_tests)


def test_http_unknown_profile_is_not_replaced(client: TestClient) -> None:
    response = client.get(
        "/api/v1/dayflow/attendance",
        params={"role": "employee", "profile_id": "not-a-profile"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found"


def test_http_employee_cannot_review_leave(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/dayflow/leave-requests/leave-001",
        params={"role": "employee"},
        json={"status": "approved"},
    )
    assert response.status_code == 403


def test_http_check_out_requires_check_in(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(dayflow, "attendance", [])
    response = client.post(
        "/api/v1/dayflow/attendance/check-out",
        params={"profile_id": "emp-001"},
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Check in before checking out"


def test_http_check_in_then_check_out_is_idempotent(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    check_in_at = datetime.now(timezone.utc)
    record = dayflow.Attendance(
        id="att-http",
        profile_id="emp-001",
        attendance_date=date.today(),
        status="present",
        check_in_at=check_in_at,
    )
    monkeypatch.setattr(dayflow, "attendance", [record])
    first = client.post(
        "/api/v1/dayflow/attendance/check-out",
        params={"profile_id": "emp-001"},
    )
    second = client.post(
        "/api/v1/dayflow/attendance/check-out",
        params={"profile_id": "emp-001"},
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["id"] == "att-http"


def test_http_leave_overlap_is_rejected(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    existing = dayflow.LeaveRequest(
        id="leave-http",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=date(2026, 8, 20),
        end_date=date(2026, 8, 22),
        days=3,
    )
    monkeypatch.setattr(dayflow, "leave_requests", [existing])
    response = client.post(
        "/api/v1/dayflow/leave-requests",
        params={"profile_id": "emp-001"},
        json={
            "leave_type": "sick",
            "start_date": "2026-08-21",
            "end_date": "2026-08-21",
            "remarks": "Overlap regression test",
        },
    )
    assert response.status_code == 409
    assert "overlap" in response.json()["detail"].lower()
