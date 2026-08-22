from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import DemoActor, get_leave_requests

def test_employee_leave_query_is_scoped():
    result = get_leave_requests(
        actor=DemoActor(role="employee", profile_id="emp-001")
    )
    assert all(item.profile_id == "emp-001" for item in result)
