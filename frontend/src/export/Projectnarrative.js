/**
 * projectNarrative.js
 *
 * Pure functions that turn a populated Project document (see Project mongoose
 * schema) into plain-language narrative text for the exported report.
 *
 * IMPORTANT: this module expects the *populated* project shape, i.e. the
 * refs below are already resolved to objects, not bare ObjectIds:
 *   - project.SelectedHw[].hw_id            -> Hardware doc { name, ... }
 *   - project.SelectedHw[].selected_io_ids[] -> Io docs [{ name, ... }]
 *   - project.Hmi_id                        -> Hmi doc { name, ... }
 *   - project.createdBy                     -> User doc { username, ... } (optional)
 *
 * If your API returns unpopulated ids, populate() them server-side before
 * calling generateProjectReport(), or pass a lookup map — see
 * `resolveName()` below for the single place that would need to change.
 *
 * No PDF library import here on purpose: this file is plain data
 * transformation and can be unit tested without a DOM/canvas/pdfmake.
 */

import { groupSelectedHw } from "../lib/hardwareGrouping.js";

function resolveName(ref, fallbackLabel = "Unnamed item") {
  if (!ref) return null;
  if (typeof ref === "string") return ref; // unpopulated ObjectId string
  // Hardware/Hmi catalog docs use a capitalized `Name` field; Users use `username`.
  return ref.Name || ref.name || ref.username || fallbackLabel;
}

/** Like resolveName, but returns null instead of the raw id string for
 *  unpopulated refs — used for secondary/list items (e.g. connected I/O)
 *  where showing a bare ObjectId is more confusing than just omitting it. */
function resolveNameIfPopulated(ref) {
  if (ref && typeof ref === "object") return resolveName(ref);
  return null;
}

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function joinList(items, conjunction = "and") {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ${conjunction} ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, ${conjunction} ${clean[clean.length - 1]}`;
}

const REVIEW_STATUS_LABEL = {
  pending: "pending review",
  needs_edit: "returned for edits",
  approved: "approved",
};

// ---- section builders ------------------------------------------------

/**
 * @returns {{ heading: string, paragraphs: string[] }}
 */
function buildOverviewSection(project) {
  const paragraphs = [];

  paragraphs.push(
    project.description
      ? `${project.name} is described as: ${project.description}`
      : `${project.name} does not yet have a description on file.`
  );

  if (project.isDraft) {
    paragraphs.push(
      "This report was generated from the in-progress project summary, before saving. " +
        "Creation date, submitter and review status will appear here once the project has been created."
    );
    return { heading: "Project Overview", paragraphs };
  }

  const createdByName =
    resolveName(project.createdBy) || project.createdByUsername || "an unknown user";
  const createdAt = formatDate(project.createdAt);
  const statusLabel = REVIEW_STATUS_LABEL[project.reviewStatus] || project.reviewStatus;

  let statusSentence = `The project was created by ${createdByName}`;
  if (createdAt) statusSentence += ` on ${createdAt}`;
  statusSentence += statusLabel ? `, and is currently ${statusLabel}.` : ".";
  paragraphs.push(statusSentence);

  if (project.reviewStatus === "needs_edit" && project.reviewComment) {
    paragraphs.push(`Reviewer feedback: ${project.reviewComment}`);
  }

  return { heading: "Project Overview", paragraphs };
}

/**
 * @returns {{ heading: string, paragraphs: string[], table?: object }}
 */
function buildHardwareSection(project) {
  const groups = groupSelectedHw(project.SelectedHw || []);
  const paragraphs = [];

  if (groups.length === 0) {
    paragraphs.push(
      "No control hardware has been selected for this project yet."
    );
    return { heading: "Control Architecture & Hardware", paragraphs };
  }

  paragraphs.push(
    `The architecture is built around ${groups.length} hardware selection${
      groups.length === 1 ? "" : "s"
    }, detailed below.`
  );

  const rows = groups.map((g, idx) => {
    const hwName = resolveName(g.hw, `Hardware item ${idx + 1}`);
    const ioNames = [...new Set(g.ioIds.map(resolveNameIfPopulated).filter(Boolean))];
    return {
      hwName,
      quantity: g.quantity,
      ioPoints: g.ioPoints || "—",
      refNumber: g.refNumber || "—",
      ioRefNumber: g.ioRefNumber || "—",
      ioNames,
      attachmentCount: g.attachments.length,
    };
  });

  // Narrative summary sentence per hardware group.
  rows.forEach((row) => {
    let sentence = `${row.hwName} (quantity: ${row.quantity})`;
    if (row.ioPoints !== "—") sentence += ` is sized for ${row.ioPoints} I/O points in total`;
    if (row.ioNames.length) {
      sentence += ` and communicates with ${joinList(row.ioNames)}`;
    }
    const refs = [];
    if (row.refNumber !== "—") refs.push(`hardware reference ${row.refNumber}`);
    if (row.ioRefNumber !== "—") refs.push(`I/O reference ${row.ioRefNumber}`);
    if (refs.length) sentence += `. Recorded under ${joinList(refs)}`;
    if (row.attachmentCount > 0) {
      sentence += `, with ${row.attachmentCount} attachment${row.attachmentCount === 1 ? "" : "s"} on file`;
    }
    sentence += ".";
    paragraphs.push(sentence);
  });

  const table = {
    headers: ["Hardware", "Qty", "I/O Points", "Ref. Number", "IO Ref. Number", "Connected I/O"],
    rows: rows.map((r) => [
      r.hwName,
      String(r.quantity),
      String(r.ioPoints),
      r.refNumber,
      r.ioRefNumber,
      r.ioNames.length ? r.ioNames.join(", ") : "—",
    ]),
  };

  return { heading: "Control Architecture & Hardware", paragraphs, table };
}

/**
 * @returns {{ heading: string, paragraphs: string[] }}
 */
function buildHmiSection(project) {
  const paragraphs = [];
  const hmiName = resolveName(project.Hmi_id) || project.HMI;

  if (project.hmiDisabled) {
    paragraphs.push("This project does not use an HMI.");
    return { heading: "HMI Configuration", paragraphs };
  }

  if (!hmiName && !project.hmiUsesControlHw) {
    paragraphs.push("No HMI configuration has been defined for this project yet.");
    return { heading: "HMI Configuration", paragraphs };
  }

  if (project.hmiUsesControlHw) {
    paragraphs.push(
      "Visualization is consolidated onto the control hardware: the HMI runtime shares " +
        "the same CPU as the control application rather than running on separate hardware."
    );
  } else if (hmiName) {
    paragraphs.push(
      `Visualization is handled by ${hmiName}, running independently from the control hardware.`
    );
  }

  if (project.hmiRefNumber) {
    paragraphs.push(`HMI reference number: ${project.hmiRefNumber}.`);
  }

  return { heading: "HMI Configuration", paragraphs };
}

/**
 * @returns {{ heading: string, paragraphs: string[] }}
 */
function buildLicensingSection(project) {
  const lic = project.licences || {};
  const paragraphs = [];

  const bt = lic.buildTime || {};
  if (bt.wanted) {
    let sentence = `A ${bt.tier || "Standard"} Buildtime License is required for engineering this project`;
    if (bt.addons && bt.addons.length) {
      sentence += `, with the ${joinList(bt.addons)} add-on${bt.addons.length > 1 ? "s" : ""}`;
    }
    sentence += ".";
    paragraphs.push(sentence);
  } else {
    paragraphs.push("No Buildtime License has been requested for this project.");
  }

  const runtimeIo = lic.runtime && lic.runtime.ioPoints;
  const nodeCount = lic.orchestration && lic.orchestration.nodeCount;
  if (runtimeIo || nodeCount) {
    let sentence = "On the runtime side,";
    const parts = [];
    if (runtimeIo) parts.push(`the SoftdPAC Runtime Control License should be sized for ${runtimeIo} I/O points`);
    if (nodeCount) parts.push(`the Runtime Orchestration License should cover ${nodeCount} node${nodeCount === 1 ? "" : "s"}`);
    sentence += ` ${joinList(parts)}.`;
    paragraphs.push(sentence);
  }

  const protocols = (lic.communication && lic.communication.protocols) || [];
  if (protocols.length) {
    paragraphs.push(
      `Communication add-on licenses are required for ${joinList(protocols)}.`
    );
  }

  return { heading: "Licensing", paragraphs };
}

// ---- public API ---------------------------------------------------------

/**
 * Builds the full narrative model for a project report.
 * @param {object} project - populated Project document (plain object, e.g. via .toObject() / .lean())
 * @returns {{ title: string, sections: Array<{heading: string, paragraphs: string[], table?: object}> }}
 */
function buildProjectReportModel(project) {
  if (!project || !project.name) {
    throw new Error("buildProjectReportModel: project.name is required");
  }

  return {
    title: project.name,
    sections: [
      buildOverviewSection(project),
      buildHardwareSection(project),
      buildHmiSection(project),
      buildLicensingSection(project),
    ],
  };
}

export {
  buildProjectReportModel,
  // exported individually for targeted unit tests
  buildOverviewSection,
  buildHardwareSection,
  buildHmiSection,
  buildLicensingSection,
  resolveName,
  formatDate,
  joinList,
};