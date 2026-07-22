import pytest
import jwt
import time
import os
from supabase import create_client

JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-bytes-long")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://localhost:54321")
ANON_KEY = os.environ.get("SUPABASE_KEY", "dummy-key")


def generate_mock_jwt(user_id: str, email: str = "test@example.com") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@pytest.mark.skipif(
    os.environ.get("SUPABASE_URL", "http://localhost").startswith("http://localhost"),
    reason="Requires active local/remote Supabase instance with RLS enabled."
)
def test_user_cannot_read_others_messages():
    user1_id = "user-1111-1111-1111-111111111111"
    user2_id = "user-2222-2222-2222-222222222222"

    jwt1 = generate_mock_jwt(user1_id)
    jwt2 = generate_mock_jwt(user2_id)

    client1 = create_client(SUPABASE_URL, ANON_KEY)
    client1.postgrest.auth(jwt1)

    client2 = create_client(SUPABASE_URL, ANON_KEY)
    client2.postgrest.auth(jwt2)

    thread1 = client1.table("threads").insert({"user_id": user1_id, "festival_id": "fest-rls"}).execute()
    thread1_id = thread1.data[0]["id"]

    client1.table("chat_messages").insert({
        "thread_id": thread1_id,
        "role": "user",
        "content": "Secret message from user 1"
    }).execute()

    res2 = client2.table("chat_messages").select("*").eq("thread_id", thread1_id).execute()
    assert len(res2.data) == 0
