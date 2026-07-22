import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.errors import GraphRecursionError
from app.services.concierge_service import FestivalConciergeService


@pytest.mark.asyncio
async def test_graph_happy_path_with_ticketmaster_mock(mocker):
    async def mock_events(*args, **kwargs):
        chunk_mock = MagicMock()
        chunk_mock.content = "Oto polecane festiwale w Warszawie!"
        yield {"event": "on_chat_model_stream", "data": {"chunk": chunk_mock}}

    mocker.patch("app.agents.graph.planner_app.astream_events", side_effect=mock_events)

    mock_repo = MagicMock()
    mock_repo.get_or_create_thread = AsyncMock(return_value={"id": "thread-123"})
    mock_repo.get_chat_messages_by_thread_id = AsyncMock(return_value=[])
    mock_repo.insert_chat_message = AsyncMock(return_value={"id": "msg-1"})

    service = FestivalConciergeService(repository=mock_repo)

    chunks = []
    async for chunk in service.generate_chat_response(
        message="Szukam festiwali w Warszawie",
        festival_id="fest-1",
        user_id="user-1"
    ):
        chunks.append(chunk)

    full_output = "".join(chunks)
    assert "Warszawie" in full_output


@pytest.mark.asyncio
async def test_graph_recursion_limit_raises_error(mocker):
    mock_llm = MagicMock()
    mock_llm_bound = AsyncMock()
    mock_response = AIMessage(content="", tool_calls=[{"name": "fetch_weather_forecast", "args": {"city": "Warsaw"}, "id": "call_1"}])
    mock_llm_bound.ainvoke.return_value = mock_response
    mock_llm.bind_tools.return_value = mock_llm_bound

    mocker.patch("app.agents.lineup_agent.get_llm", return_value=mock_llm)
    mocker.patch("app.services.weather.fetch_weather", side_effect=AsyncMock(return_value={"forecast": []}))

    from app.agents.graph import planner_app
    initial_state = {"messages": [HumanMessage(content="Infinite loop test")]}

    with pytest.raises(GraphRecursionError):
        await planner_app.ainvoke(initial_state, config={"recursion_limit": 3})
