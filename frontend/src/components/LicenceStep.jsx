import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function LicenceStep({ onNext }) {
const [wantsBuildTime, setWantsBuildTime] = useState(null);
const [engineeringTier, setEngineeringTier] = useState(null);
const [addons, setAddons] = useState([]);
const [searchParams, setSearchParams] = useSearchParams();
const [ioPoints, setIoPoints] = useState("");
const [nodeCount, setNodeCount] = useState("");
const [protocols, setProtocols] = useState([]);
const step = searchParams.get("step") || "yesno";
const selectedHardware = { name: "M580 dPAC" }; // placeholder until HW selection page exists
function toggleAddon(name) {
  setAddons((prev) =>
    prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
  );
}
function toggleProtocol(name) {
  setProtocols((prev) =>
    prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
  );
}
  if (step === "yesno") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Licences</h2>
        <p className="text-gray-600 mb-6">Do you need a Build Time (Engineering) licence?</p>
        <p className="text-sm text-gray-500 mb-6">Build Time licences are single-seat and perpetual.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            onClick={() => {setWantsBuildTime(true);
                           setSearchParams({ step: "tier" })}
            }
            className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">Yes</h3>
          </div>
          <div
            onClick={() => {setWantsBuildTime(false);
                           setSearchParams({ step: "runtime" })}
            }
            className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">No</h3>
          </div>
        </div>
      </div>
    );
  }
  if (step === "tier") {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Engineering Licence</h2>
      <p className="text-gray-600 mb-6">Choose a tier.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          onClick={() => {setEngineeringTier("Standard")
                         setSearchParams({ step: "addons" })}
          }
          className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Standard</h3>
        </div>
        <div
          onClick={() => {setEngineeringTier("Professional")
                         setSearchParams({ step: "runtime" })}
          }
          className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
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
        <div className="flex flex-col gap-3 mb-6">
            {["High Availability", "Asset Link", "Procedural Libraries"].map((name) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={addons.includes(name)}
                onChange={() => toggleAddon(name)}
                />
                {name}
            </label>
            ))}
        </div>
        <button
            onClick={() => setSearchParams({ step: "runtime" })}
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
        >
            Continue
        </button>
        </div>
  );
}
   if (step === "runtime"){
    const ioPointsValid = ioPoints && Number(ioPoints) >= 1 && Number(ioPoints) <= 5000;
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Runtime Licence</h2>
            <p className="text-gray-600 mb-2">Hardware: {selectedHardware.name}</p>
            <p className="text-gray-600 mb-6">How many IO points does this hardware need?</p>
            <input
                type="number"
                min="1"
                max="5000"
                value={ioPoints}
                onChange={(e) => setIoPoints(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-48"
                placeholder="e.g. 100"
            />
            <button
                onClick={() => setSearchParams({ step: "orchestration" })}
                disabled={!ioPointsValid}
                className={`mt-6 ml-4 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${!ioPointsValid ? "opacity-40 cursor-not-allowed" : ""}`}
            >
                Next
            </button>
        </div>
    );
}
    if (step === "orchestration") {
        const nodeCountValid = nodeCount && Number(nodeCount) >= 1 && Number(nodeCount) <= 500;
        return (
            <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Orchestration Licence</h2>
            <p className="text-gray-600 mb-6">How many orchestrated nodes does this project need?</p>
            <input
                type="number"
                min="1"
                max="500"
                value={nodeCount}
                onChange={(e) => setNodeCount(e.target.value)}
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
                    checked={protocols.includes(name)}
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


