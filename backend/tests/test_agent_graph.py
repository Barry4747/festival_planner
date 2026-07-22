import pytest
from langchain_core.messages import AIMessage, HumanMessage
from app.agents.graph import planner_app
from langgraph.errors import GraphRecursionError
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_graph_happy_path_with_ticketmaster_mock(mocker):
    """
    Testuje pełny przepływ grafu z zamockowanym LLM i narzędziami (Ticketmaster).
    Sprawdza czy wywołanie narzędzia i ostateczna odpowiedź są odpowiednio emitowane.
    """
    mock_get_llm = mocker.patch("app.agents.lineup_agent.get_llm")
    mock_llm = mocker.MagicMock()
    mock_get_llm.return_value = mock_llm
    
    # Symulujemy, że LLM najpierw chce użyć narzędzia, a w kolejnym kroku zwraca odpowiedź
    tool_call_msg = AIMessage(
        content="",
        tool_calls=[{
            "name": "discover_festivals",
            "args": {"query": "rock festivals in summer"},
            "id": "call_123"
        }]
    )
    final_msg = AIMessage(content="Oto festiwale rockowe na lato: Rock am Ring.")
    mock_llm.bind_tools.return_value.ainvoke = AsyncMock(side_effect=[tool_call_msg, final_msg])
    
    # Mockujemy klienta Ticketmaster, żeby narzędzie aggregacji zadziałało bez sieci
    mock_tm = mocker.patch("app.api.external.TicketmasterClient.search_events", new_callable=AsyncMock)
    mock_tm.return_value = [{"name": "Rock am Ring", "id": "1", "dates": {"start": {"localDate": "2026-07-20"}}}]
    
    initial_state = {
        "messages": [HumanMessage(content="Znajdź mi festiwale rockowe")],
        "context": None
    }
    
    events = []
    async for event in planner_app.astream_events(initial_state, version="v2", config={"recursion_limit": 5}):
        events.append(event)
        
    tool_events = [e for e in events if e["event"] == "on_tool_start" and e.get("name") == "discover_festivals"]
    assert len(tool_events) == 1
    
    # Sprawdzamy czy ostateczna odpowiedź znajduje się w strumieniu
    final_output_found = any(
        "Rock am Ring" in str(e)
        for e in events
    )
    assert final_output_found, "Ostateczna odpowiedź nie została wyemitowana przez graf"


@pytest.mark.asyncio
async def test_graph_recursion_limit_raises_error(mocker):
    """
    Testuje czy graf poprawnie przerwie nieskończoną pętlę narzędzi
    (regresja dla fixa 4.3).
    """
    mock_get_llm = mocker.patch("app.agents.lineup_agent.get_llm")
    mock_llm = mocker.MagicMock()
    mock_get_llm.return_value = mock_llm
    
    # LLM cały czas zwraca wywołanie narzędzia
    infinite_tool_msg = AIMessage(
        content="",
        tool_calls=[{
            "name": "discover_festivals",
            "args": {"query": "loop"},
            "id": "call_loop"
        }]
    )
    mock_llm.bind_tools.return_value.ainvoke = AsyncMock(return_value=infinite_tool_msg)
    mocker.patch("app.agents.lineup_agent._aggregator.aggregate_festivals", return_value=[{"name": "loop result"}])
    
    initial_state = {
        "messages": [HumanMessage(content="loop please")],
        "context": None
    }
    
    with pytest.raises(GraphRecursionError):
        async for _ in planner_app.astream_events(initial_state, version="v2", config={"recursion_limit": 3}):
            pass
