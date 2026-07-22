import os
import pytest
import httpx
from datetime import datetime, timezone
from base64 import b64encode
import json
import jwt

# Ten test wymaga lokalnie postawionego Supabase (npx supabase start)
# oraz ustawionych zmiennych środowiskowych SUPABASE_LOCAL_URL i SUPABASE_ANON_KEY.
pytestmark = pytest.mark.skipif(
    not os.getenv("SUPABASE_LOCAL_URL"), 
    reason="Wymaga lokalnej instancji Supabase (SUPABASE_LOCAL_URL). Uruchom 'npx supabase start'."
)

def generate_test_jwt(user_id: str, role: str = "authenticated") -> str:
    """
    Generuje testowy token JWT, który Supabase (GoTrue) przyjmie jako poprawny 
    w środowisku lokalnym, gdzie znamy JWT_SECRET.
    (Domyślny sekret lokalnego supabase to 'super-secret-jwt-token-with-at-least-32-characters-long')
    """
    secret = os.getenv("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    payload = {
        "aud": "authenticated",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600,
        "sub": user_id,
        "email": f"{user_id}@example.com",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "role": role,
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


@pytest.mark.asyncio
async def test_user_cannot_read_others_messages():
    """
    Sprawdza, że Użytkownik A nie ma dostępu do wierszy 'chat_messages' Użytkownika B,
    wymuszając respektowanie RLS (Row Level Security).
    """
    url = os.getenv("SUPABASE_LOCAL_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY", "dummy")
    
    # User A i User B z predefiniowanymi ID
    user_a_id = "11111111-1111-1111-1111-111111111111"
    user_b_id = "22222222-2222-2222-2222-222222222222"
    
    token_a = generate_test_jwt(user_a_id)
    token_b = generate_test_jwt(user_b_id)
    
    async with httpx.AsyncClient() as client:
        # Najpierw stwórzmy wiadomość jako Service Role (aby pominąć RLS przy insert) 
        # i przypisać ją do usera B
        # Opcjonalnie: możemy też wstawić jako User B.
        headers_b = {
            "apikey": anon_key,
            "Authorization": f"Bearer {token_b}",
            "Content-Type": "application/json"
        }
        
        # Wstawiamy testowy thread i wiadomość (wymaga stworzonych odpowiednich tabel)
        # Zakładamy że struktura bazy jest gotowa (np. z supabase/migrations/)
        thread_payload = {"user_id": user_b_id, "id": "33333333-3333-3333-3333-333333333333"}
        await client.post(f"{url}/rest/v1/threads", headers=headers_b, json=thread_payload)
        
        msg_payload = {
            "thread_id": "33333333-3333-3333-3333-333333333333",
            "role": "user",
            "content": "Secret message from B",
            "user_id": user_b_id
        }
        await client.post(f"{url}/rest/v1/chat_messages", headers=headers_b, json=msg_payload)
        
        # Teraz Użytkownik A próbuje odczytać wszystkie wiadomości z bazy
        headers_a = {
            "apikey": anon_key,
            "Authorization": f"Bearer {token_a}",
        }
        resp = await client.get(f"{url}/rest/v1/chat_messages?select=*", headers=headers_a)
        
        assert resp.status_code == 200
        data = resp.json()
        
        # Baza powinna zwrócić puste dane (lub tylko wiadomości usera A, których nie ma)
        # Wiadomość usera B musi zostać ukryta przez RLS
        for row in data:
            assert row.get("user_id") != user_b_id, "RLS FAILURE: User A read User B's message!"
            
        assert len(data) == 0, "Powinno zwrócić pustą listę dla usera A"
