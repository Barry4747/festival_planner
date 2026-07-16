from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from app.agents.lineup_agent import lineup_node, search_artist_events, discover_festivals
from app.agents.state import PlannerState

tools_node = ToolNode([search_artist_events, discover_festivals])

workflow = StateGraph(PlannerState)
workflow.add_node("lineup_agent", lineup_node)
workflow.add_node("tools", tools_node)

workflow.add_edge(START, "lineup_agent")
workflow.add_conditional_edges("lineup_agent", tools_condition)
workflow.add_edge("tools", "lineup_agent")

planner_app = workflow.compile()
