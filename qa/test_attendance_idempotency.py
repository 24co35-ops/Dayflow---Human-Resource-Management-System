from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import check_in

def test_check_in_returns_same_daily_record():
    first = check_in("emp-001")
    second = check_in("emp-001")
    assert first.id == second.id
