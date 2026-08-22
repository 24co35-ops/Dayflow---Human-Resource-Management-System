from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import DemoActor, FlowMessage, flow_message

def test_flow_attendance_answer_is_non_destructive():
    result = flow_message(
        FlowMessage(message="Who has been absent most this week?"),
        actor=DemoActor(role="employee", profile_id="emp-001"),
    )
    assert "Rahul Mehta" in result.answer
    assert result.action is None
