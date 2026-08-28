from typing import Any, List, Optional
from pydantic import BaseModel, Field


class ProcessRequest(BaseModel):
    legacy_code: str = Field(..., description="Raw JS/jQuery snippet to modernize")


class TestCase(BaseModel):
    id: str = Field(..., description="Unique test case identifier, e.g., test-1")
    description: str = Field(..., description="Short explanation of what this test case checks")
    args: List[Any] = Field(default_factory=list, description="Positional arguments passed to the function")
    expected: Any = Field(..., description="Expected return value")


class ProcessResponse(BaseModel):
    function_name: str = Field(..., description="Name of the primary function being tested")
    modernized_code: str = Field(..., description="Modernized TypeScript/ES6+ version of the legacy code")
    tests: List[TestCase] = Field(default_factory=list, description="List of equivalence test cases")
    warnings: List[str] = Field(default_factory=list, description="Warnings or caveats regarding code behavior")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Machine readable error code")
    detail: str = Field(..., description="Human readable explanation")
