import json
import logging
import os
import re
from typing import Any, Dict, List, Tuple
import httpx
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_service")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PROMPT_TEMPLATE = """You are an expert JavaScript/TypeScript refactoring assistant following a strict 5-step legacy equivalence generation process.

Follow this exact process to modernize legacy code and generate behavioral equivalence tests:

### Process:

#### Step 1 — Analyze the Legacy Code:
- Identify function name(s) and signature(s).
- Determine whether it is a pure function or impure (touches `document`, `window`, jQuery `$`, network, timers, or global mutable state).
- Identify implicit behavior: type coercions, default/undefined parameters, edge-case branches, string concatenation, and error handling.
- Retain the exact same primary function name using standard function declaration (`function <function_name>(...)` or `export function <function_name>(...)`). Do NOT change parameter positions or rename the primary function.

#### Step 2 — Generate Representative Test Cases:
Create 4 to 8 test cases covering:
1. Typical / happy path (normal expected inputs).
2. Boundary conditions (empty inputs, zero, negative numbers, large values).
3. Code-specific edge cases (exercising conditional logic and type coercion branches).
4. Invalid / unexpected input handling (e.g. null, undefined, non-numeric strings).

#### Step 3 — Determine Expected Outputs from ORIGINAL Code Behavior:
- Trace and execute positional arguments through the ORIGINAL legacy code's actual logic to derive the `expected` outputs.
- Do NOT idealize or "fix" bug behavior — if the legacy code has a bug or quirk, preserve its actual output in `expected` and add an explanatory message in `warnings`. Behavioral equivalence with the original code is required.

#### Step 4 — Code Modernization & Regex Accuracy:
- Modernize code into clean, idiomatic TypeScript (ES6+, explicit type annotations, const/let, arrow functions internally if appropriate).
- REGEX & REPLACEMENT STRING ACCURACY: If the legacy code contains regex replacement like `.replace(/(\\d)(?=(\\d{{3}})+(?!\\d))/g, '$1,')`, you MUST include `$1,` (dollar sign 1 followed by comma, with NO spaces) as the second argument in `.replace(...)`. Do NOT replace `$1,` with `,` or `'$1, '`.

#### Step 5 — Self-Check & Output Schema Validation:
- Ensure all `args` and `expected` values are simple JSON-serializable types (numbers, strings, booleans, objects, arrays, null). Do not use functions, DOM nodes, or undefined.
- Avoid redundant tests. Aim for 4-8 distinct test cases per function.

### Legacy Code:
```javascript
{legacy_code}
```

### JSON Output Format:
Respond strictly with valid JSON conforming to the following structure (do not add extra markdown formatting around the JSON outside ```json):
```json
{{
  "function_name": "<exact_primary_function_name>",
  "modernized_code": "<modernized_typescript_code>",
  "tests": [
    {{
      "id": "test-1",
      "description": "<description>",
      "args": [<arg1>, <arg2>],
      "expected": <expected_result>
    }}
  ],
  "warnings": ["<warning_1>"]
}}
```
"""


def _clean_json_string(content: str) -> str:
    content = content.strip()
    # Remove reasoning blocks enclosed in <think>...</think> if present (e.g. Qwen models)
    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content)
    # Extract JSON object substring if surrounded by extra text
    match = re.search(r"(\{.*\})", content, flags=re.DOTALL)
    if match:
        content = match.group(1)
    return content.strip()


def _fix_regex_replacements(modernized_code: str, legacy_code: str) -> str:
    # 1. Strip any trailing space inside replacement strings e.g. '$1, ' -> '$1,'
    modernized_code = re.sub(r"(['\"])\$1,\s+\1", r"\1$1,\1", modernized_code)
    modernized_code = modernized_code.replace("'$1, '", "'$1,'").replace('"$1, "', '"$1,"')

    # 2. If legacy code contains '$1,', ensure $1 group reference is present in the replacement
    if "$1," in legacy_code:
        # Match .replace(regex, ',') or .replace(regex, '$1, ') and fix to '$1,'
        modernized_code = re.sub(
            r"\.replace\((/[^/]+/[a-z]*),\s*(['\"])(?:\$1,\s*|,)\2\)",
            r".replace(\1, \2$1,\2)",
            modernized_code,
        )
        # If LLM wrote custom replace replacement without $1 e.g. .replace(/(\d).../g, ',')
        if "$1" not in modernized_code:
            modernized_code = re.sub(
                r"\.replace\((/[^/]+/[a-z]*),\s*(['\"])(.*?)\2\)",
                r".replace(\1, \2$1,\2)",
                modernized_code,
            )
    return modernized_code


async def call_groq(legacy_code: str, api_key: str) -> Dict[str, Any]:
    models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]
    last_err = None

    for model in models:
        logger.info(f"Sending request to Groq API ({model})...")
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        prompt = PROMPT_TEMPLATE.format(legacy_code=legacy_code)
        
        # Build payload based on model support
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a JSON generator. You output only valid JSON matching the specified format without extra conversational text.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
        }
        
        # openai/gpt-oss models support structured response_format
        if "gpt-oss" in model:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                raw_content = data["choices"][0]["message"]["content"]
                cleaned = _clean_json_string(raw_content)
                result = json.loads(cleaned)
                if isinstance(result, str):
                    result = json.loads(result)
                if "modernized_code" in result:
                    result["modernized_code"] = _fix_regex_replacements(result["modernized_code"], legacy_code)
                logger.info(f"Successfully received response from Groq API ({model})")
                return result
        except Exception as e:
            logger.warning(f"Groq model {model} failed: {e}")
            last_err = e

    raise last_err or RuntimeError("All Groq models failed.")


async def call_gemini(legacy_code: str, api_key: str) -> Dict[str, Any]:
    # List of valid supported models to try in order
    models_to_try = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"]
    last_error = None

    for model_name in models_to_try:
        logger.info(f"Sending request to Gemini API ({model_name})...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        prompt = PROMPT_TEMPLATE.format(legacy_code=legacy_code)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = _clean_json_string(raw_content)
                result = json.loads(cleaned)
                if isinstance(result, str):
                    result = json.loads(result)
                if "modernized_code" in result:
                    result["modernized_code"] = _fix_regex_replacements(result["modernized_code"], legacy_code)
                logger.info(f"Successfully received response from Gemini API ({model_name})")
                return result
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
            last_error = e

    raise last_error or RuntimeError("All Gemini models failed.")


async def process_legacy_code(legacy_code: str) -> Dict[str, Any]:
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    errors = []

    # Try Groq first
    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            return await call_groq(legacy_code, groq_key)
        except Exception as e:
            errors.append(f"Groq error: {str(e)}")

    # Small delay before fallback to reduce rate-limit pressure
    import asyncio
    await asyncio.sleep(1.0)

    # Fallback to Gemini
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            return await call_gemini(legacy_code, gemini_key)
        except Exception as e:
            errors.append(f"Gemini error: {str(e)}")

    if not groq_key or groq_key == "your_groq_api_key_here":
        if not gemini_key or gemini_key == "your_gemini_api_key_here":
            raise ValueError(
                "No valid API keys found. Please configure GROQ_API_KEY or GEMINI_API_KEY in environment."
            )

    raise RuntimeError(f"All LLM providers failed: {'; '.join(errors)}")
