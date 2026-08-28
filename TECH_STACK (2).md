# Tech Stack Document

## LegacyProof — 100% Free Tools

This stack is deliberately scoped so that **every single piece is free** (no credit card, no paid tier required) and reliable enough to demo live in front of judges. The key design decision: legacy code scope is limited to plain **JavaScript/jQuery**, which lets all "run the code and check it" logic happen **in the browser** — no server-side code execution, no sandboxing infrastructure, no hosting costs for compute.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Frontend)                     │
│                                                                 │
│  React UI  →  calls FastAPI backend                            │
│      │                                                          │
│      ├── Legacy code + generated tests                        │
│      ├── Modernized code + same tests                         │
│      │                                                          │
│      ▼                                                          │
│  Web Worker Sandbox(es)                                        │
│   - Worker A: runs tests against ORIGINAL code                │
│   - Worker B: runs tests against MODERNIZED code               │
│      │                                                          │
│      ▼                                                          │
│  Results UI: pass/fail per test, side-by-side code view        │
└─────────────────────────────────────────────────────────────┘
              │
              ▼ (HTTP request)
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (on Render)                  │
│   - Receives legacy code from frontend                        │
│   - Calls LLM API (key stays server-side, never exposed)      │
│   - Returns modernized code + generated tests as JSON         │
└─────────────────────────────────────────────────────────────┘
              │
              ▼ (LLM calls only)
      Free LLM API (Groq / Gemini)
```

No database. No persistent backend required for the core demo. This drastically reduces the number of things that can fail on stage.

---

## 2. Frontend

| Tool | Purpose | Cost |
|---|---|---|
| **React + Vite** | UI framework + fast dev/build tooling | Free, open source |
| **TypeScript** | Type safety (also doubles as the "modern" target language for the demo) | Free, open source |
| **Tailwind CSS** | Fast, clean styling without custom CSS overhead | Free, open source |
| **Monaco Editor** (the VS Code editor component) | Code input/output panes with syntax highlighting | Free, open source |

## 3. AI / LLM Layer

| Tool | Purpose | Cost |
|---|---|---|
| **Groq API** (Llama 3.3 70B or similar) | Primary LLM: code modernization + test generation. Chosen for very low latency — important for a live demo. | Free tier (generous rate limits, no card required) |
| **Google Gemini API** (via AI Studio) | Backup/alternative LLM if Groq rate limits are hit during testing | Free tier |

**Note on LatentCode:** per the hackathon rules, LatentCode is the tool you use *to build* this project (your AI pair-programmer during the sprint). The Groq/Gemini API above is a separate thing — it's the LLM your *finished app* calls at runtime to actually perform the code modernization. These are two different roles and it's worth stating that distinction clearly in your submission.

## 4. Code Execution / Equivalence Sandbox

This is the core technical piece — keep it simple and free:

| Tool | Purpose | Cost |
|---|---|---|
| **Web Workers** (native browser API) | Run the legacy code and the modernized code each in an isolated worker thread, execute the generated test cases against both, and report pass/fail | Free (built into every browser) |
| **Custom lightweight test runner** (~50 lines of JS) | Simple `assert(actual, expected)`-style runner — no need for a full Jest/Vitest install for the MVP, keeps things fast and dependency-free | Free |

*Why not a server-side sandbox (e.g. Docker, Judge0)?* Running arbitrary code server-side means paying for compute and handling security carefully — unnecessary complexity for a 48-hour build. Scoping to pure JavaScript functions (no DOM/network access) lets everything run safely client-side, for free, with zero infra.

*(Stretch goal only, skip for MVP):* If you want "real" test framework output for polish points, **Vitest** (free, open source) can run in a worker too — but don't reach for this until the core loop works.

## 5. Backend

| Tool | Purpose | Cost |
|---|---|---|
| **FastAPI** (Python) | Backend API layer: receives legacy code from the frontend, calls the LLM API server-side (keeps your API key off the client), and returns modernized code + generated tests as JSON | Free, open source |
| **Uvicorn** | ASGI server to run FastAPI | Free, open source |

**Suggested endpoints:**
- `POST /modernize` → takes legacy code, returns modernized code
- `POST /generate-tests` → takes legacy code, returns generated test cases as structured JSON
- (Optional) combine both into a single `POST /process` call to reduce round-trips during the live demo

## 6. Hosting / Deployment

| Tool | Purpose | Cost |
|---|---|---|
| **Vercel** | Deploy the React frontend, get a live public URL for the demo | Free tier |
| **Render** | Deploy the FastAPI backend as a free web service | Free tier |
| **GitHub** | Version control; both Vercel and Render deploy straight from a GitHub repo | Free |

**⚠️ Demo-day tip:** Render's free tier spins the backend down after ~15 minutes of inactivity, and the first request after that can take 30–50 seconds to wake up. **Ping your `/health` endpoint a few minutes before you go on stage** so it's warm when the judges are watching. Don't discover this live.

## 7. Dev Tools & Collaboration

| Tool | Purpose | Cost |
|---|---|---|
| **LatentCode** | Your AI coding assistant for building the app during the sprint (provided by the hackathon) | Provided free during BuildSprint |
| **GitHub** | Repo, version control, team collaboration | Free |
| **Excalidraw** | Quick architecture/flow diagrams for your pitch deck | Free |
| **Notion or GitHub Projects** | Lightweight task tracking across the 48 hours | Free |

## 8. Total Cost

**$0.** Every tool above has a genuinely free tier sufficient for a 48-hour build and live demo — no trial cards, no expiring credits you need to watch.

---

## 9. Quick Start Checklist

**Frontend:**
1. `npm create vite@latest legacyproof -- --template react-ts`
2. Add Tailwind CSS + Monaco Editor.

**Backend:**
3. `pip install fastapi uvicorn python-dotenv httpx`
4. Get a free Groq API key (console.groq.com) — no card required. Store it in a `.env` file, never commit it.
5. Build a minimal FastAPI app with a `/health` endpoint (for the Render wake-up ping) and a `/process` endpoint that calls the LLM.

**Core loop (build in this order):**
6. Paste code → frontend calls FastAPI → FastAPI calls LLM → get modernized code back (get this working end-to-end before anything else).
7. Extend the same call (or add a second one) to also return generated test cases as structured JSON (input/output pairs).
8. Build the Web Worker runner in the frontend → execute tests against the original code.
9. Run the same tests against the modernized code.
10. Render pass/fail results in the UI.

**Polish & deploy:**
11. Only once the full loop works: polish UI, add the side-by-side view, rehearse the demo script.
12. Deploy both early (day 1, even half-broken): frontend to Vercel, backend to Render — so you're never scrambling right before judging.
13. A few minutes before your demo slot, hit your Render `/health` endpoint to wake it up.
