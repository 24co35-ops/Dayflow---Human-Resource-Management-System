from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import DemoActor, check_in


def test_check_in_returns_same_daily_record():
    actor = DemoActor(role="employee", profile_id="emp-001")
    first = check_in(actor=actor)
    second = check_in(actor=actor)
    assert first.id == second.id
