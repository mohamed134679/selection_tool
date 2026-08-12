import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import StackHeader from "./StackHeader.jsx";

// Order matters: index = step number used by StackHeader's activeStep/onSegmentClick
const ROUTE_FOR_STEP = ["/hardware", "/hmi", "/licence"];
const STEP_FOR_ROUTE = {
  "/hardware": 0,
  "/hmi": 1,
  "/licence": 2,
  "/summary": 3,
};

export default function LiveStackHeader() {
  const { projectDraft } = useProjectDraft();
  const location = useLocation();
  const navigate = useNavigate();
  const [hmiOptions, setHmiOptions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/hmi")
      .then((res) => res.json())
      .then(setHmiOptions)
      .catch(() => {});
  }, []);

  const activeStep = STEP_FOR_ROUTE[location.pathname];

  // Only show on the wizard pages (hardware/hmi/licence/summary)
  if (activeStep === undefined) return null;

  const selectedHmi = hmiOptions.find((h) => h._id === projectDraft.hmiId);

  const licenceConfigured =
    projectDraft.licences.buildTime.wanted !== null ||
    Boolean(projectDraft.licences.orchestration.nodeCount) ||
    projectDraft.licences.communication.protocols.length > 0;

  const values = {
    control:
      projectDraft.selectedHw.length > 0
        ? `${projectDraft.selectedHw.length} item(s)`
        : null,
    hmi: selectedHmi ? selectedHmi.Name : null,
    license: licenceConfigured ? "Configured" : null,
  };

  function handleSegmentClick(step) {
    navigate(ROUTE_FOR_STEP[step]);
  }

  return (
    <StackHeader
      activeStep={activeStep}
      values={values}
      onSegmentClick={handleSegmentClick}
    />
  );
}
