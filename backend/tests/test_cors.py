import pytest

@pytest.mark.asyncio
async def test_cors_rejects_unauthorized_origin(client):
    """
    Sprawdza, że request z nieautoryzowanego originu jest odrzucany
    z powodu braku Access-Control-Allow-Origin.
    """
    headers = {
        "Origin": "http://zla-strona.com",
        "Access-Control-Request-Method": "POST"
    }
    response = client.options("/api/chat/", headers=headers)
    assert response.status_code == 400 # OPTIONS dla niedozwolonego origin z CORSMiddleware wyrzuca 400
    assert "access-control-allow-origin" not in response.headers

@pytest.mark.asyncio
async def test_cors_accepts_allowed_origin(client):
    """
    Sprawdza, że z ALLOWED_ORIGINS przechodzi i dostaje poprawne nagłówki.
    """
    # Używamy localhost, który jest (powinien być) dozwolony
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST"
    }
    response = client.options("/api/chat/", headers=headers)
    assert response.status_code == 200
    # W testach FastAPI, origin włączonego CORSu zwraca nagłówek z wartością Originu
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
