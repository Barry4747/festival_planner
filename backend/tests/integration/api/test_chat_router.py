import pytest
from unittest.mock import AsyncMock, patch


def test_chat_status_endpoint(client):
    response = client.get("/api/chat/status")
    assert response.status_code == 200
    assert "enabled" in response.json()


def test_chat_history_endpoint_happy_path(client):
    with patch("app.services.FestivalConciergeService.get_chat_history_for_festival", new_callable=AsyncMock) as mock_hist:
        mock_hist.return_value = [
            {"id": "msg-1", "role": "user", "content": "Hi"},
            {"id": "msg-2", "role": "assistant", "content": "Hello!"}
        ]

        response = client.get("/api/chat/history/fest-123")
        assert response.status_code == 200
        assert len(response.json()) == 2


def test_chat_endpoint_streaming_happy_path(client):
    async def mock_generator(*args, **kwargs):
        yield "data: {\"type\": \"token\", \"content\": \"Hello\"}\n\n"
        yield "data: {\"type\": \"token\", \"content\": \" World\"}\n\n"

    with patch("app.services.FestivalConciergeService.generate_chat_response", side_effect=mock_generator):
        payload = {"message": "Hello AI", "festival_id": "fest-1"}
        response = client.post("/api/chat/", json=payload)
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        assert "Hello" in response.text
