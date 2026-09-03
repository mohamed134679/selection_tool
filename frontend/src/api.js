// api.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function authHeaders() {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// Wraps fetch with silent access-token refresh. If a request comes back
// 401 (expired/invalid access token), it tries POST /auth/refresh using
// the httpOnly refresh cookie, stores the new access token, and retries
// the original request once. If the refresh itself fails (refresh token
// expired/revoked), it returns the original 401 response untouched so
// callers can handle it as a "must log in again" case.
export async function authFetch(url, options = {}) {
  const doFetch = (token) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

  let res = await doFetch(localStorage.getItem("accessToken"));

  if (res.status === 401) {
    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json();
      localStorage.setItem("accessToken", accessToken);
      res = await doFetch(accessToken);
    }
  }

  return res;
}

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
  const res = await fetch(`${BASE}/projects/count`, {
    headers: authHeaders(),
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
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Upload failed");
  return body;
}

// ---- Admin: users ----

export async function getAllUsers() {
  const res = await fetch(`${BASE}/admin/users`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to load users");
  return body;
}

export async function setUserRole(userId, role) {
  const res = await fetch(`${BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to update role");
  return body;
}

export async function deleteUser(userId) {
  const res = await fetch(`${BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to delete user");
  return body;
}

// ---- Admin: project review ----

export async function getAdminProjects(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${BASE}/admin/projects${query}`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to load projects");
  return body;
}

export async function getAdminProject(id) {
  const res = await fetch(`${BASE}/admin/projects/${id}`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to load project");
  return body;
}

export async function reviewProject(id, action, comment) {
  const res = await fetch(`${BASE}/admin/projects/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, comment }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to review project");
  return body;
}

// ---- Admin: catalog CRUD (Hardware / HMI / License) ----

export async function createCatalogItem(kind, payload) {
  const res = await fetch(`${BASE}/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to create item");
  return body;
}

export async function updateCatalogItem(kind, id, payload) {
  const res = await fetch(`${BASE}/${kind}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to update item");
  return body;
}

export async function deleteCatalogItem(kind, id) {
  const res = await fetch(`${BASE}/${kind}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to delete item");
  return body;
}