// A part number is "redundant" if its label says so — this is a naming
// convention in the catalog data (e.g. "M590d Standard Redundant" vs
// "M590d Standard Standalone"), not a hardcoded list of specific codes, so
// any future redundant SKU is picked up automatically without a code change.

export function isRedundantLabel(label) {
  return typeof label === "string" && /redundant/i.test(label);
}