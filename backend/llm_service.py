import json
import os
import re
from typing import Any, Dict, List, Tuple
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PROMPT_TEMPLATE = """You are an expert JavaScript/TypeScript refactoring assistant.
Your task is to take a legacy JavaScript function or snippet, modernize it into clean, idiomatic TypeScript, and generate a comprehensive suite of unit test cases (input arguments -> expected output) that prove equivalence.

### Guidelines:
1. Modernize code to clean TypeScript (modern syntax, arrow functions/ES6+, async/await if applicable, explicit types).
2. Retain original function name or identify the primary function being modernized.
3. Extract or synthesize 3-5 deterministic, JSON-serializable test cases:
   - "args": array of positional parameters to pass to the function.
   - "expected": expected output.
   - Arguments and expected outputs must be simple JSON types (numbers, strings, booleans, objects, arrays, null). Do not use functions, DOM nodes, or undefined.
4. Detect browser/DOM usage (e.g. `document`, `window`, jQuery `$`, DOM manipulation):
   - Modernize the logic safely if possible.
   - Include clear warning messages in the `warnings` array if DOM or network dependencies might cause sandboxed client execution issues.

### Legacy Code:
```javascript
{legacy_code}
```

### JSON Output Format:
Respond strictly with valid JSON conforming to the following structure (do not add extra markdown formatting around the JSON outside ```json):
```json
{{
  "function_name": "<primary_function_name>",
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
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content)
    return content.strip()


async def call_groq(legacy_code: str, api_key: str) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    prompt = PROMPT_TEMPLATE.format(legacy_code=legacy_code)
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": "You output only valid JSON matching the specified format without extra conversational text.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_content = data["choices"][0]["message"]["content"]
        cleaned = _clean_json_string(raw_content)
        return json.loads(cleaned)


async def call_gemini(legacy_code: str, api_key: str) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
    prompt = PROMPT_TEMPLATE.format(legacy_code=legacy_code)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
        cleaned = _clean_json_string(raw_content)
        return json.loads(cleaned)


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
