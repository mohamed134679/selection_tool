import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import { Cpu, Check } from "lucide-react";
import { isHarmonyP6 } from "../lib/harmonyP6";
import ReferenceNumberPicker from "../components/ReferenceNumberPicker.jsx";

function RefModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 p-0.5 mb-3">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={
          "text-xs font-medium rounded-full px-3 py-1.5 transition " +
          (mode === "list" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50")
        }
      >
        Choose from list
      </button>
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={
          "text-xs font-medium rounded-full px-3 py-1.5 transition " +
          (mode === "manual" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50")
        }
      >
        Enter manually
      </button>
    </div>
  );
}

export default function HmiStep({
  selectedId,
  hmiRefNumber,
  useControlHwAsHmi,
  onSelect,
  onSelectHmiRef,
  onUseControlHwAsHmi,
  onNext,
}) {
  const { projectDraft } = useProjectDraft();
  const [hmiOptions, setHmiOptions] = useState([]);
  const [hardwareCatalog, setHardwareCatalog] = useState([]);
  const [error, setError] = useState(null);
  const [brand, setBrand] = useState(null);
  const [hmiRefMode, setHmiRefMode] = useState(null); // 'list' | 'manual' | null — Harmony P6 only

  useEffect(() => {
    fetch("http://localhost:3000/hmi")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setHmiOptions(data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/hardware")
      .then((res) => res.json())
      .then(setHardwareCatalog)
      .catch(() => {});
  }, []);

  const harmonyP6HwEntry = projectDraft.selectedHw.find((entry) => {
    const hw = hardwareCatalog.find((h) => h._id === entry.hw_id);
    return isHarmonyP6(hw);
  });
  const usedHarmonyP6InControl = Boolean(harmonyP6HwEntry);

  function useSameHarmonyP6() {
    onSelect(null);
    onUseControlHwAsHmi(true);
  }

  function chooseDifferentHmi() {
    onUseControlHwAsHmi(false);
  }

  const selectedHmiModel = hmiOptions.find((h) => h._id === selectedId) || null;

  const isHarmonyP6Hmi = isHarmonyP6(selectedHmiModel);
  const p6HasFixedRefs = Boolean(selectedHmiModel?.partNumbers && selectedHmiModel.partNumbers.length > 0);
  const hasHmiRefChoices = !isHarmonyP6Hmi && Boolean(
    selectedHmiModel && selectedHmiModel.partNumbers && selectedHmiModel.partNumbers.length > 1
  );

  let hmiRefValid;
  if (isHarmonyP6Hmi) {
    if (hmiRefMode === "list") hmiRefValid = Boolean(hmiRefNumber);
    else if (hmiRefMode === "manual") hmiRefValid = Boolean(hmiRefNumber && hmiRefNumber.trim().length > 0);
    else hmiRefValid = false;
  } else {
    hmiRefValid = !hasHmiRefChoices || Boolean(hmiRefNumber);
  }
  const canAdvance = Boolean(selectedId) && hmiRefValid;

  function switchHmiRefMode(mode) {
    setHmiRefMode(mode);
    onSelectHmiRef(null);
  }

  function selectHmiModel(hmi) {
    if (selectedId === hmi._id) {
      onSelect(null);
      onSelectHmiRef(null);
      setHmiRefMode(null);
      return;
    }
    onSelect(hmi._id);
    setHmiRefMode(null);
    if (isHarmonyP6(hmi)) {
      onSelectHmiRef(null); // user chooses list/manual next
    } else if (hmi.partNumbers && hmi.partNumbers.length === 1) {
      onSelectHmiRef(hmi.partNumbers[0].code);
    } else {
      onSelectHmiRef(null);
    }
  }

  // Consolidated state — no catalog picker needed at all.
  if (useControlHwAsHmi) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
        <p className="text-gray-600 mb-6">Select the visualization deployment for this project.</p>

        <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-green-200">
            <Check className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Using Harmony P6 as HMI</p>
            <p className="text-sm text-gray-700">
              This project's Control/IO hardware (Harmony P6) will also host
              the EAE HMI on the same CPU - no separate HMI device is
              recorded.
            </p>
            {harmonyP6HwEntry && harmonyP6HwEntry.refNumber ? (
              <p className="text-xs font-mono text-green-700 mt-2">
                Ref: {harmonyP6HwEntry.refNumber}
              </p>
            ) : null}
            <button
              onClick={chooseDifferentHmi}
              className="text-sm text-green-700 hover:underline mt-2"
            >
              Choose a different HMI instead
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onNext}>Next</Button>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
        <p className="text-gray-600 mb-4">First, choose the HMI category.</p>

        {usedHarmonyP6InControl && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-green-200">
                <Cpu className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Use the same Harmony P6 as HMI?
                </p>
                <p className="text-sm text-gray-700">
                  You selected Harmony P6 for Control/IO. It can also host
                  the EAE HMI on the same CPU instead of using separate
                  hardware.
                </p>
              </div>
            </div>
            <Button onClick={useSameHarmonyP6} className="flex-shrink-0">
              Yes, use it
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            onClick={() => setBrand("Schneider")}
            className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">Schneider HMI</h3>
          </div>

          <div
            onClick={() => setBrand("Third-Party")}
            className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">Third-Party HMI</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
      <p className="text-gray-600 mb-6">Select the visualization deployment for this project.</p>
      <button onClick={() => setBrand(null)} className="text-sm text-green-700 hover:underline mb-4">
        ← Change category
      </button>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-6">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {
          hmiOptions.filter((hmi) => hmi.brand === brand).map((hmi) => (
            <div
              key={hmi._id}
              className={`rounded-2xl border p-6 cursor-pointer transition ${
                selectedId === hmi._id
                  ? "border-green-600 shadow-md bg-green-50"
                  : "border-gray-200 hover:border-green-600 hover:shadow-md"
              }`}
              onClick={() => selectHmiModel(hmi)}
            >
              {hmi.image && (
                <img src={hmi.image} alt={hmi.Name} className="w-full h-32 object-contain mb-4" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">{hmi.Name}</h3>
              {hmi.partNumbers && hmi.partNumbers.length === 1 ? (
                <p className="text-xs font-mono text-gray-500 mt-2">{hmi.partNumbers[0].code}</p>
              ) : null}
            </div>
          ))
        }
      </div>

      {isHarmonyP6Hmi ? (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Reference number:</p>
          <RefModeToggle mode={hmiRefMode} onChange={switchHmiRefMode} />

          {hmiRefMode === "list" ? (
            p6HasFixedRefs ? (
              <ReferenceNumberPicker
                options={selectedHmiModel.partNumbers}
                selectedCode={hmiRefNumber}
                onSelect={onSelectHmiRef}
                name="hmi-ref-number-list"
              />
            ) : (
              <p className="text-sm text-gray-500 italic">
                No fixed references available yet — switch to "Enter manually" instead.
              </p>
            )
          ) : null}

          {hmiRefMode === "manual" ? (
            <>
              <p className="text-xs text-gray-500 mb-2">
                Configure your Harmony P6 on the Schneider Electric product page below, then paste the product code you were given.
              </p>
              <a
                href="https://www.se.com/eg/en/product-range/22953172-harmony-p6/#products"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline font-medium text-xs block mb-2"
              >
                Open Schneider Electric product page
              </a>
              <input
                type="text"
                value={hmiRefNumber || ""}
                onChange={(e) => onSelectHmiRef(e.target.value)}
                placeholder="e.g. HMIP6CTO..."
                className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono text-sm"
              />
            </>
          ) : null}
        </div>
      ) : null}

      {hasHmiRefChoices ? (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Choose a reference number for {selectedHmiModel.Name}:
          </p>
          <ReferenceNumberPicker
            options={selectedHmiModel.partNumbers}
            selectedCode={hmiRefNumber}
            onSelect={onSelectHmiRef}
            name="hmi-ref-number"
          />
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          disabled={!canAdvance}
          onClick={onNext}
          className={!canAdvance ? "opacity-40 cursor-not-allowed" : ""}
        >
          Next
        </Button>
      </div>
    </div>
  );
}