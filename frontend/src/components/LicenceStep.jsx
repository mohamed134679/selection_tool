import { useProjectDraft } from "../context/ProjectDraftContext";
import { useSearchParams } from "react-router-dom";

export default function LicenceStep({ onNext }) {
const { projectDraft, setProjectDraft } = useProjectDraft();
const [searchParams, setSearchParams] = useSearchParams();
const step = searchParams.get("step") || "yesno";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div
            onClick={() => updateLicences("buildTime", { wanted: true })}
            className={`rounded-2xl border p-6 cursor-pointer transition ${
              wanted === true
                ? "border-green-600 shadow-md bg-green-50"
                : "border-gray-200 hover:border-green-600 hover:shadow-md"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900">Yes</h3>
          </div>
          <div
            onClick={() => updateLicences("buildTime", { wanted: false })}
            className={`rounded-2xl border p-6 cursor-pointer transition ${
              wanted === false
                ? "border-green-600 shadow-md bg-green-50"
                : "border-gray-200 hover:border-green-600 hover:shadow-md"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900">No</h3>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            disabled={wanted === null}
            onClick={() => setSearchParams({ step: wanted ? "tier" : "orchestration" })}
            className={`rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${
              wanted === null ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            Next
          </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => updateLicences("buildTime", { tier: "Standard" })}
          className={`rounded-2xl border p-6 cursor-pointer transition ${
            tier === "Standard"
              ? "border-green-600 shadow-md bg-green-50"
              : "border-gray-200 hover:border-green-600 hover:shadow-md"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900">Standard</h3>
        </div>
        <div
          onClick={() => updateLicences("buildTime", { tier: "Professional" })}
          className={`rounded-2xl border p-6 cursor-pointer transition ${
            tier === "Professional"
              ? "border-green-600 shadow-md bg-green-50"
              : "border-gray-200 hover:border-green-600 hover:shadow-md"
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900">Professional</h3>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          disabled={tier === null}
          onClick={() => setSearchParams({ step: tier === "Standard" ? "addons" : "orchestration" })}
          className={`rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${
            tier === null ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
if (step === "addons") {
    return (
        <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add-ons</h2>
        <p className="text-gray-600 mb-6">Select any add-ons for your Standard licence (optional).</p>
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
        const nodeCountValid = nodeCount && Number(nodeCount) >= 1 && Number(nodeCount) <= 500;
        return (
            <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Orchestration Licence</h2>
            <p className="text-gray-600 mb-6">How many orchestrated nodes does this project need?</p>
            <input
                type="number"
                min="1"
                max="500"
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


