//summary.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import { authFetch } from "../api.js";
import LockedOverlay from "../components/LockedOverlay.jsx";
import { Cpu, Monitor, ShieldCheck, FileText, CheckCircle2, AlertCircle, Paperclip, Check, Pencil } from "lucide-react";
import { isHarmonyP6 } from "../lib/harmonyP6";
import { buildRequiredLicenses } from "../lib/licensing";


const FILE_BASE = "http://localhost:3000";

export default function Summary() {
    const { projectDraft, setProjectDraft } = useProjectDraft();
    const navigate = useNavigate();
    const [hmiOptions,setHmiOptions] = useState([]);
    const [licenseCatalog, setLicenseCatalog] = useState([]);
    const [hardwareCatalog, setHardwareCatalog] = useState([]);
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [wasEditing, setWasEditing] = useState(false);

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

    const isEditing = Boolean(projectDraft.editingProjectId);

    async function saveProject() {
        setSaveError(null);
        setSaving(true);
        setWasEditing(isEditing);
        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                throw new Error("You must be signed in to create a project.");
            }

            const payload = {
                name: projectDraft.name,
                description: projectDraft.description,
                SelectedHw: projectDraft.selectedHw,
                Hmi_id: projectDraft.hmiId,
                hmiUsesControlHw: projectDraft.hmiUsesControlHw,
                hmiRefNumber: projectDraft.hmiRefNumber,
                licences: projectDraft.licences,
            };

            const url = isEditing
                ? `http://localhost:3000/projects/${projectDraft.editingProjectId}`
                : "http://localhost:3000/projects";

const res = await authFetch(url, {
    method: isEditing ? "PUT" : "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
});
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                // Access token missing/expired — send the user back to sign in
                // rather than surfacing a raw 401 with no recovery path.
                if (res.status === 401) {
                    navigate("/login");
                    return;
                }
                throw new Error(body.message || (isEditing ? "Failed to save changes" : "Failed to create project"));
            }
            const savedProject = await res.json();
            setSaved(true);
            setProjectDraft((prev) => ({
                ...prev,
                locked: true,
                justCreated: !isEditing,
                editingProjectId: null,
            }));
            navigate(isEditing ? `/projects/${savedProject._id}` : "/home", { replace: true });
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const totalIoPoints = projectDraft.selectedHw.reduce(
        (sum, entry) => sum + (Number(entry.ioPoints) || 0) * (entry.quantity || 1),
        0
    );

    // When consolidated onto Harmony P6, there's no separate hmiId — but the
    // license still belongs to whichever CPU runs HMI services, so we still
    // look up the Harmony P6 HMI catalog entry purely to pull its license.
    const activeHmi = projectDraft.hmiUsesControlHw
        ? hmiOptions.find(isHarmonyP6)
        : hmiOptions.find((hmi) => hmi._id === projectDraft.hmiId);

// One entry per selected hardware unit that has an associated license.
// Redundant hardware pushes two identical SelectedHw entries (see
// Hardware.jsx's addHardware), so this array naturally contains that
// license's id twice — buildRequiredLicenses sums it to quantity 2
// without any redundancy-specific code.
const hardwareLicenseIds = projectDraft.selectedHw
    .map((entry) => hardwareCatalog.find((h) => h._id === entry.hw_id)?.license)
    .filter(Boolean);

const requiredLicenses = buildRequiredLicenses({
    buildTimeWanted: projectDraft.licences.buildTime.wanted,
    buildTimeTier: projectDraft.licences.buildTime.tier,
    buildTimeAddons: projectDraft.licences.buildTime.addons,
    totalIoPoints,
    orchestrationNodeCount: projectDraft.licences.orchestration.nodeCount,
    protocols: projectDraft.licences.communication.protocols,
    licenseCatalog,
    hmiLicenseId: activeHmi?.license,
    hardwareLicenseIds,
});

    const consolidatedHwRef = projectDraft.hmiUsesControlHw
        ? projectDraft.selectedHw.find((entry) => {
            const hw = hardwareCatalog.find((h) => h._id === entry.hw_id);
            return isHarmonyP6(hw);
          })?.refNumber
        : null;

    // Group by hardware + reference number + IO reference number, since two
    // units of the same hardware can now differ on any of those. Each
    // group also collects every uploaded attachment from its member units.
    const hwGroups = {};
    projectDraft.selectedHw.forEach((entry) => {
        const key = `${entry.hw_id}::${entry.refNumber || "no-ref"}::${entry.ioRefNumber || "no-io-ref"}`;
        if (!hwGroups[key]) {
            hwGroups[key] = {
                hwId: entry.hw_id,
                refNumber: entry.refNumber,
                ioRefNumber: entry.ioRefNumber,
                count: 0,
                attachments: [],
            };
        }
        hwGroups[key].count += 1;
        if (entry.attachmentUrl) {
            hwGroups[key].attachments.push(entry.attachmentUrl);
        }
    });

    const hwEntries = Object.entries(hwGroups);

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="mb-10">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-2">
                    {isEditing ? "Editing Project" : "Final Step"}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {projectDraft.name || "Project Summary"}
                </h1>
                {projectDraft.description ? (
                    <p className="text-gray-600">{projectDraft.description}</p>
                ) : (
                    <p className="text-gray-400 italic">No description provided</p>
                )}
                {isEditing && (
                    <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4 flex items-start gap-3">
                        <Pencil className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                            You're editing an existing project. Saving will resubmit it for admin review.
                        </p>
                    </div>
                )}
            </div>

            {/* Hardware */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Hardware</h2>
                </div>
                {hwEntries.length === 0 ? (
                    <p className="text-sm text-gray-500">No hardware selected.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hwEntries.map(([key, { hwId, refNumber, ioRefNumber, count, attachments }]) => {
                            const hw = hardwareCatalog.find((h) => h._id === hwId);
                            return (
                                <div key={key} className="rounded-xl border border-gray-200 p-4">
                                    <p className="font-medium text-gray-900">{hw ? hw.Name : hwId}</p>

                                    {refNumber && (
                                        <p className="text-xs font-mono text-green-700 mt-1">
                                            Ref: {refNumber}
                                        </p>
                                    )}
                                    {ioRefNumber && (
                                        <p className="text-xs font-mono text-blue-700 mt-0.5">
                                            IO Ref: {ioRefNumber}
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-500 mt-1">Qty: {count}</p>

                                    {attachments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                                            {attachments.map((url, i) => (
                                                <a
                                                    key={i}
                                                    href={`${FILE_BASE}${url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-green-700 hover:underline"
                                                >
                                                    <Paperclip className="w-3 h-3 flex-shrink-0" />
                                                    Attachment {attachments.length > 1 ? i + 1 : ""}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* HMI */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">HMI</h2>
                </div>
                {projectDraft.hmiUsesControlHw ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 inline-flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-green-200">
                            <Check className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Same as Control/IO hardware</p>
                            <p className="text-sm text-gray-600">Harmony P6 hosts both Control and HMI</p>
                            {consolidatedHwRef && (
                                <p className="text-xs font-mono text-green-700 mt-1">Ref: {consolidatedHwRef}</p>
                            )}
                        </div>
                    </div>
                ) : activeHmi ? (
                    <div className="rounded-xl border border-gray-200 p-4 inline-flex items-center gap-4">
                        {activeHmi.image && (
                            <img
                                src={activeHmi.image}
                                alt={activeHmi.Name}
                                className="w-16 h-16 object-contain"
                            />
                        )}
                        <div>
                            <p className="font-medium text-gray-900">{activeHmi.Name}</p>
                            {activeHmi.brand && (
                                <p className="text-sm text-gray-500">{activeHmi.brand}</p>
                            )}
                            {projectDraft.hmiRefNumber && (
                                <p className="text-xs font-mono text-green-700 mt-1">
                                    Ref: {projectDraft.hmiRefNumber}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No HMI selected.</p>
                )}
            </section>

            {/* Licences */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Licences</h2>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div>
                        <p className="text-gray-500 mb-0.5">Build Time</p>
                        <p className="text-gray-900 font-medium">
                            {projectDraft.licences.buildTime.wanted
                                ? `${projectDraft.licences.buildTime.tier}${
                                    projectDraft.licences.buildTime.addons.length > 0
                                        ? ` (${projectDraft.licences.buildTime.addons.join(", ")})`
                                        : ""
                                }`
                                : "Not needed"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-0.5">Runtime IO Points</p>
                        <p className="text-gray-900 font-medium">{totalIoPoints || "—"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-0.5">Orchestration Nodes</p>
                        <p className="text-gray-900 font-medium">
                            {projectDraft.licences.orchestration.nodeCount || "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-0.5">Communication Protocols</p>
                        <p className="text-gray-900 font-medium">
                            {projectDraft.licences.communication.protocols.length > 0
                                ? projectDraft.licences.communication.protocols.join(", ")
                                : "None"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Required Licenses */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Required Licenses</h2>
                </div>
                {requiredLicenses.length === 0 ? (
                    <p className="text-sm text-gray-500">No licences required.</p>
                ) : (
                    <div className="space-y-3">
                        {requiredLicenses.map(({ lic, quantity }) => (
                            <div key={lic._id} className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                                        {lic.name}
                                        {quantity > 1 && (
                                            <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                                                × {quantity}
                                            </span>
                                        )}
                                    </p>
                                    <span className="flex-shrink-0 text-xs font-mono text-green-700 bg-green-50 rounded-full px-2.5 py-1">
                                        {lic.reference_no}
                                    </span>
                                </div>
                                {lic.description && (
                                    <p className="text-sm text-gray-600">{lic.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Submit */}
            <div className="border-t border-gray-200 pt-6">
                {saveError && (
                    <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {saveError}
                    </p>
                )}
                {saved ? (
                    <p className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        {wasEditing ? "Changes saved and resubmitted for review!" : "Project created!"}
                    </p>
                ) : (
                    <button
                        disabled={!projectDraft.name || saving}
                        onClick={saveProject}
                        className={`rounded-lg bg-green-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-green-700 transition ${
                            !projectDraft.name || saving ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                    >
                        {saving
                            ? (isEditing ? "Saving..." : "Creating...")
                            : (isEditing ? "Save & Resubmit" : "Create Project")}
                    </button>
                )}
            </div>
        </div>
    );
}