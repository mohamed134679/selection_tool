// Shared EAE licensing logic — pack-size denominations, license name
// mappings, and required-license aggregation. Summary.jsx and
// Projectdetail.jsx both derive their "Required Licenses" list from this
// same implementation, so changing a pack size or a license name mapping
// only ever needs to happen in one place.

export const ADDON_LICENSE_NAMES = {
  "High Availability": "High Availability Add-on",
  "Asset Link": "Asset Link for AVEVA OMI Add-on",
  "Procedural Libraries": "Procedural Automation Add-on",
};

export const PROTOCOL_LICENSE_NAMES = {
  "Profinet": "Communication Protocol PROFINET RT IO-Controller Client",
  "IEC 61850": "Communication Protocol IEC 61850",
  "OPC UA as a client": "Communication Protocol OPC UA Client",
};

// Largest first — each size must evenly divide into the one above it for
// the greedy algorithm below to always produce the minimal number of packs.
export const CONTROL_PACK_SIZES = [5000, 1000, 100, 10];

// Kept ascending (ties back to the original single-bucket lookup order);
// getOrchestrationPackLines sorts a descending copy internally.
export const ORCHESTRATION_PACK_SIZES = [1, 10, 100, 500];

/**
 * Greedy "coin change" over a descending list of pack sizes. Only the
 * smallest denomination rounds up, since you can't buy a partial pack.
 * e.g. sizes [1000,100,10], total 1040 -> [{size:1000,qty:1},{size:10,qty:4}]
 */
function computePackLines(total, sizesDescending) {
  let remaining = Number(total) || 0;
  if (remaining <= 0) return [];

  const lines = [];
  for (let i = 0; i < sizesDescending.length - 1; i++) {
    const size = sizesDescending[i];
    const qty = Math.floor(remaining / size);
    if (qty > 0) {
      lines.push({ size, quantity: qty });
      remaining -= qty * size;
    }
  }
  const smallest = sizesDescending[sizesDescending.length - 1];
  if (remaining > 0) {
    lines.push({ size: smallest, quantity: Math.ceil(remaining / smallest) });
  }
  return lines;
}

/**
 * e.g. 1040 IO points -> [{size:1000, quantity:1}, {size:10, quantity:4}]
 *      64 IO points   -> [{size:10, quantity:7}]
 */
export function getControlPackLines(ioPoints) {
  return computePackLines(ioPoints, CONTROL_PACK_SIZES);
}

/**
 * Same greedy breakdown, applied to node count.
 * e.g. 15 nodes -> [{size:10, quantity:1}, {size:1, quantity:5}]
 */
export function getOrchestrationPackLines(nodeCount) {
  const descending = [...ORCHESTRATION_PACK_SIZES].sort((a, b) => b - a);
  return computePackLines(nodeCount, descending);
}

export function formatControlPackName(size) {
  return `Control Pack ${size} IO Points`;
}

export function formatOrchestrationPackName(size) {
  return `Orchestration Pack ${size} Node${size === 1 ? "" : "s"}`;
}

/**
 * Builds the full "Required Licenses" list with quantities, matching names
 * against licenseCatalog. Unmatched names are silently dropped — keep
 * licenseCatalog document names in sync with the constants/formatters above.
 *
 * @param {Object} params
 * @param {boolean} params.buildTimeWanted
 * @param {string} params.buildTimeTier
 * @param {string[]} params.buildTimeAddons
 * @param {number} params.totalIoPoints
 * @param {number} params.orchestrationNodeCount
 * @param {string[]} params.protocols
 * @param {Array} params.licenseCatalog
 * @param {string} [params.hmiLicenseId] - ObjectId of the active HMI's license, if any
 * @returns {Array<{lic: Object, quantity: number}>}
 */
export function buildRequiredLicenses({
  buildTimeWanted,
  buildTimeTier,
  buildTimeAddons,
  totalIoPoints,
  orchestrationNodeCount,
  protocols,
  licenseCatalog,
  hmiLicenseId,
}) {
  const requiredLicenseMap = new Map();
  function addRequired(name, qty = 1) {
    if (!name) return;
    requiredLicenseMap.set(name, (requiredLicenseMap.get(name) || 0) + qty);
  }

  if (buildTimeWanted) {
    addRequired(`${buildTimeTier} Engineering License`);
    (buildTimeAddons || []).forEach((addon) => {
      addRequired(ADDON_LICENSE_NAMES[addon]);
    });
  }

  getControlPackLines(totalIoPoints).forEach((line) => {
    addRequired(formatControlPackName(line.size), line.quantity);
  });

  getOrchestrationPackLines(orchestrationNodeCount).forEach((line) => {
    addRequired(formatOrchestrationPackName(line.size), line.quantity);
  });

  (protocols || []).forEach((protocol) => {
    addRequired(PROTOCOL_LICENSE_NAMES[protocol]);
  });

  const requiredLicenses = Array.from(requiredLicenseMap.entries())
    .map(([name, quantity]) => {
      const lic = (licenseCatalog || []).find((l) => l.name === name);
      return lic ? { lic, quantity } : null;
    })
    .filter(Boolean);

  if (hmiLicenseId) {
    const hmiLicense = (licenseCatalog || []).find((lic) => lic._id === hmiLicenseId);
    if (hmiLicense) {
      const existing = requiredLicenses.find((item) => item.lic._id === hmiLicense._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        requiredLicenses.push({ lic: hmiLicense, quantity: 1 });
      }
    }
  }

  return requiredLicenses;
}