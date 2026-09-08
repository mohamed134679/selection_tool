const { buildProjectReportModel } = require("./projectNarrative");
const assert = require("assert");

// --- Case 1: fully populated, "happy path" project ---
const fullProject = {
  name: "Riverside Bottling Line 3",
  description: "Upgrade of the bottling line control system to EAE with redundant control.",
  createdBy: { username: "j.dupont" },
  createdAt: "2026-03-14T10:00:00.000Z",
  reviewStatus: "approved",
  HMI: null,
  number_of_hw: 2,
  SelectedHw: [
    {
      hw_id: { name: "Harmony P6" },
      quantity: 1,
      selected_io_ids: [{ name: "TM3 Digital I/O" }, { name: "TM3 Analog I/O" }],
      ioPoints: 128,
      refNumber: "HW-001",
      ioRefNumber: "IO-001",
    },
    {
      hw_id: { name: "Modicon M580" },
      quantity: 1,
      selected_io_ids: [{ name: "X80 Remote I/O" }],
      ioPoints: 256,
      refNumber: "HW-002",
      ioRefNumber: "IO-002",
    },
  ],
  Hmi_id: { name: "Harmony P6" },
  hmiUsesControlHw: true,
  hmiRefNumber: "HMI-001",
  licences: {
    buildTime: { wanted: true, tier: "Professional", addons: ["High Availability", "Asset Link"] },
    runtime: { ioPoints: 384 },
    orchestration: { nodeCount: 3 },
    communication: { protocols: ["Profinet", "OPC UA as a client"] },
  },
};

const model1 = buildProjectReportModel(fullProject);
assert.strictEqual(model1.title, "Riverside Bottling Line 3");
assert.strictEqual(model1.sections.length, 4);
console.log("=== Case 1: fully populated ===");
model1.sections.forEach((s) => {
  console.log(`\n-- ${s.heading} --`);
  s.paragraphs.forEach((p) => console.log(p));
  if (s.table) console.log("TABLE ROWS:", s.table.rows.length);
});

// --- Case 2: minimal / mostly empty project (new project, nothing filled in) ---
const minimalProject = {
  name: "Untitled Project",
  description: "",
  createdBy: null,
  createdByUsername: "deleted_user_42",
  createdAt: "2026-01-01T00:00:00.000Z",
  reviewStatus: "pending",
  SelectedHw: [],
  licences: {},
};

const model2 = buildProjectReportModel(minimalProject);
console.log("\n\n=== Case 2: minimal project ===");
model2.sections.forEach((s) => {
  console.log(`\n-- ${s.heading} --`);
  s.paragraphs.forEach((p) => console.log(p));
});
assert.ok(model2.sections[0].paragraphs[1].includes("deleted_user_42"));

// --- Case 3: unpopulated refs (raw ObjectId strings) should not throw ---
const unpopulatedProject = {
  name: "Legacy Import",
  createdBy: "64f1a2b3c4d5e6f7a8b9c0d1",
  createdAt: "2025-11-01T00:00:00.000Z",
  reviewStatus: "needs_edit",
  reviewComment: "Please attach hardware datasheets.",
  SelectedHw: [
    { hw_id: "64f1a2b3c4d5e6f7a8b9c0d2", quantity: 1, selected_io_ids: [], ioPoints: 64, refNumber: "HW-010" },
  ],
  Hmi_id: "64f1a2b3c4d5e6f7a8b9c0d3",
  licences: { buildTime: { wanted: false } },
};

const model3 = buildProjectReportModel(unpopulatedProject);
console.log("\n\n=== Case 3: unpopulated refs (should not throw) ===");
model3.sections.forEach((s) => {
  console.log(`\n-- ${s.heading} --`);
  s.paragraphs.forEach((p) => console.log(p));
});

// --- Case 4: missing required field should throw a clear error ---
console.log("\n\n=== Case 4: missing name should throw ===");
try {
  buildProjectReportModel({});
  console.log("FAIL: did not throw");
} catch (e) {
  console.log("OK, threw as expected:", e.message);
}

console.log("\n\nAll assertions passed.");