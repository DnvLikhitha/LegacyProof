import pytest
import os
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_process_empty_code():
    response = client.post("/process", json={"legacy_code": ""})
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "invalid_input"
    assert "legacy_code is empty" in data["detail"]


# Mocked Test (Runs without live API keys / network access)
@patch("main.process_legacy_code", new_callable=AsyncMock)
def test_process_with_mocked_llm(mock_process):
    mock_process.return_value = {
        "function_name": "calculateTotal",
        "modernized_code": "export function calculateTotal(price: number, taxRate: number): number { return price + (price * taxRate); }",
        "tests": [
            {
                "id": "test-1",
                "description": "Calculates total with 10% tax",
                "args": [100, 0.1],
                "expected": 110,
            }
        ],
        "warnings": [],
    }

    response = client.post("/process", json={"legacy_code": "function calculateTotal(price, taxRate) { return price + (price * taxRate); }"})
    assert response.status_code == 200
    data = response.json()

    assert data["function_name"] == "calculateTotal"
    assert "export function calculateTotal" in data["modernized_code"]
    assert len(data["tests"]) == 1
    assert data["tests"][0]["id"] == "test-1"
    assert data["tests"][0]["expected"] == 110
    assert data["warnings"] == []


# Live API Tests (Require GROQ_API_KEY or GEMINI_API_KEY in environment)
def test_process_simple_function():
    legacy_code = "function calculateTotal(price, taxRate) { return price + (price * taxRate); }"
    response = client.post("/process", json={"legacy_code": legacy_code})
    assert response.status_code == 200
    data = response.json()

    assert "function_name" in data
    assert "modernized_code" in data
    assert "tests" in data
    assert "warnings" in data

    assert isinstance(data["tests"], list)
    assert len(data["tests"]) > 0
    for test_case in data["tests"]:
        assert "id" in test_case
        assert "description" in test_case
        assert "args" in test_case
        assert "expected" in test_case


def test_process_string_formatter():
    legacy_code = """
    function formatUser(name, role) {
        var formattedRole = role ? role.toUpperCase() : 'GUEST';
        return 'User: ' + name + ' [' + formattedRole + ']';
    }
    """
    response = client.post("/process", json={"legacy_code": legacy_code})
    assert response.status_code == 200
    data = response.json()

    assert data["function_name"] == "formatUser" or "format" in data["function_name"].lower()
    assert "formattedRole" in data["modernized_code"] or "role" in data["modernized_code"]
    assert len(data["tests"]) >= 2


def test_process_jquery_dom_snippet():
    legacy_code = """
    function updateHeader(text) {
        $('#header').text(text);
        return $('#header').html();
    }
    """
    response = client.post("/process", json={"legacy_code": legacy_code})
    assert response.status_code == 200
    data = response.json()

    assert "function_name" in data
    assert "modernized_code" in data
    assert len(data["warnings"]) > 0 or any("dom" in w.lower() or "jquery" in w.lower() or "document" in w.lower() for w in data["warnings"])
