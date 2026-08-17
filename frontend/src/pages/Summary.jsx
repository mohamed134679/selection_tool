import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import LockedOverlay from "../components/LockedOverlay.jsx";

export default function Summary() {
    const { projectDraft, setProjectDraft } = useProjectDraft();
    const navigate = useNavigate();
    const [hmiOptions,setHmiOptions] = useState([]);
    const [licenseCatalog, setLicenseCatalog] = useState([]);
    const [hardwareCatalog, setHardwareCatalog] = useState([]);
    const [saveError, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("http://localhost:3000/hardware")
            .then((res) => res.json())
            .then(setHardwareCatalog)
            .catch(() => {})
    }, []);
    useEffect(() => {
        fetch("http://localhost:3000/hmi")
            .then((response) => response.json())
            .then((data) => setHmiOptions(data))
            .catch((error) => console.error("Error fetching HMI options:", error));
    }, []);
    useEffect(() => {
        fetch("http://localhost:3000/license")
        .then((res) => res.json())
        .then(setLicenseCatalog)
        .catch(() => {})
    }, []);

    if (projectDraft.locked) {
        return <LockedOverlay />;
    }

    function getControlPackName(ioPoints) {
        if (!ioPoints) return null;
        const packs = [10, 100, 1000, 5000];
        const size = packs.find((max) => Number(ioPoints) <= max);
        return size ? `Control Pack ${size} IO Points` : null;
    }
    function getOrchestrationPackName(nodeCount) {
        if (!nodeCount) return null;
        const packs = [1, 10, 100, 500];
        const size = packs.find((max) => Number(nodeCount) <= max);
        return size ? `Orchestration Pack ${size} Node${size === 1 ? "" : "s"}` : null;
    }
    async function createProject() {
        setSaveError(null);
        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                throw new Error("You must be signed in to create a project.");
            }

            const res = await fetch("http://localhost:3000/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    name: projectDraft.name,
                    description: projectDraft.description,
                    SelectedHw: projectDraft.selectedHw,
                    Hmi_id: projectDraft.hmiId,
                    licences: projectDraft.licences,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                // Access token missing/expired — send the user back to sign in
                // rather than surfacing a raw 401 with no recovery path.
                if (res.status === 401) {
                    navigate("/login");
                    return;
                }
                throw new Error(body.message || "Failed to create project");
            }
            setSaved(true);
            setProjectDraft((prev) => ({ ...prev, locked: true, justCreated: true }));
            navigate("/home", { replace: true });
        } catch (err) {
            setSaveError(err.message);
        }
    }

const addonLicenseNames = {
  "High Availability": "High Availability Add-on",
  "Asset Link": "Asset Link for AVEVA OMI Add-on",
  "Procedural Libraries": "Procedural Automation Add-on",
};

const protocolLicenseNames = {
  "Profinet": "Communication Protocol PROFINET RT IO-Controller Client",
  "IEC 61850": "Communication Protocol IEC 61850",
  "OPC UA as a client": "Communication Protocol OPC UA Client",
};

const requiredLicenseNames = [];

if (projectDraft.licences.buildTime.wanted) {
  requiredLicenseNames.push(`${projectDraft.licences.buildTime.tier} Engineering License`);
  projectDraft.licences.buildTime.addons.forEach((addon) => {
    requiredLicenseNames.push(addonLicenseNames[addon]);
  });
}

const totalIoPoints = projectDraft.selectedHw.reduce(
  (sum, entry) => sum + (Number(entry.ioPoints) || 0) * (entry.quantity || 1),
  0
);
const controlPack = getControlPackName(totalIoPoints);
if (controlPack) requiredLicenseNames.push(controlPack);

const orchestrationPack = getOrchestrationPackName(projectDraft.licences.orchestration.nodeCount);
if (orchestrationPack) requiredLicenseNames.push(orchestrationPack);

projectDraft.licences.communication.protocols.forEach((protocol) => {
  requiredLicenseNames.push(protocolLicenseNames[protocol]);
});

const requiredLicenses = requiredLicenseNames
  .map((name) => licenseCatalog.find((lic) => lic.name === name))
  .filter(Boolean);

    const selectedHmi = hmiOptions.find(hmi => hmi._id === projectDraft.hmiId);
    
    const hmiLicense = selectedHmi?.license
        ? licenseCatalog.find((lic) => lic._id === selectedHmi.license)
        : null;
    if (hmiLicense) requiredLicenses.push(hmiLicense);

    const hwCounts = {};
        projectDraft.selectedHw.forEach((entry) => {
            hwCounts[entry.hw_id] = (hwCounts[entry.hw_id] || 0) + 1;
    });
    
    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Summary</h1>
            <p>HMI: {selectedHmi ? selectedHmi.Name : "None selected"}</p>

            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Licences</h2>
                <p>
                    Build Time: {projectDraft.licences.buildTime.wanted
                        ? `${projectDraft.licences.buildTime.tier}${
                            projectDraft.licences.buildTime.addons.length > 0
                                ? ` (${projectDraft.licences.buildTime.addons.join(", ")})`
                                : ""
                        }`
                        : "Not needed"}
                </p>
                <p>Runtime IO Points: {totalIoPoints || "—"}</p>
                <p>Orchestration Nodes: {projectDraft.licences.orchestration.nodeCount || "—"}</p>
                <p>
                    Communication Protocols: {projectDraft.licences.communication.protocols.length > 0
                        ? projectDraft.licences.communication.protocols.join(",")
                        : "None"}
                </p>
            </div>
            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Hardware</h2>
                <ul className="list-disc list-inside">
                    {Object.entries(hwCounts).map(([hwId, count]) => {
                        const hw = hardwareCatalog.find((h) => h._id === hwId);
                        return (
                            <li key={hwId}>
                                {hw ? hw.Name : hwId} — Qty: {count}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Required Licences</h2>
                {requiredLicenses.length === 0 ? (
                    <p className="text-gray-500">No licences required.</p>
                ) : (
                    <ul className="list-disc list-inside">
                        {requiredLicenses.map((lic) => (
                            <li key={lic._id}>
                                {lic.name} ({lic.reference_no})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
                <div className="mt-8">
                {saveError && <p className="text-sm text-red-700 mb-4">{saveError}</p>}
                {saved ? (
                    <p className="text-green-700 font-medium">Project created!</p>
                ) : (
                    <button
                        disabled={!projectDraft.name}
                        onClick={createProject}
                        className={`rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${
                            !projectDraft.name ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                    >
                        Create Project
                    </button>
                )}
        </div>

        </div>

    );
}
