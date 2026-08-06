import { useState } from "react";
import HmiStep from "../components/HmiStep.jsx";
import { useNavigate } from "react-router-dom";

export default function Hmi() {
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto p-8">
      <HmiStep
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNext={() => navigate("/licence")}
      />
    </div>
  );
}
