/**
 * reportTableRows.js
 *
 * Pure data prep for the Excel export: turns a project into the exact rows
 * that will be written to the sheet. Kept separate from projectReportExcel.js
 * (which does the actual ExcelJS/styling work) so this logic can be unit
 * tested without the exceljs dependency.
 *
 * Layout produced:
 *   - overviewRows: [label, value] pairs — rendered as their own small
 *     block, unchanged from before.
 *   - detailHeader: column headers for the ONE merged table covering
 *     Hardware + HMI + Licensing.
 *   - detailRows: a flat list of either
 *       { type: "section", label }              — a bold section divider
 *       { type: "data", cells: [7 values] }      — a real table row
 *     all inside the same continuous bordered table, so there are no gaps
 *     between Hardware/HMI/Licensing the way there used to be.
 */

import { groupSelectedHw } from "../lib/hardwareGrouping.js";

function resolveName(ref, fallback = "—") {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  return ref.Name || ref.name || ref.username || fallback;
}

function resolveNameIfPopulated(ref) {
  if (ref && typeof ref === "object") return ref.Name || ref.name || ref.username || null;
  return null;
}

const EMPTY = "—";

// detail table columns, shared by Hardware/HMI/Licensing rows:
export const DETAIL_HEADER = ["Item", "Value", "Ref. Number", "Quantity"];

function dataRow(itemNumber, { value = EMPTY, quantity = EMPTY, refNumber = EMPTY } = {}) {
  return { type: "data", cells: [itemNumber, value, refNumber, quantity] };
}
function sectionRow(label) {
  return { type: "section", label };
}

export function buildOverviewRows(project) {
  if (project.isDraft) {
    return [
      ["Project name", project.name || EMPTY],
      ["Description", project.description || EMPTY],
      ["Status", "Preview — not yet saved"],
    ];
  }
  const rows = [
    ["Project name", project.name || EMPTY],
    ["Description", project.description || EMPTY],
    ["Created by", resolveName(project.createdBy) || project.createdByUsername || EMPTY],
    ["Created at", project.createdAt ? new Date(project.createdAt).toLocaleDateString() : EMPTY],
    ["Review status", project.reviewStatus || EMPTY],
    ["Review comment", project.reviewComment || EMPTY],
  ];
  return rows;
}

export function buildDetailRows(project) {
  const rows = [];
  let n = 0;
  const nextItem = () => ++n;
  const startSection = (label) => {
    n = 0;
    rows.push(sectionRow(label));
  };

  // ---- Hardware ----
  startSection("Control Architecture & Hardware");
  const hwGroups = groupSelectedHw(project.SelectedHw || []);
  if (hwGroups.length === 0) {
    rows.push(dataRow(nextItem(), { value: "No hardware selected yet." }));
  } else {
    hwGroups.forEach((g, idx) => {
      rows.push(
        dataRow(nextItem(), {
          value: resolveName(g.hw, `Hardware ${idx + 1}`),
          quantity: g.quantity,
          refNumber: g.refNumber || EMPTY,
        })
      );
    });
  }

  // ---- HMI ----
  startSection("HMI Configuration");
  const hmiName = resolveName(project.Hmi_id) || project.HMI || EMPTY;
  rows.push(
    dataRow(nextItem(), {
      value: project.hmiDisabled
        ? "No HMI"
        : project.hmiUsesControlHw
          ? "Same as Control/IO hardware"
          : hmiName,
      quantity: project.hmiUsesControlHw || project.hmiDisabled ? 0 : 1,
      refNumber: project.hmiRefNumber || EMPTY,
    })
  );

  // ---- Licensing ----
  startSection("Licensing");
  const lic = project.licences || {};
  const bt = lic.buildTime || {};
  rows.push(dataRow("Buildtime license requested", { value: bt.wanted ? "Yes" : "No" }));
  if (bt.wanted) {
    rows.push(dataRow("Buildtime tier", { value: bt.tier || EMPTY }));
    rows.push(dataRow("Buildtime add-ons", { value: (bt.addons || []).join(", ") || "None" }));
  }

  const totalIoPoints = lic.runtime && lic.runtime.ioPoints;
  rows.push(
    dataRow("Runtime I/O points", {
      value: totalIoPoints ? "Yes" : "No",
      quantity: totalIoPoints ?? EMPTY,
    })
  );

  const totalNodeCount = lic.orchestration && lic.orchestration.nodeCount;
  rows.push(
    dataRow("Orchestration node count", {
      value: totalNodeCount ? "Yes" : "No",
      quantity: totalNodeCount ?? EMPTY,
    })
  );

  rows.push(
    dataRow("Communication protocols", {
      value: ((lic.communication && lic.communication.protocols) || []).join(", ") || "None",
    })
  );

  return rows;
}