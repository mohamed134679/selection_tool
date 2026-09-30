/**
 * projectReportPdf.js
 *
 * Builds and downloads the branded EAE project report as a PDF, entirely
 * client-side, using pdfmake.
 *
 * Setup (once, e.g. in this file or your app's entry point):
 *   npm install pdfmake
 *
 * pdfmake ships its own font set as base64 (vfs_fonts). How you import it
 * depends on your pdfmake version:
 *   import pdfMake from "pdfmake/build/pdfmake";
 *   import pdfFonts from "pdfmake/build/vfs_fonts";
 *   pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
 *
 * (pdfmake >=0.2.x changed the vfs_fonts export shape — the ternary above
 * covers both. If your bundler complains about the vfs_fonts import,
 * check the pdfmake version installed and adjust this one line.)
 */

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildProjectReportModel } from "./projectNarrative.js";
import { SCHNEIDER_LOGO_BASE64 } from "./logoAsset.js";
import { tableToPdfMake } from "../export/Pdftablehelpers.js";

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

// ---- brand ----------------------------------------------------------------

const COLORS = {
  darkGreen: "#1C8A3B",
  green: "#3DCD58",
  gray: "#3C4043",
  lightGray: "#6E7275",
  hairline: "#D8DEDA",
  bg: "#F4F7F5",
};

const PAGE = { width: 612, height: 792 }; // US Letter, points

// ---- static introduction content ------------------------------------------
// Reused verbatim across every report; only the project section below is
// dynamic per project.

const INTRO_PARAGRAPHS = [
  "EcoStruxure Automation Expert (EAE) is Schneider Electric's open, software-defined " +
    "automation platform, built on the IEC 61499 standard. Rather than tying a control " +
    "application to a single, fixed piece of hardware, EAE separates the automation " +
    "software from the underlying computing platform, so control logic, visualization " +
    "and I/O communication become modular services that can be distributed, combined, " +
    "or moved across compatible hardware as a project evolves.",
  "This report summarizes how those choices have been made for this specific project: " +
    "the control hardware selected, the HMI configuration, and the licensing required " +
    "to build and run the application.",
];

// ---- layout builders --------------------------------------------------------

function coverContent(project) {
  return [
    {
      // White card behind the logo, drawn first so the logo paints on top of it.
      canvas: [
        { type: "rect", x: 60, y: 60, w: 190, h: 66, r: 6, color: "#FFFFFF" },
      ],
      absolutePosition: { x: 0, y: 0 },
    },
    {
      image: SCHNEIDER_LOGO_BASE64,
      width: 150,
      absolutePosition: { x: 78, y: 82 },
    },
    {
      text: "EcoStruxure Automation Expert (EAE)",
      color: "#FFFFFF",
      bold: true,
      fontSize: 26,
      absolutePosition: { x: 84, y: 210 },
      width: 440,
    },
    {
      text: "Project Report",
      color: "#FFFFFF",
      fontSize: 15,
      absolutePosition: { x: 84, y: 258 },
      width: 440,
    },
    {
      text: project.name || "Untitled Project",
      color: "#DFF5E4",
      fontSize: 12,
      absolutePosition: { x: 84, y: 288 },
      width: 440,
    },
    {
      text: `Generated ${new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}  |  Public`,
      color: "#DFF5E4",
      fontSize: 9.5,
      absolutePosition: { x: 84, y: 330 },
    },
    // Force the cover to occupy exactly one page.
    { text: "", pageBreak: "after" },
  ];
}

function coverBackground(currentPage) {
  if (currentPage !== 1) return null;
  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: PAGE.width, h: PAGE.height, color: COLORS.darkGreen },
      { type: "rect", x: 0, y: PAGE.height - 190, w: PAGE.width, h: 190, color: COLORS.green },
    ],
  };
}

function introSection() {
  return [
    { text: "Introduction", style: "h1" },
    ...INTRO_PARAGRAPHS.map((p) => ({ text: p, style: "body" })),
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: PAGE.width - 108, y2: 0, lineWidth: 0.6, lineColor: COLORS.hairline }],
      margin: [0, 6, 0, 14],
    },
  ];
}

function projectSections(model) {
  const out = [];
  model.sections.forEach((section) => {
    out.push({ text: section.heading, style: "h2" });
    section.paragraphs.forEach((p) => out.push({ text: p, style: "body" }));
    if (section.table) out.push(tableToPdfMake(section.table));
  });
  return out;
}

// ---- header / footer (skipped on cover page) -------------------------------

function header(currentPage) {
  if (currentPage === 1) return null;
  return {
    margin: [36, 18, 36, 0],
    columns: [
      { image: SCHNEIDER_LOGO_BASE64, width: 60 },
      {
        text: "EcoStruxure Automation Expert — Project Report",
        color: "#FFFFFF",
        bold: true,
        fontSize: 9,
        alignment: "right",
        margin: [0, 8, 0, 0],
      },
    ],
    // background bar drawn separately via `background`
  };
}

function headerBackground(currentPage) {
  if (currentPage === 1) return null;
  return { canvas: [{ type: "rect", x: 0, y: 0, w: PAGE.width, h: 36, color: COLORS.darkGreen }] };
}

function footer(currentPage, pageCount) {
  if (currentPage === 1) return null;
  return {
    margin: [36, 8, 36, 0],
    columns: [
      { text: "Schneider Electric  |  Public", color: COLORS.lightGray, fontSize: 8 },
      {
        text: `Page ${currentPage - 1} of ${pageCount - 1}`,
        color: COLORS.lightGray,
        fontSize: 8,
        alignment: "right",
      },
    ],
  };
}

// ---- styles -----------------------------------------------------------------

const styles = {
  h1: { fontSize: 18, bold: true, color: COLORS.darkGreen, margin: [0, 0, 0, 10] },
  h2: { fontSize: 13, bold: true, color: COLORS.gray, margin: [0, 14, 0, 6] },
  body: { fontSize: 10.2, color: COLORS.gray, lineHeight: 1.3, alignment: "justify", margin: [0, 0, 0, 8] },
  tableHeader: { bold: true, fontSize: 9, color: "#FFFFFF", margin: [4, 4, 4, 4] },
  tableCell: { fontSize: 9, color: COLORS.gray, margin: [4, 4, 4, 4] },
};

// ---- public API ---------------------------------------------------------------

/**
 * @param {object} project - populated Project document (plain object)
 * @returns {object} pdfmake docDefinition
 */
export function buildProjectReportDocDefinition(project) {
  const model = buildProjectReportModel(project);

  return {
    pageSize: "LETTER",
    pageMargins: [36, 54, 36, 48],
    background: (currentPage) => coverBackground(currentPage) || headerBackground(currentPage),
    header: (currentPage) => header(currentPage),
    footer: (currentPage, pageCount) => footer(currentPage, pageCount),
    content: [...coverContent(project), ...introSection(), ...projectSections(model)],
    styles,
    defaultStyle: { font: "Roboto" },
  };
}

/**
 * Generates the report and triggers a browser download.
 * @param {object} project - populated Project document
 */
export function downloadProjectReportPdf(project) {
  const docDefinition = buildProjectReportDocDefinition(project);
  const filename = `${(project.name || "project").replace(/[^a-z0-9-_]+/gi, "_")}_report.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}

/**
 * Opens the report in a new browser tab instead of downloading it.
 * @param {object} project - populated Project document
 */
export function openProjectReportPdf(project) {
  const docDefinition = buildProjectReportDocDefinition(project);
  pdfMake.createPdf(docDefinition).open();
}