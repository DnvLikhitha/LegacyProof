# API Contract — LegacyProof

This is the single source of truth for how the frontend and backend talk to each other. **Both LatentCode sessions (frontend + backend) should be given this file as context at the start of work.** If either side needs to change a field, update this file first and let the other person know before changing code.

---

## Base URL

- Local dev: `http://localhost:8000`
- Deployed: `<your-render-url>` (fill in once deployed)

---

## `GET /health`

Used to check the backend is awake (important for waking up Render's free tier before the live demo).

**Response `200`**
```json
{ "status": "ok" }
```

---

## `POST /process`

The main endpoint. Takes a legacy code snippet, returns the modernized version **and** the generated equivalence tests in a single call — combined into one request to minimize round-trips during the live demo.

### Request

```json
{
  "legacy_code": "function add(a, b) { return a + b; }"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `legacy_code` | string | yes | Raw JS/jQuery snippet. Should contain one primary function to modernize (scope limitation — see PRD). |

### Response `200`

```json
{
  "function_name": "add",
  "modernized_code": "export function add(a: number, b: number): number {\n  return a + b;\n}",
  "tests": [
    {
      "id": "test-1",
      "description": "adds two positive integers",
      "args": [2, 3],
      "expected": 5
    },
    {
      "id": "test-2",
      "description": "handles negative numbers",
      "args": [-4, 10],
      "expected": 6
    }
  ],
  "warnings": []
}
```

| Field | Type | Notes |
|---|---|---|
| `function_name` | string | Name of the function being modernized, detected from `legacy_code`. The frontend's Web Worker uses this to know what to invoke in both the original and modernized code. |
| `modernized_code` | string | The rewritten TypeScript/ES6+ code. |
| `tests` | array | Generated equivalence test cases. Each has `id`, `description`, `args` (positional arguments to call the function with), and `expected` (the expected return value). |
| `warnings` | array of strings | Optional. Flags caveats the LLM noticed — e.g. "this code accesses `document`, sandboxed execution may not fully validate DOM-dependent behavior." |

### Response `4xx` / `5xx` (error)

```json
{
  "error": "invalid_input",
  "detail": "legacy_code is empty or not valid JavaScript"
}
```

| Field | Type | Notes |
|---|---|---|
| `error` | string | Short machine-readable error code. |
| `detail` | string | Human-readable explanation, safe to show in the UI. |

---

## Shared Types

### TypeScript (frontend)

```typescript
interface ProcessRequest {
  legacy_code: string;
}

interface TestCase {
  id: string;
  description: string;
  args: unknown[];
  expected: unknown;
}

interface ProcessResponse {
  function_name: string;
  modernized_code: string;
  tests: TestCase[];
  warnings: string[];
}

interface ErrorResponse {
  error: string;
  detail: string;
}
```

### Python / Pydantic (backend)

```python
from pydantic import BaseModel
from typing import Any

class ProcessRequest(BaseModel):
    legacy_code: str

class TestCase(BaseModel):
    id: str
    description: str
    args: list[Any]
    expected: Any

class ProcessResponse(BaseModel):
    function_name: str
    modernized_code: str
    tests: list[TestCase]
    warnings: list[str] = []

class ErrorResponse(BaseModel):
    error: str
    detail: str
```

---

## Scope Reminder (keeps both sides aligned)

- One function/snippet per request — no multi-file or whole-repo input for the MVP.
- `args` and `expected` must be JSON-serializable (no functions, no DOM nodes) — this is what makes client-side Web Worker sandboxing safe and simple.
- If `legacy_code` references `document`, `window`, or other browser globals, the backend should still attempt modernization but add a `warnings` entry — don't fail the request outright.

---

## Change Log

| Date | Change | Changed by |
|---|---|---|
| _(fill in)_ | Initial contract | _(fill in)_ |

*Keep this table updated any time the shape changes — it's the fastest way to catch drift during the 4-hour sync check-ins.*
