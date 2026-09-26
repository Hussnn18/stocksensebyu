import { API_BASE_URL } from '../lib/constants';

const TOKEN_KEY = 'stocksense.token'; // saved by AuthContext after POST /auth/login

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Calls the Express API and unwraps `{ success, data }`.
 * Failed calls throw an Error with the server's message plus `status` and `fields` (per-input errors).
 * A 401 also fires `stocksense:unauthorized` so AuthContext can log the user out.
 */
async function request(method, path, { params, body } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const token = readToken();
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Can’t reach the StockSense server. Check that the backend is running.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Empty or non-JSON body: handled below.
  }

  if (response.status === 401) window.dispatchEvent(new Event('stocksense:unauthorized'));

  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `The server returned an error (${response.status}).`);
    error.status = response.status;
    error.fields = payload?.fields;
    throw error;
  }
  return payload && 'data' in payload ? payload.data : payload;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body = {}) => request('POST', path, { body }),
  put: (path, body = {}) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
};
