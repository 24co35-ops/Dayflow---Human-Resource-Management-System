import os
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

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


class LeaveCreate(BaseModel):
    leave_type: Literal["paid", "sick", "unpaid"]
    start_date: date
    end_date: date
    remarks: str = Field(default="", max_length=500)

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


def _profile(profile_id: str) -> Profile:
    profile = next((item for item in profiles if item.id == profile_id), None)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _overlaps(left_start: date, left_end: date, right_start: date, right_end: date) -> bool:
    return left_start <= right_end and right_start <= left_end


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
