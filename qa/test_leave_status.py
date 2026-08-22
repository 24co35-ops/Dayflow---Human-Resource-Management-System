from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import DemoActor, LeaveReview, review_leave


def test_hr_can_approve_existing_leave():
    result = review_leave(
        "leave-001",
        LeaveReview(status="approved"),
        actor=DemoActor(role="hr", profile_id="hr-001"),
    )
    assert result.status == "approved"
