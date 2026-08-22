from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.api.routes.dayflow import profiles

def test_demo_seed_has_multiple_departments():
    assert len({profile.department for profile in profiles}) >= 3
