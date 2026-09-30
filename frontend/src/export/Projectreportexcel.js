/**
 * projectReportExcel.js
 *
 * Renders the project report as .xlsx, client-side, using exceljs.
 * npm install exceljs
 *
 * Layout:
 *   - Title block
 *   - Overview — its own small label/value block (unchanged from before)
 *   - ONE continuous table covering Hardware + HMI + Licensing, with bold
 *     green section-divider rows *inside* the same bordered region (no
 *     gaps/separate tables between them anymore).
 *
 * Styling is applied cell-by-cell (not exceljs's built-in table themes) so
 * the colors match the brand green used everywhere else in the report,
 * rather than Excel's default table color scheme.
 */

import ExcelJS from "exceljs";
import { buildOverviewRows, buildDetailRows, DETAIL_HEADER } from "./reportTableRows.js";

const BRAND = {
  darkGreen: "FF1C8A3B",
  green: "FF3DCD58",
  headerText: "FFFFFFFF",
  gray: "FF3C4043",
  lightRow: "FFF4F7F5",
  border: "FFD8DEDA",
};

const thinBorder = { style: "thin", color: { argb: BRAND.border } };
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

function styleSectionTitle(cell) {
  cell.font = { bold: true, size: 13, color: { argb: BRAND.darkGreen } };
}

function styleColumnHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: BRAND.headerText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.green } };
    cell.alignment = { vertical: "middle" };
    cell.border = allBorders;
  });
}

function styleBodyRow(row, zebra) {
  row.eachCell((cell) => {
    cell.border = allBorders;
    if (zebra) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.lightRow } };
    }
  });
}

function styleSectionDividerRow(row, colCount) {
  row.getCell(1).font = { bold: true, color: { argb: BRAND.darkGreen }, size: 11 };
  for (let c = 1; c <= colCount; c++) {
    row.getCell(c).border = { ...allBorders, top: { style: "thin", color: { argb: BRAND.darkGreen } } };
  }
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

  const colCount = DETAIL_HEADER.length; // 7
sheet.columns = [
  { width: 26 }, // Item
  { width: 26 }, // Value
  { width: 22 }, // Ref. Number
  { width: 12 }, // Quantity
];

  // ---- Title block ----
  sheet.mergeCells(1, 1, 1, colCount);
  sheet.getCell("A1").value = `${project.name || "Untitled Project"} — Project Report`;
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: BRAND.darkGreen } };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, colCount);
  sheet.getCell("A2").value = `Generated ${new Date().toLocaleDateString()}  |  EcoStruxure Automation Expert`;
  sheet.getCell("A2").font = { italic: true, size: 9, color: { argb: BRAND.gray } };

  let r = 4;

  // ---- Overview (its own small block, unchanged) ----
  sheet.getCell(`A${r}`).value = "Overview";
  styleSectionTitle(sheet.getCell(`A${r}`));
  r += 1;

  buildOverviewRows(project).forEach(([label, value]) => {
    const row = sheet.getRow(r);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: BRAND.gray } };
    row.getCell(1).border = allBorders;
    row.getCell(2).value = value;
    row.getCell(2).border = allBorders;
    // Only 2 real columns of content here — deliberately NOT merging/
    // bordering columns 3..colCount. A merged "wide" row just to match the
    // detail table's width below leaves those extra cells bordered but
    // empty, which is the "empty cells" problem. Two honest columns, no
    // dead space.
    r += 1;
  });

  r += 1; // gap before the detail table (Overview stays visually separate)

  // ---- ONE continuous table: Hardware + HMI + Licensing ----
  const headerRowIndex = r;
  const headerRow = sheet.getRow(headerRowIndex);
  DETAIL_HEADER.forEach((h, i) => (headerRow.getCell(i + 1).value = h));
  styleColumnHeaderRow(headerRow);
  r += 1;

  let zebra = false;
  buildDetailRows(project).forEach((entry) => {
    const row = sheet.getRow(r);
    if (entry.type === "section") {
      row.getCell(1).value = entry.label;
      sheet.mergeCells(r, 1, r, colCount);
      styleSectionDividerRow(row, colCount);
      zebra = false; // restart zebra striping at the top of each section
    } else {
      entry.cells.forEach((v, i) => (row.getCell(i + 1).value = v));
      styleBodyRow(row, zebra);
      zebra = !zebra;
    }
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