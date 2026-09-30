/**
 * reportAdapters.js
 *
 * The two pages that need an export button hold project data in different
 * shapes:
 *   - ProjectDetail.jsx: `project` from GET /projects/:id, already
 *     populated by the backend (SelectedHw.hw_id -> Hardware doc, Hmi_id ->
 *     Hmi doc, createdBy -> User doc).
 *   - Summary.jsx: `projectDraft` from ProjectDraftContext — an unsaved
 *     draft where selectedHw[].hw_id is a raw catalog id, hmiId is a raw
 *     id, and there's no createdAt/createdBy/reviewStatus yet because
 *     nothing has been saved.
 *
 * These two functions normalize both into the single shape the report
 * builders (projectNarrative.js, projectReportPdf.js, projectReportExcel.js)
 * expect, so those builders never need to know which page called them.
 */

/**
 * @param {object} draft - projectDraft from useProjectDraft()
 * @param {object} deps
 * @param {Array} deps.hardwareCatalog - from GET /hardware
 * @param {object|null} deps.activeHmi - the resolved HMI catalog entry Summary.jsx
 *   already computes (null/ignored when hmiUsesControlHw is true)
 * @returns {object} normalized project-like object, with `isDraft: true`
 */
export function projectFromDraft(draft, { hardwareCatalog = [], activeHmi = null } = {}) {
  const selectedHw = (draft.selectedHw || []).map((entry) => ({
    ...entry,
    hw_id: hardwareCatalog.find((h) => h._id === entry.hw_id) || entry.hw_id,
    // selected_io_ids stay as raw ids here (Summary.jsx doesn't fetch the Io
    // catalog) — projectNarrative/Excel already skip unpopulated io refs
    // rather than printing a raw ObjectId.
  }));

  return {
    name: draft.name || "Untitled Project",
    description: draft.description,
    SelectedHw: selectedHw,
    Hmi_id: draft.hmiDisabled || draft.hmiUsesControlHw ? null : activeHmi,
    hmiUsesControlHw: draft.hmiUsesControlHw,
    hmiDisabled: draft.hmiDisabled,
    hmiRefNumber: draft.hmiRefNumber,
    licences: draft.licences,
    isDraft: true,
  };
}

/**
 * @param {object} project - populated Project document from GET /projects/:id
 * @returns {object} normalized project-like object (passed through as-is —
 *   the backend already populates everything the report builders need)
 */
export function projectFromDetail(project) {
  return project;
}