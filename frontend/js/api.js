// js/api.js
export const API_BASE = "http://localhost:5000/api"; // ör: Express/.NET backend

export async function api(
  path,
  { method = "GET", body, auth = false, headers = {} } = {}
) {
  const h = { "Content-Type": "application/json", ...headers };

  if (auth) {
    const token = localStorage.getItem("tiksepet_token");
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg = data?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
