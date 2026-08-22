from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import FlowMessage

def test_flow_payload_has_bounded_length():
    value = FlowMessage(message="attendance")
    assert len(value.message) <= 1000
