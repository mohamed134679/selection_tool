// Shared "is this Harmony P6" check. Harmony P6 gets special treatment in
// several unrelated places — Control/IO reference entry (HardwarePopup),
// HMI reference entry (HmiStep), and the HMI-consolidation feature
// (HmiStep, Summary, Projectdetail) — so the exact match string lives here
// once instead of being retyped in five different files.

export const HARMONY_P6_NAME = "Harmony P6";

/** Accepts either a document ({ Name: "..." }) or a plain name string. */
export function isHarmonyP6(docOrName) {
  if (!docOrName) return false;
  const name = typeof docOrName === "string" ? docOrName : docOrName.Name;
  return name === HARMONY_P6_NAME;
}