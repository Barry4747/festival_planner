from typing import Annotated, List, TypedDict, Optional, Dict, Any
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


class PlannerState(TypedDict, total=False):
    messages: Annotated[List[AnyMessage], add_messages]
    context: Optional[Dict[str, Any]]
    weather_forecast: Optional[Dict[str, Any]]
