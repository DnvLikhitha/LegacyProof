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

PROMPT_TEMPLATE = """You are an expert JavaScript/TypeScript refactoring assistant.
Your task is to take a legacy JavaScript function or snippet, modernize it into clean, idiomatic TypeScript, and generate a comprehensive suite of unit test cases (input arguments -> expected output) that prove exact behavioral equivalence.

### Guidelines:
1. Modernize code to clean TypeScript using standard function syntax (e.g. `export function formatPrice(...)`).
2. The modernized TypeScript code MUST preserve 100% exact behavioral equivalence with the legacy code for all input edge cases (nulls, string numbers, defaults, non-numeric values, regex formatting, string concatenation, etc.).
3. Retain the exact same primary function name in the modernized code as in the legacy code using standard function declaration (`function <function_name>(...)`). Do NOT use arrow variable declarations like `const formatPrice = ...`.
4. REGEX & REPLACEMENT STRING ACCURACY: If the legacy code contains regex replacement like `.replace(/(\\d)(?=(\\d{{3}})+(?!\\d))/g, '$1,')`, you MUST include `$1,` (dollar sign 1 followed by comma, with NO spaces) as the second argument in `.replace(...)`. Do NOT replace `$1,` with `,` or `'$1, '`.
5. Extract or synthesize 3-5 deterministic, JSON-serializable test cases:
   - "args": array of positional parameters passed to the function.
   - "expected": expected return value produced when executing the original legacy code with those positional arguments.
   - Arguments and expected outputs must be simple JSON types (numbers, strings, booleans, objects, arrays, null). Do not use functions, DOM nodes, or undefined.
6. Detect browser/DOM usage (e.g. `document`, `window`, jQuery `$`, DOM manipulation):
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
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content)
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
    logger.info("Sending request to Groq API (openai/gpt-oss-120b)...")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    prompt = PROMPT_TEMPLATE.format(legacy_code=legacy_code)
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [
            {
                "role": "system",
                "content": "You are a JSON generator. You output only valid JSON matching the specified format without extra conversational text.",
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
        result = json.loads(cleaned)
        if "modernized_code" in result:
            result["modernized_code"] = _fix_regex_replacements(result["modernized_code"], legacy_code)
        logger.info("Successfully received response from Groq API (openai/gpt-oss-120b)")
        return result


async def call_gemini(legacy_code: str, api_key: str) -> Dict[str, Any]:
    logger.info("Sending request to Gemini API (gemini-3.5-flash)...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
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
        result = json.loads(cleaned)
        if "modernized_code" in result:
            result["modernized_code"] = _fix_regex_replacements(result["modernized_code"], legacy_code)
        logger.info("Successfully received response from Gemini API (gemini-3.5-flash)")
        return result


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
