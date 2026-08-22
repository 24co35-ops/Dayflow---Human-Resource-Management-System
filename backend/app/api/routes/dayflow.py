from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.dayflow_payroll import SalaryConfig, SalaryComponentConfig, calculate_salary

router = APIRouter(prefix="/dayflow", tags=["dayflow"])

Role = Literal["employee", "hr", "admin"]
LeaveStatus = Literal["pending", "approved", "rejected"]


class DemoActor(BaseModel):
    role: Role
    profile_id: str


def get_dayflow_actor(
    x_dayflow_demo_role: Role | None = Header(default=None),
    x_dayflow_demo_profile_id: str | None = Header(default=None),
) -> DemoActor:
    """Resolve the actor only for the explicit local demo adapter.

    Production deployments must replace this dependency with a verified JWT/session
    dependency. Query-string role/profile values are deliberately ignored here.
    """
    if os.getenv("DAYFLOW_DEMO_MODE", "false").lower() != "true":
        raise HTTPException(
            status_code=401,
            detail="Authenticated Dayflow actor required; demo actor headers are disabled",
        )
    if not x_dayflow_demo_role or not x_dayflow_demo_profile_id:
        raise HTTPException(status_code=401, detail="Dayflow demo actor headers are required")
    if x_dayflow_demo_role in ("hr", "admin") and x_dayflow_demo_profile_id != "hr-001":
        raise HTTPException(status_code=403, detail="Demo actor/profile mismatch")
    if x_dayflow_demo_role == "employee" and x_dayflow_demo_profile_id not in {
        "emp-001",
        "emp-002",
        "emp-003",
        "emp-004",
    }:
        raise HTTPException(status_code=403, detail="Demo actor/profile mismatch")
    return DemoActor(role=x_dayflow_demo_role, profile_id=x_dayflow_demo_profile_id)


class Profile(BaseModel):
    id: str
    employee_code: str
    full_name: str
    email: str
    role: Role
    department: str
    job_position: str
    location: str = "Bengaluru"
    phone: str = ""
    manager: str = ""
    joining_year: int = Field(default=2026, ge=2000, le=2100)


class EmployeeCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=160)
    department: str = Field(min_length=2, max_length=80)
    job_position: str = Field(min_length=2, max_length=120)
    joining_year: int = Field(default=2026, ge=2000, le=2100)
    phone: str = Field(default="", max_length=30)
    location: str = Field(default="Bengaluru", max_length=80)


class EmployeeProvisioned(Profile):
    temporary_password: str


class Attendance(BaseModel):
    id: str
    profile_id: str
    attendance_date: date
    status: Literal["present", "absent", "half_day", "leave"]
    check_in_at: datetime | None = None
    check_out_at: datetime | None = None
    worked_minutes: int = Field(default=0, ge=0)


class LeaveRequest(BaseModel):
    id: str
    profile_id: str
    employee_name: str
    leave_type: Literal["paid", "sick", "unpaid"]
    start_date: date
    end_date: date
    days: int = Field(gt=0)
    remarks: str = ""
    status: LeaveStatus = "pending"
    review_comment: str | None = None
    reviewer_id: str | None = None
    reviewed_at: datetime | None = None
    attachment_name: str | None = None
    attachment_size: int | None = None


class LeaveCreate(BaseModel):
    leave_type: Literal["paid", "sick", "unpaid"]
    start_date: date
    end_date: date
    remarks: str = Field(default="", max_length=500)
    attachment_name: str | None = Field(default=None, max_length=160)
    attachment_size: int | None = Field(default=None, ge=1, le=5_000_000)

    @model_validator(mode="after")
    def validate_attachment(self) -> LeaveCreate:
        if self.attachment_size is not None and not self.attachment_name:
            raise ValueError("Attachment name is required when attachment size is supplied")
        if self.attachment_name:
            extension = self.attachment_name.lower().rsplit(".", 1)[-1] if "." in self.attachment_name else ""
            if extension not in {"pdf", "png", "jpg", "jpeg"}:
                raise ValueError("Leave attachments must be PDF, PNG, JPG, or JPEG")
            if self.attachment_size is None:
                raise ValueError("Attachment size is required when a leave attachment is supplied")
        return self

    def validate_dates(self) -> None:
        if self.end_date < self.start_date:
            raise HTTPException(
                status_code=422,
                detail="End date must be on or after start date",
            )


class LeaveReview(BaseModel):
    status: Literal["approved", "rejected"]
    review_comment: str = Field(default="", max_length=500)


class FlowMessage(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class FlowResponse(BaseModel):
    answer: str
    action: dict[str, object] | None = None


class PayrollSnapshot(BaseModel):
    profile_id: str
    employee_name: str
    employee_code: str
    period_year: int
    period_month: int
    basic_salary: int
    hra_allowance: int
    standard_allowance: int
    performance_bonus: int
    deductions: int
    pf_contribution: int
    professional_tax: int
    leave_travel_allowance: int
    fixed_allowance: int
    gross_salary: int
    net_salary: int
    payable_days: int
    attendance_days: int


class ActivityEvent(BaseModel):
    id: str
    actor_id: str
    event_type: str
    entity_type: str
    entity_id: str
    message: str
    created_at: datetime


profiles = [
    Profile(
        id="emp-001",
        employee_code="EMP-042",
        full_name="Arjun Singh",
        email="arjun@dayflow.demo",
        role="employee",
        department="Engineering",
        job_position="Software Engineer",
    ),
    Profile(
        id="emp-002",
        employee_code="EMP-043",
        full_name="Priya Nair",
        email="priya@dayflow.demo",
        role="employee",
        department="Design",
        job_position="Product Designer",
    ),
    Profile(
        id="emp-003",
        employee_code="EMP-044",
        full_name="Rahul Mehta",
        email="rahul@dayflow.demo",
        role="employee",
        department="Product",
        job_position="Product Manager",
    ),
    Profile(
        id="emp-004",
        employee_code="EMP-045",
        full_name="Meera Joshi",
        email="meera@dayflow.demo",
        role="employee",
        department="Finance",
        job_position="Finance Associate",
    ),
]

attendance = [
    Attendance(
        id="att-001",
        profile_id="emp-001",
        attendance_date=date.today(),
        status="present",
        worked_minutes=492,
    ),
    Attendance(
        id="att-002",
        profile_id="emp-002",
        attendance_date=date.today(),
        status="present",
        worked_minutes=468,
    ),
    Attendance(
        id="att-003",
        profile_id="emp-003",
        attendance_date=date.today(),
        status="half_day",
        worked_minutes=238,
    ),
]

leave_requests = [
    LeaveRequest(
        id="leave-001",
        profile_id="emp-004",
        employee_name="Meera Joshi",
        leave_type="sick",
        start_date=date(2026, 8, 25),
        end_date=date(2026, 8, 26),
        days=2,
        remarks="Recovering from a fever",
    ),
    LeaveRequest(
        id="leave-002",
        profile_id="emp-001",
        employee_name="Arjun Singh",
        leave_type="paid",
        start_date=date(2026, 8, 20),
        end_date=date(2026, 8, 21),
        days=2,
        status="approved",
        reviewer_id="hr-001",
        reviewed_at=datetime(2026, 8, 19, 10, 0, tzinfo=timezone.utc),
    ),
]

activity_events: list[ActivityEvent] = []
seed_profiles = [item.model_copy(deep=True) for item in profiles]
seed_attendance = [item.model_copy(deep=True) for item in attendance]
seed_leave_requests = [item.model_copy(deep=True) for item in leave_requests]


salary_by_profile = {
    "emp-001": SalaryConfig(
        wage=50000,
        pf_rate=12,
        professional_tax=200,
        components=[
            SalaryComponentConfig(name="basic", computation_type="percentage", value=50, base="wage"),
            SalaryComponentConfig(name="hra", computation_type="percentage", value=50, base="basic"),
            SalaryComponentConfig(name="standard_allowance", computation_type="fixed", value=4167),
            SalaryComponentConfig(name="performance_bonus", computation_type="percentage", value=8.33, base="basic"),
            SalaryComponentConfig(name="leave_travel_allowance", computation_type="percentage", value=8.33, base="basic"),
            SalaryComponentConfig(name="fixed_allowance", computation_type="fixed", value=0),
        ],
    ),
    "emp-002": SalaryConfig(wage=60000, components=[
        SalaryComponentConfig(name="basic", computation_type="percentage", value=50),
        SalaryComponentConfig(name="hra", computation_type="percentage", value=50, base="basic"),
        SalaryComponentConfig(name="standard_allowance", computation_type="fixed", value=4167),
        SalaryComponentConfig(name="performance_bonus", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="leave_travel_allowance", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="fixed_allowance", computation_type="fixed", value=0),
    ]),
    "emp-003": SalaryConfig(wage=76000, components=[
        SalaryComponentConfig(name="basic", computation_type="percentage", value=50),
        SalaryComponentConfig(name="hra", computation_type="percentage", value=50, base="basic"),
        SalaryComponentConfig(name="standard_allowance", computation_type="fixed", value=4167),
        SalaryComponentConfig(name="performance_bonus", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="leave_travel_allowance", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="fixed_allowance", computation_type="fixed", value=0),
    ]),
    "emp-004": SalaryConfig(wage=42000, components=[
        SalaryComponentConfig(name="basic", computation_type="percentage", value=50),
        SalaryComponentConfig(name="hra", computation_type="percentage", value=50, base="basic"),
        SalaryComponentConfig(name="standard_allowance", computation_type="fixed", value=4167),
        SalaryComponentConfig(name="performance_bonus", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="leave_travel_allowance", computation_type="percentage", value=8.33, base="basic"),
        SalaryComponentConfig(name="fixed_allowance", computation_type="fixed", value=0),
    ]),
}


def _persistence_enabled() -> bool:
    return (
        os.getenv("DAYFLOW_DEMO_MODE", "false").lower() == "true"
        and os.getenv("DAYFLOW_PERSIST_DEMO_STATE", "false").lower() == "true"
    )


def _state_path() -> Path:
    return Path(os.getenv("DAYFLOW_STATE_FILE", "/tmp/dayflow-demo-state.json"))


def _persist_state() -> None:
    if not _persistence_enabled():
        return
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "profiles": [item.model_dump(mode="json") for item in profiles],
                "attendance": [item.model_dump(mode="json") for item in attendance],
                "leave_requests": [item.model_dump(mode="json") for item in leave_requests],
                "activity_events": [item.model_dump(mode="json") for item in activity_events],
            },
            indent=2,
        )
    )


def _restore_state() -> None:
    if not _persistence_enabled():
        return
    path = _state_path()
    if not path.exists():
        return
    try:
        payload = json.loads(path.read_text())
        profiles[:] = [Profile.model_validate(item) for item in payload["profiles"]]
        attendance[:] = [Attendance.model_validate(item) for item in payload["attendance"]]
        leave_requests[:] = [
            LeaveRequest.model_validate(item) for item in payload["leave_requests"]
        ]
        activity_events[:] = [
            ActivityEvent.model_validate(item) for item in payload["activity_events"]
        ]
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        # A corrupt demo file must not prevent the judge-facing app from starting.
        profiles[:] = [item.model_copy(deep=True) for item in seed_profiles]
        attendance[:] = [item.model_copy(deep=True) for item in seed_attendance]
        leave_requests[:] = [item.model_copy(deep=True) for item in seed_leave_requests]
        activity_events.clear()


def _reset_demo_state() -> None:
    profiles[:] = [item.model_copy(deep=True) for item in seed_profiles]
    attendance[:] = [item.model_copy(deep=True) for item in seed_attendance]
    leave_requests[:] = [item.model_copy(deep=True) for item in seed_leave_requests]
    activity_events.clear()
    _persist_state()


def _record(
    actor_id: str,
    event_type: str,
    entity_type: str,
    entity_id: str,
    message: str,
) -> None:
    activity_events.insert(
        0,
        ActivityEvent(
            id=f"event-{len(activity_events) + 1:03}",
            actor_id=actor_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
            created_at=datetime.now(timezone.utc),
        ),
    )
    _persist_state()


def _profile(profile_id: str) -> Profile:
    profile = next((item for item in profiles if item.id == profile_id), None)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _generated_employee_code(full_name: str, joining_year: int) -> str:
    parts = [part for part in re.split(r"\s+", full_name.strip().upper()) if part]
    first = (parts[0] if parts else "XX")[:2].ljust(2, "X")
    last = (parts[-1] if len(parts) > 1 else parts[0] if parts else "XX")[:2].ljust(2, "X")
    prefix = f"OI{first}{last}{joining_year}"
    serials = [
        int(match.group(1))
        for profile in profiles
        if (match := re.fullmatch(rf"{re.escape(prefix)}(\d{{4}})", profile.employee_code))
    ]
    return f"{prefix}{max(serials, default=0) + 1:04d}"


def _overlaps(left_start: date, left_end: date, right_start: date, right_end: date) -> bool:
    return left_start <= right_end and right_start <= left_end


def _leave_days_in_period(
    item: LeaveRequest, period_start: date, period_end: date
) -> int:
    overlap_start = max(item.start_date, period_start)
    overlap_end = min(item.end_date, period_end)
    return max(0, (overlap_end - overlap_start).days + 1)


def _payroll_days(profile_id: str) -> tuple[int, int]:
    period_year, period_month = date.today().year, date.today().month
    period_start = date(period_year, period_month, 1)
    period_end = (
        period_start.replace(day=28) + timedelta(days=4)
    ).replace(day=1) - timedelta(days=1)
    attended = sum(
        1 if item.status == "present" else 0.5
        for item in attendance
        if item.profile_id == profile_id
        and item.attendance_date.year == period_year
        and item.attendance_date.month == period_month
        and item.status in ("present", "half_day")
    )
    paid_leave = sum(
        _leave_days_in_period(item, period_start, period_end)
        for item in leave_requests
        if item.profile_id == profile_id
        and item.status == "approved"
        and item.leave_type != "unpaid"
        and _overlaps(item.start_date, item.end_date, period_start, period_end)
    )
    unpaid_leave = sum(
        _leave_days_in_period(item, period_start, period_end)
        for item in leave_requests
        if item.profile_id == profile_id
        and item.status == "approved"
        and item.leave_type == "unpaid"
        and _overlaps(item.start_date, item.end_date, period_start, period_end)
    )
    scheduled_days = 22
    payable_days = max(0, min(scheduled_days, round(attended + paid_leave - unpaid_leave)))
    return payable_days, scheduled_days


_restore_state()


@router.get("/me", response_model=Profile)
def get_me(actor: DemoActor = Depends(get_dayflow_actor)) -> Profile:
    """Return the actor-resolved identity while the explicit demo adapter is active."""
    if actor.role == "hr":
        return Profile(
            id="hr-001",
            employee_code="HR-001",
            full_name="Ashwith Shetty",
            email="ashwith@dayflow.demo",
            role="hr",
            department="People Ops",
            job_position="People Operations Lead",
        )
    return _profile(actor.profile_id)


@router.post("/demo/reset", response_model=dict[str, bool])
def reset_demo(actor: DemoActor = Depends(get_dayflow_actor)) -> dict[str, bool]:
    if actor.role not in ("hr", "admin"):
        raise HTTPException(status_code=403, detail="Only HR or Admin can reset demo state")
    _reset_demo_state()
    _record(actor.profile_id, "demo.reset", "demo", "seed", "Demo state reset to seed data")
    return {"ok": True}


@router.get("/dashboard")
def get_dashboard(
    actor: DemoActor = Depends(get_dayflow_actor),
) -> dict[str, object]:
    pending = sum(request.status == "pending" for request in leave_requests)
    return {
        "role": actor.role,
        "employee_count": len(profiles) + 1,
        "pending_leaves": pending,
        "present_today": sum(item.status == "present" for item in attendance),
        "absent_today": sum(item.status == "absent" for item in attendance),
        "pulse": [
            {
                "name": _profile(item.profile_id).full_name,
                "status": item.status,
                "check_in_at": item.check_in_at,
            }
            for item in attendance
        ],
        "recent_activity": [
            "Leave request from Meera Joshi just arrived",
            "Rahul Mehta marked half-day",
            "August payroll is ready",
        ],
    }


@router.get("/attendance", response_model=list[Attendance])
def get_attendance(
    actor: DemoActor = Depends(get_dayflow_actor), profile_id: str | None = None
) -> list[Attendance]:
    if actor.role not in ("hr", "admin"):
        requested_profile = actor.profile_id
        _profile(requested_profile)
        return [item for item in attendance if item.profile_id == requested_profile]
    if profile_id is not None:
        _profile(profile_id)
        return [item for item in attendance if item.profile_id == profile_id]
    return attendance


@router.post("/attendance/check-in", response_model=Attendance)
def check_in(actor: DemoActor = Depends(get_dayflow_actor)) -> Attendance:
    profile_id = actor.profile_id
    profile = _profile(profile_id)
    existing = next(
        (
            item
            for item in attendance
            if item.profile_id == profile_id and item.attendance_date == date.today()
        ),
        None,
    )
    if existing:
        if existing.check_in_at is None:
            existing.check_in_at = datetime.now(timezone.utc)
        existing.status = "present"
        _record(
            profile_id,
            "attendance.checked_in",
            "attendance",
            existing.id,
            f"{profile.full_name} checked in",
        )
        return existing
    record = Attendance(
        id=f"att-{len(attendance) + 1:03}",
        profile_id=profile_id,
        attendance_date=date.today(),
        status="present",
        check_in_at=datetime.now(timezone.utc),
    )
    attendance.append(record)
    _record(
        profile_id,
        "attendance.checked_in",
        "attendance",
        record.id,
        f"{profile.full_name} checked in",
    )
    return record


@router.post("/attendance/check-out", response_model=Attendance)
def check_out(actor: DemoActor = Depends(get_dayflow_actor)) -> Attendance:
    profile_id = actor.profile_id
    profile = _profile(profile_id)
    record = next(
        (
            item
            for item in attendance
            if item.profile_id == profile_id and item.attendance_date == date.today()
        ),
        None,
    )
    if record is None or record.check_in_at is None:
        raise HTTPException(status_code=409, detail="Check in before checking out")
    if record.check_out_at is not None:
        return record
    record.check_out_at = datetime.now(timezone.utc)
    record.worked_minutes = max(
        0,
        int((record.check_out_at - record.check_in_at).total_seconds() // 60),
    )
    _record(
        profile_id,
        "attendance.checked_out",
        "attendance",
        record.id,
        f"{profile.full_name} checked out after {record.worked_minutes} minutes",
    )
    return record


@router.get("/people", response_model=list[Profile])
def get_people(actor: DemoActor = Depends(get_dayflow_actor)) -> list[Profile]:
    if actor.role not in ("hr", "admin"):
        raise HTTPException(status_code=403, detail="Only HR or Admin can view the people directory")
    return profiles


@router.get("/people/{profile_id}", response_model=Profile)
def get_person(profile_id: str, actor: DemoActor = Depends(get_dayflow_actor)) -> Profile:
    if actor.role not in ("hr", "admin") and actor.profile_id != profile_id:
        raise HTTPException(status_code=403, detail="Employees can only view their own profile")
    return _profile(profile_id)


@router.post("/people", response_model=EmployeeProvisioned, status_code=201)
def create_person(
    payload: EmployeeCreate,
    actor: DemoActor = Depends(get_dayflow_actor),
) -> EmployeeProvisioned:
    if actor.role not in ("hr", "admin"):
        raise HTTPException(status_code=403, detail="Only HR or Admin can create employees")
    normalized_email = payload.email.strip().lower()
    if any(profile.email.lower() == normalized_email for profile in profiles):
        raise HTTPException(status_code=409, detail="An employee with this email already exists")
    profile = Profile(
        id=f"emp-{len(profiles) + 1:03d}",
        employee_code=_generated_employee_code(payload.full_name, payload.joining_year),
        full_name=payload.full_name.strip(),
        email=normalized_email,
        role="employee",
        department=payload.department.strip(),
        job_position=payload.job_position.strip(),
        location=payload.location.strip(),
        phone=payload.phone.strip(),
        manager="Ashwith Shetty",
        joining_year=payload.joining_year,
    )
    profiles.append(profile)
    temporary_password = f"Dayflow-{profile.employee_code[-4:]}!"
    _record(actor.profile_id, "employee.created", "profile", profile.id, f"{profile.full_name} was added with {profile.employee_code}")
    return EmployeeProvisioned(**profile.model_dump(), temporary_password=temporary_password)


@router.get("/payroll", response_model=list[PayrollSnapshot])
def get_payroll(
    actor: DemoActor = Depends(get_dayflow_actor), profile_id: str | None = None
) -> list[PayrollSnapshot]:
    selected_ids = [actor.profile_id]
    if actor.role in ("hr", "admin"):
        selected_ids = [profile_id] if profile_id else [item.id for item in profiles]
    snapshots: list[PayrollSnapshot] = []
    for selected_id in selected_ids:
        profile = _profile(selected_id)
        config = salary_by_profile.get(selected_id, salary_by_profile["emp-001"])
        payable_days, scheduled_days = _payroll_days(selected_id)
        breakdown = calculate_salary(config, payable_days=payable_days, scheduled_days=scheduled_days)
        snapshots.append(
            PayrollSnapshot(
                profile_id=profile.id,
                employee_name=profile.full_name,
                employee_code=profile.employee_code,
                period_year=date.today().year,
                period_month=date.today().month,
                basic_salary=breakdown.basic_salary,
                hra_allowance=breakdown.hra_allowance,
                standard_allowance=breakdown.standard_allowance,
                performance_bonus=breakdown.performance_bonus,
                deductions=breakdown.deductions,
                pf_contribution=breakdown.pf_contribution,
                professional_tax=breakdown.professional_tax,
                leave_travel_allowance=breakdown.leave_travel_allowance,
                fixed_allowance=breakdown.fixed_allowance,
                gross_salary=breakdown.gross_salary,
                net_salary=breakdown.net_salary,
                payable_days=payable_days,
                attendance_days=scheduled_days,
            )
        )
    return snapshots


@router.get("/activity", response_model=list[ActivityEvent])
def get_activity(
    actor: DemoActor = Depends(get_dayflow_actor), profile_id: str | None = None
) -> list[ActivityEvent]:
    if actor.role in ("hr", "admin"):
        if profile_id is not None:
            _profile(profile_id)
            return [event for event in activity_events if event.actor_id == profile_id]
        return activity_events
    requested_profile = actor.profile_id
    _profile(requested_profile)
    return [event for event in activity_events if event.actor_id == requested_profile]


@router.post("/leave-requests", response_model=LeaveRequest, status_code=201)
def create_leave(
    payload: LeaveCreate,
    actor: DemoActor = Depends(get_dayflow_actor),
) -> LeaveRequest:
    profile_id = actor.profile_id
    profile = _profile(profile_id)
    payload.validate_dates()
    if any(
        item.profile_id == profile_id
        and item.status in ("pending", "approved")
        and _overlaps(
            payload.start_date,
            payload.end_date,
            item.start_date,
            item.end_date,
        )
        for item in leave_requests
    ):
        raise HTTPException(
            status_code=409,
            detail="Leave dates overlap an existing pending or approved request",
        )
    days = (payload.end_date - payload.start_date).days + 1
    request = LeaveRequest(
        id=f"leave-{len(leave_requests) + 1:03}",
        profile_id=profile_id,
        employee_name=profile.full_name,
        days=days,
        **payload.model_dump(),
    )
    leave_requests.insert(0, request)
    _record(
        profile_id,
        "leave.created",
        "leave_request",
        request.id,
        f"{request.employee_name} requested {request.days} day(s) of {request.leave_type} leave",
    )
    return request


@router.get("/leave-requests", response_model=list[LeaveRequest])
def get_leave_requests(
    actor: DemoActor = Depends(get_dayflow_actor), profile_id: str | None = None
) -> list[LeaveRequest]:
    if actor.role in ("hr", "admin"):
        if profile_id is not None:
            _profile(profile_id)
            return [item for item in leave_requests if item.profile_id == profile_id]
        return leave_requests
    requested_profile = actor.profile_id
    _profile(requested_profile)
    return [item for item in leave_requests if item.profile_id == requested_profile]


@router.patch("/leave-requests/{request_id}", response_model=LeaveRequest)
def review_leave(
    request_id: str,
    payload: LeaveReview,
    actor: DemoActor = Depends(get_dayflow_actor),
) -> LeaveRequest:
    if actor.role not in ("hr", "admin"):
        raise HTTPException(status_code=403, detail="Only HR or Admin can review leave")
    request = next((item for item in leave_requests if item.id == request_id), None)
    if request is None:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if request.status != "pending":
        raise HTTPException(status_code=409, detail="Only pending leave can be reviewed")
    if payload.status == "rejected" and not payload.review_comment.strip():
        raise HTTPException(
            status_code=422,
            detail="A review comment is required when rejecting leave",
        )
    reviewer_id = actor.profile_id
    request.status = payload.status
    request.review_comment = payload.review_comment.strip()
    request.reviewer_id = reviewer_id
    request.reviewed_at = datetime.now(timezone.utc)
    _record(
        reviewer_id,
        f"leave.{payload.status}",
        "leave_request",
        request.id,
        f"{request.employee_name}'s leave was {payload.status} by HR",
    )
    return request


@router.post("/flow/message", response_model=FlowResponse)
def flow_message(
    payload: FlowMessage,
    actor: DemoActor = Depends(get_dayflow_actor),
) -> FlowResponse:
    message = payload.message.lower()
    if "leave" in message or "off" in message or "sick" in message:
        return FlowResponse(
            answer="I can draft a 2-day Sick Leave request for 25–26 August. It will remain pending until HR reviews it.",
            action={
                "action": "apply_leave",
                "data": {
                    "leave_type": "sick",
                    "start_date": "2026-08-25",
                    "end_date": "2026-08-26",
                    "remarks": payload.message,
                },
            },
        )
    if "absent" in message or "attendance" in message:
        return FlowResponse(
            answer="Rahul Mehta has the highest absence signal this week with 2 missed days. Karan Shah has not checked in today."
        )
    if "pay" in message or "salary" in message or "payslip" in message:
        return FlowResponse(
            answer="The latest payroll snapshot is ready. Net salary is ₹51,800 after PF and professional tax deductions."
        )
    return FlowResponse(
        answer=f"I’m Flow. I can help with attendance, leave, payroll, or your profile. You are signed in as {actor.role}."
    )
