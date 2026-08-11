import { useEffect, useState } from "react";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import HardwarePopup from "./HardwarePopup.jsx";

export default function Hardware() {
  const { projectDraft, setProjectDraft } = useProjectDraft();
  const [hardwareOptions, setHardwareOptions] = useState([]);
  const [popupHw, setPopupHw] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingCategory, setPendingCategory] = useState(null);
  const category = searchParams.get("category");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/hardware")
      .then((res) => res.json())
      .then(setHardwareOptions)
      .catch(() => {});
  }, []);

function getEntries(hwId) {
  return projectDraft.selectedHw.filter((e) => e.hw_id === hwId);
}

function addHardware(hwId, selectedIoIds, ioPoints) {
  setProjectDraft((prev) => ({
    ...prev,
    selectedHw: [...prev.selectedHw, { hw_id: hwId, selected_io_ids: selectedIoIds, ioPoints }],
  }));
}

function removeOneUnit(hwId) {
  setProjectDraft((prev) => {
    const idx = prev.selectedHw.map((e) => e.hw_id).lastIndexOf(hwId);
    if (idx === -1) return prev;
    const next = [...prev.selectedHw];
    next.splice(idx, 1);
    return { ...prev, selectedHw: next };
  });
}

if(!category) {
    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Choose Hardware Category</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div
                    onClick={() => setPendingCategory("SoftdPAC")}
                    className={`rounded-2xl border p-6 cursor-pointer trasition ${pendingCategory === "SoftdPAC" ? "border-green-600 shadow-md" : "border-gray-200 hover:border-green-600 hover:shadow-md"}`}
                >
                    <h3 className="text-lg font-semibold text-gray-900">SoftdPAC</h3>
                </div>
                <div
                    onClick={() => setPendingCategory("IEC61499")}
                    className={`rounded-2xl border p-6 cursor-pointer trasition ${pendingCategory === "IEC61499" ? "border-green-600 shadow-md" : "border-gray-200 hover:border-green-600 hover:shadow-md"}`}
                >
                    <h3 className="text-lg font-semibold text-gray-900">IEC61499</h3>
                </div>
            </div>
            <div className="flex justify-end mt-8">
                <Button
                    disabled={!pendingCategory}
                    onClick={() => setSearchParams({ category: pendingCategory })}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Choose Hardware</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
{hardwareOptions.filter((hw) => hw.type === category).map((hw) => {
  const entries = getEntries(hw._id);
  return (
    <div key={hw._id} className="rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900">{hw.Name}</h3>
      <p className="text-sm text-gray-500 mb-3">{hw.type}</p>
      {hw.description && (
        <p className="text-sm text-gray-700 mb-3">{hw.description}</p>
      )}
      {hw.tags && hw.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {hw.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-gray-600 border border-gray-300 rounded px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {entries.length === 0 ? (
        <Button onClick={() => setPopupHw(hw)}>Add</Button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => removeOneUnit(hw._id)}
            className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700"
          >
            −
          </button>
          <span>{entries.length}</span>
          <button
            onClick={() => setPopupHw(hw)}
           className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
})}

</div>
    <div className="flex justify-end mt-8">
            <Button
                disabled={projectDraft.selectedHw.length === 0}
                onClick={() => navigate("/hmi")}
                className={projectDraft.selectedHw.length === 0 ? "opacity-40 cursor-not-allowed" : ""}
            >
                Next
            </Button>
    </div>
        {popupHw && (
                  <HardwarePopup
                    hw={popupHw}
                    onClose={() => setPopupHw(null)}
                    onApply={(selectedIoIds, ioPoints) => {
                      addHardware(popupHw._id, selectedIoIds, ioPoints);
                      setPopupHw(null);
                    }}
                  />
            )}
    </div>
  );
}
