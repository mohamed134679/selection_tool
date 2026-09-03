import {createContext, useState, useContext} from "react";

const ProjectDraftContext = createContext();

const emptyDraft = {
  name: "",
  description: "",
  locked: false,
  justCreated: false,
  editingProjectId: null, // set when reopening an existing project for edit/resubmit
  selectedHw: [],
  hmiId: null,
  hmiUsesControlHw: false,
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
      name: project.name || "",
      description: project.description || "",
      locked: false,
      justCreated: false,
      editingProjectId: project._id,
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

  return (
    <ProjectDraftContext.Provider value={{ projectDraft, setProjectDraft, loadProjectForEdit }}>
      {children}
    </ProjectDraftContext.Provider>
  );
}
export function useProjectDraft() {
    return useContext(ProjectDraftContext);
}