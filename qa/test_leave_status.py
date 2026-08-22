from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import LeaveReview, review_leave

def test_hr_can_approve_existing_leave():
    result = review_leave("leave-001", LeaveReview(status="approved"), role="hr")
    assert result.status == "approved"
