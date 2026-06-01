import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

const BASE = import.meta.env.VITE_API_URL || '';

const getToken = () => useAuthStore.getState().token;
const getViewingSchoolId = () => useUIStore.getState().viewingSchoolId;

export const apiClient = {
  get:    (path, opts)       => request('GET',    path, null, opts),
  post:   (path, body, opts) => request('POST',   path, body, opts),
  put:    (path, body, opts) => request('PUT',    path, body, opts),
  patch:  (path, body, opts) => request('PATCH',  path, body, opts),
  delete: (path, opts)       => request('DELETE', path, null, opts),
};

async function request(method, path, body, opts = {}) {
  const token = getToken();
  const viewingSchoolId = getViewingSchoolId();

  const headers = {
    ...(token           ? { Authorization: `Bearer ${token}` } : {}),
    ...(body            ? { 'Content-Type': 'application/json' } : {}),
    ...(viewingSchoolId ? { 'x-viewing-school-id': String(viewingSchoolId) } : {}),
    ...(opts?.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.error?.code;
    err.details = data?.error?.details ?? [];
    throw err;
  }

  return data;
}
