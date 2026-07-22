import pytest
from app.core.tiers import TIER_CONFIG
from unittest.mock import MagicMock
from langchain_core.messages import AIMessage

@pytest.mark.asyncio
async def test_free_tier_limits_requests(client, mocker):
    """
    Testuje limit zapytań dla tieru FREE.
    Używa fakeredis (poprzez conftest) dla prawdziwej symulacji limitera.
    """
    mock_llm = mocker.patch("app.agents.lineup_agent.get_llm")
    mock_llm_instance = MagicMock()
    
    async def mock_ainvoke(*args, **kwargs):
        return AIMessage(content="Rate limit test")
        
    mock_llm_instance.bind_tools.return_value.ainvoke = mock_ainvoke
    mock_llm.return_value = mock_llm_instance
    
    payload = {"message": "Test limitu", "history": []}
    
    # Tier FREE dla ai_agent ma rpm=10
    limit = TIER_CONFIG["FREE"]["limits"]["ai_agent"]["rpm"]
    
    # Wykonujemy zapytania do limitu
    for _ in range(limit):
        resp = client.post("/api/chat/", json=payload)
        assert resp.status_code == 200
        
    # Następne zapytanie powinno zostać zablokowane z błędem 429
    resp = client.post("/api/chat/", json=payload)
    assert resp.status_code == 429
    
    data = resp.json()
    assert data["error"] == "rate_limit_exceeded"
    assert data["tier"] == "Free"
    assert "Minute limit reached" in data["message"]

def test_all_tiers_have_valid_limits():
    """
    Sprawdza, że limit rpm > 0 dla każdego tieru i serwisu w tiers.py
    (regresja dla buga z rpm=0).
    """
    for tier_key, tier_data in TIER_CONFIG.items():
        for service_name, limits in tier_data["limits"].items():
            assert limits["rpm"] > 0, f"Limit RPM dla {service_name} w tierze {tier_key} wynosi 0!"
            assert limits["rpd"] > 0, f"Limit RPD dla {service_name} w tierze {tier_key} wynosi 0!"
