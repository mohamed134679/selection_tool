const BASE = "/api";

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
