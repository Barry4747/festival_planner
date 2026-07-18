"""
Supabase client configuration for database operations.

INSTRUCTIONS FOR SUPABASE DASHBOARD SETUP:
Please run the following SQL commands in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
to create the required tables and RLS policies:

-- 1. Table for proprietary / local European music festivals
create table if not exists public.local_festivals (
    id bigint primary key generated always as identity,
    name text not null,
    lat double precision not null,
    lng double precision not null,
    start_date text not null,
    end_date text not null,
    url text,
    image_url text
);

alter table public.local_festivals enable row level security;
create policy "Allow public read access on local_festivals"
    on public.local_festivals for select
    using (true);

-- 2. Table for user festival suggestions
create table if not exists public.festival_suggestions (
    id bigint primary key generated always as identity,
    suggested_name text not null,
    suggested_city text not null,
    start_date text null,
    end_date text null,
    status text default 'pending',
    user_id uuid null,
    created_at timestamptz default now()
);

alter table public.festival_suggestions enable row level security;
create policy "Allow public insert on festival_suggestions"
    on public.festival_suggestions for insert
    with check (true);
create policy "Allow public read on festival_suggestions"
    on public.festival_suggestions for select
    using (true);

-- 3. Table for entity-bound chat threads (one dedicated thread per user per festival)
create table if not exists public.threads (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    festival_id varchar not null,
    created_at timestamptz default now(),
    unique(user_id, festival_id)
);

alter table public.threads enable row level security;
create policy "Allow user access to own threads"
    on public.threads for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 4. Table for chat messages inside threads
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null references public.threads(id) on delete cascade,
    role varchar not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
create policy "Allow user access to own chat messages"
    on public.chat_messages for all
    using (
        exists (
            select 1 from public.threads
            where threads.id = chat_messages.thread_id and threads.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.threads
            where threads.id = chat_messages.thread_id and threads.user_id = auth.uid()
        )
    );

-- CRITICAL: Reload PostgREST schema cache immediately after creating/modifying tables!
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
"""

from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Returns a singleton instance of the Supabase Python client configured
    with SUPABASE_URL and SUPABASE_KEY from application settings.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment configuration (.env)")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def init_db():
    """Verify Supabase client initialization at application startup."""
    try:
        get_supabase_client()
        print("[SUPABASE DB] Initialized Supabase client successfully.")
    except Exception as e:
        print(f"[SUPABASE DB] Warning during Supabase client initialization: {e}")

