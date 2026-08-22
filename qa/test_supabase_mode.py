from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parents[1] / "backend"))
from app.core.supabase import supabase_settings

def test_supabase_boundary_is_optional():
    assert isinstance(supabase_settings.enabled, bool)
