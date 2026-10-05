// frontend/src/context/ProjectDraftContext.jsx
import {createContext, useState, useContext} from "react";

const ProjectDraftContext = createContext();

const emptyDraft = {
  mode: "project", // "project" | "template" — which flow the wizard is building for
  name: "",
  description: "",
  locked: false,
  justCreated: false,
  editingProjectId: null, // set when reopening an existing project for edit/resubmit
  editingTemplateId: null, // set when reopening an existing template for edit
  templateMeta: null, // { category, imageFile, existingImageUrl } — only used when mode === "template"
  selectedHw: [],
  hmiId: null,
  hmiUsesControlHw: false,
  hmiDisabled: false,
  hmiRefNumber: null,
  licences: {
      buildTime: {wanted: null, tier:null, addons: []},
      runtime: {ioPoints: null},
      orchestration: {nodeCount: null},
      communication: {protocols: []}
  }
};

export const ProjectDraftProvider = ({ children }) => {
  const [projectDraft, setProjectDraft] = useState({ ...emptyDraft });

  // Populates the draft from an already-created project (as returned by
  // GET /projects/:id), so the wizard can be reopened to fix a
  // 'needs_edit' project. locked stays false so the wizard routes are
  // actually reachable; Summary.jsx uses editingProjectId to know it
  // should PUT (resubmit) instead of POST (create new).
  function loadProjectForEdit(project) {
    setProjectDraft({
      mode: "project",
      name: project.name || "",
      description: project.description || "",
      locked: false,
      justCreated: false,
      editingProjectId: project._id,
      editingTemplateId: null,
      templateMeta: null,
      selectedHw: (project.SelectedHw || []).map((entry) => ({
        hw_id: entry.hw_id?._id || entry.hw_id,
        selected_io_ids: (entry.selected_io_ids || []).map((io) => io?._id || io),
        ioPoints: entry.ioPoints,
        refNumber: entry.refNumber,
        attachmentUrl: entry.attachmentUrl,
        ioRefNumber: entry.ioRefNumber,
      })),
      hmiId: project.hmiUsesControlHw ? null : (project.Hmi_id?._id || project.Hmi_id || null),
      hmiUsesControlHw: Boolean(project.hmiUsesControlHw),
      hmiDisabled: Boolean(project.hmiDisabled),
      hmiRefNumber: project.hmiRefNumber || null,
      licences: {
        buildTime: {
          wanted: project.licences?.buildTime?.wanted ?? null,
          tier: project.licences?.buildTime?.tier ?? null,
          addons: project.licences?.buildTime?.addons ?? [],
        },
        runtime: { ioPoints: project.licences?.runtime?.ioPoints ?? null },
        orchestration: { nodeCount: project.licences?.orchestration?.nodeCount ?? null },
        communication: { protocols: project.licences?.communication?.protocols ?? [] },
      },
    });
  }

  // Populates the draft from an already-created template (as returned by
  // GET /templates/:id or a template card in TemplatesPage), so an admin
  // can reopen it in the same wizard used to create it. Summary.jsx uses
  // editingTemplateId to know it should PUT instead of POST to /templates.
  function loadTemplateForEdit(template) {
    setProjectDraft({
      mode: "template",
      name: template.name || "",
      description: template.description || "",
      locked: false,
      justCreated: false,
      editingProjectId: null,
      editingTemplateId: template._id,
      templateMeta: {
        category: template.category || null,
        imageFile: null,
        existingImageUrl: template.imageUrl || null,
      },
      selectedHw: (template.SelectedHw || []).map((entry) => ({
        hw_id: entry.hw_id?._id || entry.hw_id,
        selected_io_ids: (entry.selected_io_ids || []).map((io) => io?._id || io),
        ioPoints: entry.ioPoints,
        refNumber: entry.refNumber,
        attachmentUrl: entry.attachmentUrl,
        ioRefNumber: entry.ioRefNumber,
      })),
      hmiId: template.hmiUsesControlHw ? null : (template.Hmi_id?._id || template.Hmi_id || null),
      hmiUsesControlHw: Boolean(template.hmiUsesControlHw),
      hmiDisabled: Boolean(template.hmiDisabled),
      hmiRefNumber: template.hmiRefNumber || null,
      licences: {
        buildTime: {
          wanted: template.licences?.buildTime?.wanted ?? null,
          tier: template.licences?.buildTime?.tier ?? null,
          addons: template.licences?.buildTime?.addons ?? [],
        },
        runtime: { ioPoints: template.licences?.runtime?.ioPoints ?? null },
        orchestration: { nodeCount: template.licences?.orchestration?.nodeCount ?? null },
        communication: { protocols: template.licences?.communication?.protocols ?? [] },
      },
    });
  }

  // Starts a fresh draft for the admin "create template" wizard.
  function startTemplateDraft() {
    setProjectDraft({
      ...emptyDraft,
      mode: "template",
    });
  }

  return (
    <ProjectDraftContext.Provider value={{ projectDraft, setProjectDraft, loadProjectForEdit, loadTemplateForEdit, startTemplateDraft }}>
      {children}
    </ProjectDraftContext.Provider>
  );
}
export function useProjectDraft() {
    return useContext(ProjectDraftContext);
}