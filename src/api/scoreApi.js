const BASE_URL = '/api';

export async function fetchScore(isin) {
  const response = await fetch(`${BASE_URL}/score?isin=${encodeURIComponent(isin)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.details || body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

