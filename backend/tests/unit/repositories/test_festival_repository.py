import pytest
from unittest.mock import MagicMock
from app.repositories.festival_repository import FestivalRepository


@pytest.mark.asyncio
async def test_save_suggestion_happy_path(mock_supabase):
    mock_table = MagicMock()
    mock_insert = MagicMock()

    mock_supabase.table.return_value = mock_table
    mock_table.insert.return_value = mock_insert

    class MockResponse:
        data = [{"id": "sug-1", "suggested_name": "Woodstock", "suggested_city": "Kostrzyn"}]

    mock_insert.execute.return_value = MockResponse()

    repo = FestivalRepository(mock_supabase)
    res = await repo.save_suggestion("Woodstock", "Kostrzyn", user_id="user-123")

    assert res["id"] == "sug-1"
    assert res["suggested_name"] == "Woodstock"


@pytest.mark.asyncio
async def test_create_thread_race_condition_fallback(mock_supabase):
    mock_table = MagicMock()
    mock_insert = MagicMock()
    mock_select = MagicMock()
    mock_eq1 = MagicMock()
    mock_eq2 = MagicMock()

    mock_supabase.table.return_value = mock_table
    mock_table.insert.return_value = mock_insert
    # Insert fails with exception (simulating DB unique constraint error)
    mock_insert.execute.side_effect = Exception("duplicate key value violates unique constraint")

    # Select fallback returns existing thread
    mock_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq1
    mock_eq1.eq.return_value = mock_eq2

    class MockSelectResponse:
        data = [{"id": "existing-thread-id", "user_id": "user-1", "festival_id": "fest-1"}]

    mock_eq2.execute.return_value = MockSelectResponse()

    repo = FestivalRepository(mock_supabase)
    res = await repo.create_thread("user-1", "fest-1")

    assert res["id"] == "existing-thread-id"


@pytest.mark.asyncio
async def test_insert_chat_message_uses_service_client_for_assistant_role(mock_supabase):
    service_client = MagicMock()
    mock_table = MagicMock()
    mock_insert = MagicMock()

    service_client.table.return_value = mock_table
    mock_table.insert.return_value = mock_insert

    class MockResponse:
        data = [{"id": "msg-assistant", "role": "assistant", "content": "Hello user"}]

    mock_insert.execute.return_value = MockResponse()

    repo = FestivalRepository(client=mock_supabase, service_client=service_client)
    res = await repo.insert_chat_message("thread-1", "assistant", "Hello user")

    # Assert that insert was called on service_client (bypassing RLS)
    service_client.table.assert_called_with("chat_messages")
    assert res["role"] == "assistant"
