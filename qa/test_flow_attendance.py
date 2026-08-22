from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import FlowMessage, flow_message

def test_flow_attendance_answer_is_non_destructive():
    result = flow_message(FlowMessage(message="Who has been absent most this week?"))
    assert "Rahul Mehta" in result.answer
    assert result.action is None
