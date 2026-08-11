import {createContext, useState, useContext} from "react";

const ProjectDraftContext = createContext();

export const ProjectDraftProvider = ({ children }) => {
  const [projectDraft, setProjectDraft] = useState({
    name: "",
    description: "",
    selectedHw: [],
    hmiId: null,
    licences: {
        buildTime: {wanted: null, tier:null, addons: []},
        runtime: {ioPoints: null},
        orchestration: {nodeCount: null},
        communication: {protocols: []}
    }
  });
  return (
    <ProjectDraftContext.Provider value={{ projectDraft, setProjectDraft }}>
      {children}
    </ProjectDraftContext.Provider>
  );
}
export function useProjectDraft() {
    return useContext(ProjectDraftContext);
}