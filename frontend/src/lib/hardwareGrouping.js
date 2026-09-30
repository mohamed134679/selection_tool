/**
 * hardwareGrouping.js
 *
 * project.SelectedHw has NO quantity field per entry — quantity is
 * represented by pushing multiple identical entries into the array (see
 * Summary.jsx / Hardware.jsx's addHardware, and the comment above
 * hardwareLicenseIds in Summary.jsx: "Redundant hardware pushes two
 * identical SelectedHw entries").
 *
 * ProjectDetail.jsx already does this grouping correctly for display —
 * this is that same logic, extracted so both the PDF narrative and the
 * Excel export count quantity/IO points the same way instead of reading a
 * `quantity` field that doesn't exist.
 *
 * @param {Array} selectedHw - project.SelectedHw
 * @returns {Array<{ hw: object|string, refNumber: string, ioRefNumber: string,
 *   quantity: number, ioPoints: number, ioIds: Array, attachments: string[] }>}
 */
export function groupSelectedHw(selectedHw = []) {
  const groups = new Map();

  selectedHw.forEach((entry) => {
    const hwKey =
      entry.hw_id && typeof entry.hw_id === "object"
        ? entry.hw_id._id || entry.hw_id.Name
        : entry.hw_id;
    const key = `${hwKey}::${entry.refNumber || "no-ref"}::${entry.ioRefNumber || "no-io-ref"}`;

    if (!groups.has(key)) {
      groups.set(key, {
        hw: entry.hw_id,
        refNumber: entry.refNumber || null,
        ioRefNumber: entry.ioRefNumber || null,
        quantity: 0,
        ioPoints: 0,
        ioIds: [],
        attachments: [],
      });
    }

    const g = groups.get(key);
    g.quantity += 1;
    g.ioPoints += Number(entry.ioPoints) || 0;
    if (entry.selected_io_ids) g.ioIds.push(...entry.selected_io_ids);
    if (entry.attachmentUrl) g.attachments.push(entry.attachmentUrl);
  });

  return Array.from(groups.values());
}