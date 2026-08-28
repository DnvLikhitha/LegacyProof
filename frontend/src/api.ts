import type { ProcessRequest, ProcessResponse, ErrorResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (err) {
    console.warn('Backend health check failed:', err);
    return false;
  }
}

export async function processLegacyCode(payload: ProcessRequest): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Server returned status ${response.status}`;
    try {
      const errData: ErrorResponse = await response.json();
      if (errData.detail) {
        errorDetail = errData.detail;
      }
    } catch {
      // JSON parse error, use default status text
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
