let csrfToken = '';

export async function api(path, { signal, ...options } = {}) {
  const response = await fetch(`/api/v1/${path}`, {
    credentials: 'same-origin', signal,
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.method ? { 'X-CSRFToken': csrfToken } : {}), ...options.headers },
  });
  let data;
  try { data = await response.json(); } catch { data = { error: `HTTP ${response.status}` }; }
  if (data.csrfToken) csrfToken = data.csrfToken;
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.fields = data.errors;
    throw error;
  }
  return data;
}

export function post(path, data = {}) {
  return api(path, { method: 'POST', body: JSON.stringify(data) });
}
