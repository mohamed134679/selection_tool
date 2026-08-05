import { useState } from "react";
import HmiStep from "../components/HmiStep.jsx";

export default function Hmi() {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <div className="max-w-3xl mx-auto p-8">
      <HmiStep
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNext={() => alert("Next clicked!")}
      />
    </div>
  );
}
