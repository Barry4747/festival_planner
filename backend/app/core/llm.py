import logging
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings

logger = logging.getLogger("festival_planner.llm")


def get_llm(
    temperature: float = 0.7,
    model: Optional[str] = None
) -> ChatGoogleGenerativeAI:
    """
    Zwraca skonfigurowaną instancję modelu Google Gemini (LangChain ChatGoogleGenerativeAI).
    Może być używana jako FastAPI Dependency lub bezpośrednio w kodzie agentów.
    """
    target_model = model or settings.GEMINI_MODEL
    
    return ChatGoogleGenerativeAI(
        model=target_model,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature
    )


async def invoke_llm(prompt: str, temperature: float = 0.7) -> str:
    """
    Pomocnicza metoda asynchroniczna do szybkiego wywołania modelu LLM dla zadanego promptu.
    """
    llm = get_llm(temperature=temperature)
    response = await llm.ainvoke(prompt)
    return str(response.content)
