import {useProjectDraft} from "../context/ProjectDraftContext.jsx";
import HmiStep from "../components/HmiStep.jsx";
import { useNavigate } from "react-router-dom";
import LockedOverlay from "../components/LockedOverlay.jsx";

export default function Hmi() {
  const { projectDraft, setProjectDraft } = useProjectDraft();
  const navigate = useNavigate();

  function setSelectedId(id) {
    setProjectDraft((prev) => ({
      ...prev,
      hmiId: id,
      hmiUsesControlHw: false,
      hmiDisabled: false,
      hmiRefNumber: null,
    }));
  }

  function setHmiRefNumber(code) {
    setProjectDraft((prev) => ({ ...prev, hmiRefNumber: code }));
  }

  function setUseControlHwAsHmi(value) {
    setProjectDraft((prev) => ({
      ...prev,
      hmiUsesControlHw: value,
      hmiDisabled: false,
      hmiId: value ? null : prev.hmiId,
      hmiRefNumber: null,
    }));
  }

  function setNoHmi(value) {
    setProjectDraft((prev) => ({
      ...prev,
      hmiId: null,
      hmiUsesControlHw: false,
      hmiDisabled: value,
      hmiRefNumber: null,
    }));
  }

  if (projectDraft.locked) {
    return <LockedOverlay />;
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <HmiStep
        selectedId={projectDraft.hmiId}
        hmiRefNumber={projectDraft.hmiRefNumber}
        useControlHwAsHmi={projectDraft.hmiUsesControlHw}
        noHmi={projectDraft.hmiDisabled}
        onSelect={setSelectedId}
        onSelectHmiRef={setHmiRefNumber}
        onUseControlHwAsHmi={setUseControlHwAsHmi}
        onSetNoHmi={setNoHmi}
        onNext={() => navigate("/licence")}
      />
    </div>
  );
}