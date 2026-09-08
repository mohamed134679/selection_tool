/**
 * projectReportExcel.js
 *
 * Generates the same project detail report as an .xlsx workbook,
 * client-side, using exceljs.
 *
 * npm install exceljs
 *
 * Unlike the PDF (which reads prose out of projectNarrative.js), Excel is
 * a tabular medium — this pulls the *structured* fields directly off the
 * project so values land in their own cells (sortable/filterable), rather
 * than parsing them back out of narrative sentences.
 */

import ExcelJS from "exceljs";

const BRAND = {
  darkGreen: "FF1C8A3B",
  green: "FF3DCD58",
  headerText: "FFFFFFFF",
  gray: "FF3C4043",
  lightRow: "FFF4F7F5",
};

function resolveName(ref, fallback = "—") {
  if (!ref) return fallback;
  if (typeof ref === "string") return ref;
  return ref.Name || ref.name || ref.username || fallback;
}

function resolveNameIfPopulated(ref) {
  if (ref && typeof ref === "object") return ref.Name || ref.name || ref.username || null;
  return null;
}

function styleSectionTitle(row) {
  row.font = { bold: true, size: 13, color: { argb: BRAND.darkGreen } };
  row.height = 22;
}

function styleTableHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND.headerText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.green } };
    cell.alignment = { vertical: "middle" };
  });
}

/**
 * @param {object} project - populated Project document (plain object)
 * @returns {ExcelJS.Workbook}
 */
export function buildProjectReportWorkbook(project) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EAE Project Export";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Project Report", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });
  sheet.columns = [
    { key: "a", width: 26 },
    { key: "b", width: 26 },
    { key: "c", width: 20 },
    { key: "d", width: 18 },
    { key: "e", width: 24 },
  ];

  // ---- Title block ----
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${project.name || "Untitled Project"} — Project Report`;
  titleCell.font = { bold: true, size: 16, color: { argb: BRAND.darkGreen } };
  sheet.getRow(1).height = 26;

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = `Generated ${new Date().toLocaleDateString()}  |  EcoStruxure Automation Expert`;
  sheet.getCell("A2").font = { italic: true, size: 9, color: { argb: BRAND.gray } };

  let r = 4;

  // ---- Overview ----
  sheet.getCell(`A${r}`).value = "Overview";
  styleSectionTitle(sheet.getRow(r));
  r += 1;

  const overviewRows = project.isDraft
    ? [
        ["Project name", project.name || "—"],
        ["Description", project.description || "—"],
        ["Status", "Preview — not yet saved"],
      ]
    : [
        ["Project name", project.name || "—"],
        ["Description", project.description || "—"],
        ["Created by", resolveName(project.createdBy) || project.createdByUsername || "—"],
        ["Created at", project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"],
        ["Review status", project.reviewStatus || "—"],
        ["Review comment", project.reviewComment || "—"],
      ];
  overviewRows.forEach(([label, value]) => {
    sheet.getCell(`A${r}`).value = label;
    sheet.getCell(`A${r}`).font = { bold: true, color: { argb: BRAND.gray } };
    sheet.mergeCells(`B${r}:E${r}`);
    sheet.getCell(`B${r}`).value = value;
    r += 1;
  });
  r += 1;

  // ---- Hardware ----
  sheet.getCell(`A${r}`).value = "Control Architecture & Hardware";
  styleSectionTitle(sheet.getRow(r));
  r += 1;

  const hwHeaderRow = r;
  ["Hardware", "Quantity", "I/O Points", "Ref. Number", "Connected I/O"].forEach((h, i) => {
    sheet.getRow(hwHeaderRow).getCell(i + 1).value = h;
  });
  styleTableHeader(sheet.getRow(hwHeaderRow));
  r += 1;

  const selectedHw = project.SelectedHw || [];
  if (selectedHw.length === 0) {
    sheet.getCell(`A${r}`).value = "No hardware selected yet.";
    sheet.getCell(`A${r}`).font = { italic: true, color: { argb: BRAND.gray } };
    r += 1;
  } else {
    selectedHw.forEach((item, idx) => {
      const ioNames = (item.selected_io_ids || []).map(resolveNameIfPopulated).filter(Boolean).join(", ") || "—";
      const rowValues = [
        resolveName(item.hw_id, `Hardware ${idx + 1}`),
        item.quantity ?? "—",
        item.ioPoints ?? "—",
        item.refNumber || "—",
        ioNames,
      ];
      const row = sheet.getRow(r);
      rowValues.forEach((v, i) => (row.getCell(i + 1).value = v));
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.lightRow } };
        });
      }
      r += 1;
    });
  }
  r += 1;

  // ---- HMI ----
  sheet.getCell(`A${r}`).value = "HMI Configuration";
  styleSectionTitle(sheet.getRow(r));
  r += 1;

  const hmiRows = [
    ["HMI hardware", resolveName(project.Hmi_id) || project.HMI || "—"],
    ["Uses control hardware", project.hmiUsesControlHw ? "Yes" : "No"],
    ["HMI reference number", project.hmiRefNumber || "—"],
  ];
  hmiRows.forEach(([label, value]) => {
    sheet.getCell(`A${r}`).value = label;
    sheet.getCell(`A${r}`).font = { bold: true, color: { argb: BRAND.gray } };
    sheet.mergeCells(`B${r}:E${r}`);
    sheet.getCell(`B${r}`).value = value;
    r += 1;
  });
  r += 1;

  // ---- Licensing ----
  sheet.getCell(`A${r}`).value = "Licensing";
  styleSectionTitle(sheet.getRow(r));
  r += 1;

  const lic = project.licences || {};
  const bt = lic.buildTime || {};
  const licRows = [
    ["Buildtime license requested", bt.wanted ? "Yes" : "No"],
    ["Buildtime tier", bt.tier || "—"],
    ["Buildtime add-ons", (bt.addons || []).join(", ") || "—"],
    ["Runtime I/O points", (lic.runtime && lic.runtime.ioPoints) ?? "—"],
    ["Orchestration node count", (lic.orchestration && lic.orchestration.nodeCount) ?? "—"],
    ["Communication protocols", ((lic.communication && lic.communication.protocols) || []).join(", ") || "—"],
  ];
  licRows.forEach(([label, value]) => {
    sheet.getCell(`A${r}`).value = label;
    sheet.getCell(`A${r}`).font = { bold: true, color: { argb: BRAND.gray } };
    sheet.mergeCells(`B${r}:E${r}`);
    sheet.getCell(`B${r}`).value = value;
    r += 1;
  });

  return wb;
}

/**
 * Generates the report and triggers a browser download.
 * @param {object} project - populated Project document
 */
export async function downloadProjectReportExcel(project) {
  const wb = buildProjectReportWorkbook(project);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `${(project.name || "project").replace(/[^a-z0-9-_]+/gi, "_")}_report.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}