"""Optional Supabase REST/Reatime boundary for Dayflow.

The service-role key is intentionally read only by the backend. When the keys are
absent, Dayflow's demo adapter remains usable for offline judging.
"""

from typing import Any

import httpx
from pydantic_settings import BaseSettings, SettingsConfigDict


class SupabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_ignore_empty=True, extra="ignore")

    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.SUPABASE_URL and (self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_ANON_KEY))

    @property
    def api_key(self) -> str | None:
        return self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_ANON_KEY


supabase_settings = SupabaseSettings()


async def supabase_select(table: str, query: str = "select=*") -> list[dict[str, Any]]:
    """Read a table through Supabase REST when configured; otherwise return no rows."""
    if not supabase_settings.enabled:
        return []
    headers = {"apikey": supabase_settings.api_key or "", "Authorization": f"Bearer {supabase_settings.api_key or ''}"}
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.get(f"{supabase_settings.SUPABASE_URL}/rest/v1/{table}?{query}", headers=headers)
        response.raise_for_status()
        payload = response.json()
        return payload if isinstance(payload, list) else []
