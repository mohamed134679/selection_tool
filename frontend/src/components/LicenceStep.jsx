import { useProjectDraft } from "../context/ProjectDraftContext";
import { useSearchParams } from "react-router-dom";
import LockedOverlay from "./LockedOverlay.jsx";
import {
  ORCHESTRATION_PACK_SIZES,
  getOrchestrationPackLines,
  formatOrchestrationPackName,
} from "../lib/licensing";

export default function LicenceStep({ onNext }) {
const { projectDraft, setProjectDraft } = useProjectDraft();
const [searchParams, setSearchParams] = useSearchParams();
const step = searchParams.get("step") || "yesno";

if (projectDraft.locked) {
  return <LockedOverlay />;
}

function toggleAddon(name) {
  const current = projectDraft.licences.buildTime.addons;
  const next = current.includes(name)
    ? current.filter((a) => a !== name)
    : [...current, name];
  updateLicences("buildTime", { addons: next });
}
function toggleProtocol(name) {
  const current = projectDraft.licences.communication.protocols;
  const next = current.includes(name)
    ? current.filter((p) => p !== name)
    : [...current, name];
  updateLicences("communication", { protocols: next });
}
function updateLicences(section, updates){
    setProjectDraft((prev) => ({
        ...prev,
        licences: {
            ...prev.licences,
            [section]: {
                ...prev.licences[section],
                ...updates
            }
        }
    }));
}
  if (step === "yesno") {
    const wanted = projectDraft.licences.buildTime.wanted;
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Licences</h2>
        <p className="text-gray-600 mb-6">Do you need a Build Time (Engineering) licence?</p>
        <p className="text-sm text-gray-500 mb-6">Build Time licences are single-seat and perpetual.</p>

        <div className="mb-8 rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">💡 Tip:</span>{" "}
            The Buildtime licence is the engineering licence used to design,
            develop, test, and deploy your EAE applications. It's{" "}
            <span className="font-semibold">single-seat and perpetual</span> —
            you buy it once per engineering workstation, not per year.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div
            onClick={() => {
              updateLicences("buildTime", { wanted: true });
              setSearchParams({ step: "tier" });
            }}
            className={`rounded-2xl border p-6 cursor-pointer transition ${
              wanted === true
                ? "border-green-600 shadow-md bg-green-50"
                : "border-gray-200 hover:border-green-600 hover:shadow-md"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900">Yes</h3>
          </div>
          <div
            onClick={() => {
              updateLicences("buildTime", { wanted: false });
              setSearchParams({ step: "orchestration" });
            }}
            className={`rounded-2xl border p-6 cursor-pointer transition ${
              wanted === false
                ? "border-green-600 shadow-md bg-green-50"
                : "border-gray-200 hover:border-green-600 hover:shadow-md"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900">No</h3>
          </div>
        </div>
      </div>
    );
  }
  if (step === "tier") {
  const tier = projectDraft.licences.buildTime.tier;
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Engineering Licence</h2>
      <p className="text-gray-600 mb-6">Choose a tier.</p>

      <div className="mb-8 rounded-xl border border-green-100 bg-green-50 p-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">💡 Tip:</span>{" "}
          <span className="font-semibold">Standard</span> covers essential
          features and custom library creation, and already includes the
          Asset Link for Bulk Engineering add-on — you can extend it with
          High Availability, Asset Link for AVEVA OMI, and Procedural
          Automation add-ons.{" "}
          <span className="font-semibold">Professional</span> includes all
          currently available features (all add-ons), plus any new features
          released within the first year after activation. Both are
          available perpetual or subscription-based, and in single-seat or
          multi-seat (1, 3, 10, 100) options.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => {
            updateLicences("buildTime", { tier: "Standard" });
            setSearchParams({ step: "addons" });
          }}
          className={`rounded-2xl border p-6 cursor-pointer transition ${
            tier === "Standard"
              ? "border-green-600 shadow-md bg-green-50"
              : "border-gray-200 hover:border-green-600 hover:shadow-md"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900">Standard</h3>
        </div>
        <div
          onClick={() => {
            updateLicences("buildTime", { tier: "Professional" });
            setSearchParams({ step: "orchestration" });
          }}
          className={`rounded-2xl border p-6 cursor-pointer transition ${
            tier === "Professional"
              ? "border-green-600 shadow-md bg-green-50"
              : "border-gray-200 hover:border-green-600 hover:shadow-md"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900">Professional</h3>
        </div>
      </div>
    </div>
  );
}
if (step === "addons") {
    return (
        <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add-ons</h2>
        <p className="text-gray-600 mb-6">Select any add-ons for your Standard licence (optional).</p>

        <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">💡 Tip:</span>{" "}
            <span className="font-semibold">High Availability</span> adds
            redundancy functions for increased system availability.{" "}
            <span className="font-semibold">Asset Link</span> integrates with
            AVEVA System Platform environments.{" "}
            <span className="font-semibold">Procedural Libraries</span>{" "}
            provide reusable procedural automation functions.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">  
            {["High Availability", "Asset Link", "Procedural Libraries"].map((name) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={projectDraft.licences.buildTime.addons.includes(name)}
                onChange={() => toggleAddon(name)}
                />
                {name}
            </label>
            ))}
        </div>
        <button
            onClick={() => setSearchParams({ step: "orchestration" })}
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
        >
            Continue
        </button>
        </div>
  );
}
    if (step === "orchestration") {
        const nodeCount = projectDraft.licences.orchestration.nodeCount;
        const maxNodes = Math.max(...ORCHESTRATION_PACK_SIZES);
        const nodeCountValid = nodeCount && Number(nodeCount) >= 1 && Number(nodeCount) <= maxNodes;
        const previewLines = nodeCountValid ? getOrchestrationPackLines(nodeCount) : [];

        return (
            <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Orchestration Licence</h2>
            <p className="text-gray-600 mb-6">How many orchestrated nodes does this project need?</p>

            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">💡 Tip:</span>{" "}
                This is the <span className="font-semibold">Runtime Orchestration Licence</span> —
                think of it as the "EAE Core Platform" licence. It's sized by{" "}
                <span className="font-semibold">node count</span>, and applies
                to both physical and virtual EAE controllers. Note this is a
                different licence and sizing parameter than the SoftdPAC
                Runtime Control licence, which is sized by I/O count.
              </p>
            </div>

            <input
                type="number"
                min="1"
                max={maxNodes}
                value={nodeCount || ""}
                onChange={(e) => updateLicences("orchestration", { nodeCount: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-48"
                placeholder="e.g. 10"
            />
            <button
                onClick={() => setSearchParams({ step: "communication" })}
                disabled={!nodeCountValid}
                className={`mt-6 ml-4 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${
                !nodeCountValid ? "opacity-40 cursor-not-allowed" : ""
                }`}
            >
                Next
            </button>

            {previewLines.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 max-w-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Licences needed for {nodeCount} node{Number(nodeCount) === 1 ? "" : "s"}
                </p>
                <div className="space-y-1">
                  {previewLines.map((line) => (
                    <div key={line.size} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{formatOrchestrationPackName(line.size)}</span>
                      <span className="font-semibold text-gray-900">× {line.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
        );

    }
    if(step === "communication"){
          return (
            <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Communication Licences</h2>
            <p className="text-gray-600 mb-2">
                Modbus TCP, Modbus Serial, MQTT, and Ethernet/IP are free — no licence needed.
            </p>
            <p className="text-gray-600 mb-6">Select any of these that also apply (licensed):</p>

            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">💡 Tip:</span>{" "}
                Additional communication licences are needed for protocols
                like PROFINET IO, OPC UA as a client, and EtherCAT. Check
                these during architecture definition to avoid late project
                changes.
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
                {["Profinet", "IEC 61850", "OPC UA as a client"].map((name) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={projectDraft.licences.communication.protocols.includes(name)}
                    onChange={() => toggleProtocol(name)}
                    />
                    {name}
                </label>
                ))}
            </div>
            <button
                onClick={onNext}
                className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
            >
                Finish
            </button>
            </div>
        );
    }
}