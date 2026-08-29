# LegacyProof

AI-powered legacy code modernizer with equivalence verification. Paste legacy JavaScript/jQuery code, get a modernized TypeScript rewrite — and proof it behaves identically, via an auto-generated test suite run against both versions live.

Built for **BuildSprint by LatentForce.ai**.

---

## Project Docs

- [`PRD.md`](./PRD.md) — what this is, who it's for, feature scope
- [`TECH_STACK.md`](./TECH_STACK.md) — full stack breakdown, all free tools
- [`contract.md`](./contract.md) — the exact frontend/backend API contract
- [`.latentcode/skills/legacy-equivalence-test-generator/`](./.latentcode/skills/legacy-equivalence-test-generator/SKILL.md) — the published SkillPatch skill powering the core test-generation logic

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- Free API key(s) — you need at least one:
  - Groq (primary): [console.groq.com](https://console.groq.com) — no card required
  - Gemini (fallback): [Google AI Studio](https://aistudio.google.com) — no card required

---

## Setup (from a clean clone)

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd LegacyProof-main
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your local env file from the example and fill in at least one key:

```bash
cp .env.example .env
```

Edit `.env`:
```
GROQ_API_KEY=your_actual_groq_key_here
GEMINI_API_KEY=your_actual_gemini_key_here
PORT=8000
HOST=0.0.0.0
```

Run the backend:

```bash
python run.py
```

The API is now live at `http://localhost:8000`. Confirm it's up:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### 3. Frontend setup

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` already points at `http://localhost:8000` — no changes needed for local dev.

Run the frontend:

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

---

## Verifying everything works

1. In the app, load one of the built-in sample snippets (currency formatter, cart summary, or slug sanitizer).
2. Click **Modernize**.
3. Watch: modernized TypeScript code appears, tests generate, and results run against both the original and modernized code — pass/fail shown live.

If step 3 fails immediately with an error about API keys, double check `backend/.env` has a real (not placeholder) key and that you restarted `python run.py` after editing it.

---

## Running the tests

**Backend** (from `backend/`, with venv activated):

```bash
pytest test_main.py -v
```

Note: `test_health_check`, `test_process_empty_code`, and `test_process_with_mocked_llm` will always pass — they don't need API keys. `test_process_simple_function`, `test_process_string_formatter`, and `test_process_jquery_dom_snippet` call the real LLM API and require valid keys in `.env` to pass; without keys they'll fail with a clear error, not a crash.

**Frontend** (from `frontend/`):

```bash
npm run test
```

---

## Project Structure

```
LegacyProof-main/
├── PRD.md
├── TECH_STACK.md
├── contract.md
├── .latentcode/
│   └── skills/
│       └── legacy-equivalence-test-generator/
│           └── SKILL.md
├── backend/
│   ├── main.py           # FastAPI app, /health and /process endpoints
│   ├── models.py         # Pydantic request/response models
│   ├── llm_service.py    # LLM prompt + Groq/Gemini calls
│   ├── run.py            # Entry point (uvicorn)
│   ├── test_main.py      # Backend tests
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts         # Calls the backend /process endpoint
    │   ├── runner.ts      # Web Worker sandbox + equivalence checking
    │   ├── runner.test.ts
    │   ├── samples.ts      # Built-in demo snippets
    │   ├── types.ts        # Shared types (matches contract.md)
    │   └── components/
    │       └── TestResultsPanel.tsx
    ├── package.json
    └── .env.example
```

---

## Notes

- This is a local-only demo build — not deployed. Run both servers locally as described above.
- Scope is intentionally limited to single JavaScript/jQuery functions (see `PRD.md` for the full scope reasoning) — this is what keeps the whole stack free and the sandbox execution safe and simple.
- `GLM-5.2` and `Gemini 3.7 Flash` (available via LatentCode) were used to *build* this project, not called by the app at runtime — the app's own live LLM calls go to Groq/Gemini directly, as documented in `TECH_STACK.md`.
