# Festival Planner

A comprehensive personal AI Festival and Trip Planner designed to assist users in organizing their festival trips (focusing on Poland and Europe). Festival Planner orchestrates multiple AI agents to gather lineups, weather forecasts, transport schedules, and accommodation details to automatically generate a personalized itinerary.

## 🛠️ Tech Stack (2026 Edition)

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python 3.12) | Asynchronous, highly efficient for AI applications, out-of-the-box OpenAPI documentation, and Pydantic validation. |
| **Database** | Supabase (Postgres + pgvector) | All-in-one authentication, database, storage, and realtime subscriptions. |
| **AI / Agents** | LangGraph + Gemini (with Ollama fallback) | Multi-agent state management and orchestrating complex workflows. |
| **Vector Search** | pgvector (via Supabase Postgres) | Native vector storage, eliminating the need for a standalone vector DB like Chroma. |
| **Queue / Background Tasks** | Redis + Celery | Handles background web scraping and long-running planning tasks. |
| **Frontend** | React + Vite + TypeScript | Fast development cycle, static build capability, and a clean architecture without Next.js overhead. |
| **Mobile** | Flutter / Progressive Web App (PWA) | Single codebase for cross-platform availability. PWA to be developed first. |
| **Authentication** | Supabase Auth (Google OAuth & Email) | Simplest configuration and secure out-of-the-box user management. |
| **Deployment** | Backend: Render / Railway / AWS Fargate<br>Frontend: Vercel / Netlify | Cost-effective, scalable, and easy to deploy. |
| **Tooling & CI/CD** | Docker & Docker Compose, GitHub Actions | Standardized development environment and automated integration pipelines. |

---

## 🔌 Integrated APIs

- **Weather:** [Open-Meteo](https://open-meteo.com/) — Free, requires no API key, and offers accurate forecasting for Europe.
- **Events & Lineups:**
  - [Bandsintown API](https://artists.bandsintown.com/support/public-api) — Excellent for artist search and event discovery.
  - [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) — Broad coverage of mainstream events.
  - *Optional:* [Songkick API](https://www.songkick.com/developer) — Paid fallback.
- **Polish Transport:**
  - Official PKP PLK Open Data ([pdp-api.plk-sa.pl](https://pdp-api.plk-sa.pl)) — GTFS feeds and realtime train schedules.
  - Community APIs: [poland.transport.rest](https://poland.transport.rest)
- **Maps & Routing:** Google Maps Platform (or OpenStreetMap + self-hosted Valhalla engine).
- **Accommodation:** Booking.com Affiliate API or structured web scraping.
- **Calendar Integration:** Google Calendar API (for exporting the generated itinerary).

---

## 📐 System Architecture

### User Flow
1. **Authentication:** The user logs in securely using Google OAuth or email.
2. **Trip Configuration:** The user creates a new "Trip" specifying the festival name, dates, budget, and travel preferences.
3. **Data Ingestion:** The background scraper fetches relevant lineup data, transport connections, and weather updates, feeding them directly into the RAG (Retrieval-Augmented Generation) pipeline.
4. **Agent Orchestration:** The LangGraph-based system coordinates specialized agents to craft the plan:
   - 🎵 **Lineup Agent:** Validates artists, stages, and set times, matching user musical preferences.
   - 🚆 **Transport Agent:** Finds optimal routes and train schedules.
   - 🏨 **Accommodation & Budget Agent:** Recommends lodging options matching the user's budget.
   - ☀️ **Weather & Contingency Agent:** Adapts the checklist and itinerary based on live weather forecasts.
   - 🤝 **Coordinator Agent:** Reconciles the output into a single, cohesive, and exportable itinerary.

### Project Structure (FastAPI Backend)
```
app/
├── core/       # Configuration files, initialization, and Supabase client setup
├── auth/       # Supabase authentication integration
├── trips/      # CRUD endpoints and logic for trip itineraries
├── agents/     # LangGraph nodes, state machines, and agent definitions
├── rag/        # Ingestion pipeline, vector embeddings, and retrieval logic
├── scrapers/   # Custom scrapers for train schedules and festival lineups
└── api/        # REST API route controllers
```

---

## 🗺️ Roadmap

### Phase 0: Project Initialization (1-2 days)
- Set up Supabase project structure and database schemas.
- Initialize FastAPI backend template and configure Docker Compose.
- Connect Supabase Auth and configure the Postgres `pgvector` extension.

### Phase 1: MVP Release (1 week)
- Implement basic CRUD operations for Trips.
- Integrate the initial Bandsintown and Open-Meteo APIs.
- Build a simplified planning agent ("Generate a simple itinerary for [Festival]").

### Phase 2: Advanced Orchestration & Frontend
- Deploy the multi-agent system using LangGraph.
- Integrate Polish train schedule web scraping (PKP).
- Develop the React Frontend including the chat interface and planner dashboard.

### Phase 3: Cross-Platform & Background Processing
- Build the mobile version using Flutter / PWA.
- Integrate Celery and Redis to handle background ingestion jobs and push realtime updates to users.