from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import DemoActor, FlowMessage, flow_message

def test_flow_payroll_answer_is_safe():
    result = flow_message(
        FlowMessage(message="Show me the latest payslip"),
        actor=DemoActor(role="hr", profile_id="hr-001"),
    )
    assert "₹51,800" in result.answer
