const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function getOptions() {
  const res = await fetch(`${BASE}/options`);
  if (!res.ok) throw new Error("Failed to load options");
  return res.json();
}

export async function getHmiOptions(controlId) {
  const res = await fetch(`${BASE}/options/hmi?controlId=${encodeURIComponent(controlId)}`);
  if (!res.ok) throw new Error("Failed to load HMI options");
  return res.json();
}

export async function postRecommend(payload) {
  const res = await fetch(`${BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to compute recommendation");
  }
  return res.json();
}

export async function getProjectCount() {
  const accessToken = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE}/projects/count`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) throw new Error('Failed to load project count')
  return res.json()
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Login failed');
  return body;
}

export async function register({ username, password, accountType }) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, accountType }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Registration failed');
  return body;
}

export async function uploadFile(file) {
  const accessToken = localStorage.getItem("accessToken");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Upload failed");
  return body; // { url, originalName, mimeType }
}