import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import ErrorResponse, ProcessRequest, ProcessResponse
from llm_service import process_legacy_code

app = FastAPI(
    title="LegacyProof Backend API",
    description="Backend API for LegacyProof - AI-Powered Legacy Code Modernizer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}


@app.post(
    "/process",
    response_model=ProcessResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def process_code(request: ProcessRequest):
    code = request.legacy_code.strip() if request.legacy_code else ""
    if not code:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "invalid_input",
                "detail": "legacy_code is empty or not valid JavaScript",
            },
        )

    try:
        result = await process_legacy_code(code)
        
        # Ensure default structure matching ProcessResponse
        return ProcessResponse(
            function_name=result.get("function_name", "unknownFunction"),
            modernized_code=result.get("modernized_code", ""),
            tests=result.get("tests", []),
            warnings=result.get("warnings", []),
        )
    except ValueError as ve:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "configuration_error", "detail": str(ve)},
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "llm_processing_failed", "detail": str(e)},
        )
