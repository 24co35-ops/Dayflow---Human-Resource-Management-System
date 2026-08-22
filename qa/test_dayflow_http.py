import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

os.environ.setdefault("DAYFLOW_DEMO_MODE", "true")

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


def test_http_query_profile_cannot_change_actor_scope(client: TestClient) -> None:
    response = client.get(
        "/api/v1/dayflow/attendance",
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
        params={"role": "hr", "profile_id": "not-a-profile"},
    )
    assert response.status_code == 200
    assert all(item["profile_id"] == "emp-001" for item in response.json())


def test_http_unknown_actor_profile_is_rejected(client: TestClient) -> None:
    response = client.get(
        "/api/v1/dayflow/attendance",
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "not-a-profile",
        },
    )
    assert response.status_code == 403


def test_http_employee_cannot_review_leave(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/dayflow/leave-requests/leave-001",
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
        params={"role": "hr"},
        json={"status": "approved"},
    )
    assert response.status_code == 403


def test_http_check_out_requires_check_in(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(dayflow, "attendance", [])
    response = client.post(
        "/api/v1/dayflow/attendance/check-out",
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
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
    actor_headers = {
        "X-Dayflow-Demo-Role": "employee",
        "X-Dayflow-Demo-Profile-Id": "emp-001",
    }
    first = client.post(
        "/api/v1/dayflow/attendance/check-out",
        headers=actor_headers,
        params={"profile_id": "emp-001"},
    )
    second = client.post(
        "/api/v1/dayflow/attendance/check-out",
        headers=actor_headers,
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
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
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


def test_http_payroll_is_actor_scoped(client: TestClient) -> None:
    employee_response = client.get(
        "/api/v1/dayflow/payroll",
        headers={
            "X-Dayflow-Demo-Role": "employee",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
        params={"profile_id": "emp-002"},
    )
    assert employee_response.status_code == 200
    assert [item["profile_id"] for item in employee_response.json()] == ["emp-001"]

    hr_response = client.get(
        "/api/v1/dayflow/payroll",
        headers={
            "X-Dayflow-Demo-Role": "hr",
            "X-Dayflow-Demo-Profile-Id": "hr-001",
        },
    )
    assert hr_response.status_code == 200
    assert len(hr_response.json()) == 4


def test_http_requires_explicit_demo_actor(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("DAYFLOW_DEMO_MODE", raising=False)
    response = client.get("/api/v1/dayflow/me")
    assert response.status_code == 401


def test_http_rejects_role_profile_mismatch(client: TestClient) -> None:
    response = client.get(
        "/api/v1/dayflow/me",
        headers={
            "X-Dayflow-Demo-Role": "hr",
            "X-Dayflow-Demo-Profile-Id": "emp-001",
        },
    )
    assert response.status_code == 403
