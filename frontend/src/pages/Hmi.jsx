import {useProjectDraft} from "../context/ProjectDraftContext.jsx";
import HmiStep from "../components/HmiStep.jsx";
import { useNavigate } from "react-router-dom";

export default function Hmi() {
  const { projectDraft, setProjectDraft } = useProjectDraft();
  const navigate = useNavigate();
  function setSelectedId(id) {
    setProjectDraft((prev) => ({ ...prev, hmiId: id }));
  }
  return (
    <div className="max-w-3xl mx-auto p-8">
      <HmiStep
        selectedId={projectDraft.hmiId}
        onSelect={setSelectedId}
        onNext={() => navigate("/licence")}
      />
    </div>
  );
}
