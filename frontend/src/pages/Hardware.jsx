import { useEffect, useState } from "react";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import HardwarePopup from "./HardwarePopup.jsx";
import LockedOverlay from "../components/LockedOverlay.jsx";

export default function Hardware() {
  const { projectDraft, setProjectDraft } = useProjectDraft();
  const [hardwareOptions, setHardwareOptions] = useState([]);
  const [popupHw, setPopupHw] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
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

function addHardware(hwId, selectedIoIds, ioPoints, refNumber, attachmentUrl, ioRefNumber) {
  setProjectDraft((prev) => ({
    ...prev,
    selectedHw: [
      ...prev.selectedHw,
      { hw_id: hwId, selected_io_ids: selectedIoIds, ioPoints, refNumber, attachmentUrl, ioRefNumber },
    ],
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

if (projectDraft.locked) {
  return <LockedOverlay />;
}

if(!category) {
    return (
<div className="max-w-5xl mx-auto p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Choose Hardware Category
    </h1>

    <div className="mb-8 rounded-xl border border-green-100 bg-green-50 p-4">
        <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">💡 ProTip:</span>{" "}
            Considerd <span className="font-semibold">SoftdPAC</span> if hardware independence is a project requirement, Existing IPC infrastructure must be reused,
 Multiple communication protocols are expected,
 Vendor lock-in must be avoided,
 Virtualization is required, or no mandatory PLC requirement.
        </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
            onClick={() => setSearchParams({ category: "SoftdPAC" })}
            className="rounded-2xl border p-6 cursor-pointer transition border-gray-200 hover:border-green-600 hover:shadow-md"
        >
            <h3 className="text-lg font-semibold text-gray-900">
                SoftdPAC
            </h3>

            <p className="mt-2 text-sm text-gray-600">
                A virtual PLC runtime used within EcoStruxure Automation Expert.
            </p>

                        <p className="mt-2 text-sm text-gray-600">
It allows the control application to becomes independent from the underlying computing platform.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    Flexible virtual Control
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    Hardware Independent
                </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    Hardware Abstraction
                </span>
            </div>
        </div>

        <div
            onClick={() => setSearchParams({ category: "IEC61499" })}
            className="rounded-2xl border p-6 cursor-pointer transition border-gray-200 hover:border-green-600 hover:shadow-md"
        >
            <h3 className="text-lg font-semibold text-gray-900">
                IEC 61499 Controller
            </h3>

            <p className="mt-2 text-sm text-gray-600">
                A dedicated industrial controller for running your
                IEC 61499 control system.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    Dedicated Controller
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    IEC 61499
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-gray-600">
                    Industrial Control
                </span>
            </div>
        </div>
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
    onApply={(selectedIoIds, ioPoints, refNumber, attachmentUrl, ioRefNumber) => {
      addHardware(popupHw._id, selectedIoIds, ioPoints, refNumber, attachmentUrl, ioRefNumber);
      setPopupHw(null);
    }}
  />
)}
    </div>
  );
}