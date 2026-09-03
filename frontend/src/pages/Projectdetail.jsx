//projectdetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Cpu,
  Monitor,
  ShieldCheck,
  Calendar,
  User,
  Trash2,
  Paperclip,
  Check,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { isHarmonyP6 } from "../lib/harmonyP6";
import { buildRequiredLicenses } from "../lib/licensing";
import { useProjectDraft } from "../context/ProjectDraftContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { authFetch } from "../api.js";

const FILE_BASE = "http://localhost:3000";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadProjectForEdit } = useProjectDraft();
  const [project, setProject] = useState(null);
  const [licenseCatalog, setLicenseCatalog] = useState([]);
  const [hmiCatalog, setHmiCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      setError("You must be signed in to view this project.");
      setLoading(false);
      return;
    }

    authFetch(`http://localhost:3000/projects/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load project");
        }
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch("http://localhost:3000/license")
      .then((res) => res.json())
      .then(setLicenseCatalog)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/hmi")
      .then((res) => res.json())
      .then(setHmiCatalog)
      .catch(() => {});
  }, []);

async function handleDelete() {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await authFetch(`http://localhost:3000/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete project");
      }
      navigate("/projects", { replace: true });
    } catch (err) {
      setDeleting(false);
      alert(err.message);
    }
  }

  function handleEditAndResubmit() {
    loadProjectForEdit(project);
    navigate("/hardware");
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mb-6" />
        <div className="h-40 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
          {error}
        </p>
      </div>
    );
  }

  if (!project) return null;

  const licences = project.licences || {};
  const buildTime = licences.buildTime || {};
  const orchestration = licences.orchestration || {};
  const communication = licences.communication || {};

  const totalIoPoints = (project.SelectedHw || []).reduce(
    (sum, entry) => sum + (Number(entry.ioPoints) || 0) * (entry.quantity || 1),
    0
  );

  // When consolidated onto Harmony P6, project.Hmi_id is null — fall back to
  // the Harmony P6 catalog entry purely to attribute its license, if any.
  const activeHmi = project.hmiUsesControlHw
    ? hmiCatalog.find(isHarmonyP6)
    : project.Hmi_id;

// populated hardware document (routes/projects.js populates
  // SelectedHw.hw_id), so no separate catalog lookup is needed.
  const hardwareLicenseIds = (project.SelectedHw || [])
    .map((entry) => entry.hw_id?.license)
    .filter(Boolean);

  const requiredLicenses = buildRequiredLicenses({
    buildTimeWanted: buildTime.wanted,
    buildTimeTier: buildTime.tier,
    buildTimeAddons: buildTime.addons,
    totalIoPoints,
    orchestrationNodeCount: orchestration.nodeCount,
    protocols: communication.protocols,
    licenseCatalog,
    hmiLicenseId: activeHmi?.license,
    hardwareLicenseIds,
  });

  const consolidatedHwRef = project.hmiUsesControlHw
    ? (project.SelectedHw || []).find((entry) => isHarmonyP6(entry.hw_id))?.refNumber
    : null;

  // Group by hardware + reference number + IO reference number, since two
  // units of the same hardware can differ on any of those. Each group also
  // collects every uploaded attachment from its member units.
  const hwGroups = {};
  (project.SelectedHw || []).forEach((entry) => {
    const hwKey = entry.hw_id?._id || entry.hw_id;
    const key = `${hwKey}::${entry.refNumber || "no-ref"}::${entry.ioRefNumber || "no-io-ref"}`;
    if (!hwGroups[key]) {
      hwGroups[key] = {
        hw: entry.hw_id,
        refNumber: entry.refNumber,
        ioRefNumber: entry.ioRefNumber,
        count: 0,
        ioPoints: 0,
        attachments: [],
      };
    }
    hwGroups[key].count += 1;
    hwGroups[key].ioPoints += Number(entry.ioPoints) || 0;
    if (entry.attachmentUrl) {
      hwGroups[key].attachments.push(entry.attachmentUrl);
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="flex items-start justify-between mb-2 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <StatusBadge status={project.reviewStatus} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.reviewStatus === "needs_edit" && (
            <button
              onClick={handleEditAndResubmit}
              className="inline-flex items-center gap-1.5 text-sm text-green-700 border border-green-200 hover:bg-green-50 rounded-lg px-3 py-1.5 transition"
            >
              <Pencil className="w-4 h-4" />
              Edit & Resubmit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {project.reviewStatus === "needs_edit" && project.reviewComment && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
              Admin requested changes
            </p>
            <p className="text-sm text-red-800">{project.reviewComment}</p>
          </div>
        </div>
      )}

      {project.description && (
        <p className="text-gray-600 mb-4">{project.description}</p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-10 pb-6 border-b border-gray-200">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {project.createdAt
            ? new Date(project.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Unknown date"}
        </span>
{(project.createdBy?.username || project.createdByUsername) && (
  <span className="inline-flex items-center gap-1.5">
    <User className="w-4 h-4" />
    {project.createdBy?.username || project.createdByUsername}
    {!project.createdBy && <span className="text-gray-400 italic ml-1">(deleted)</span>}
  </span>
)}
      </div>

      {/* Hardware */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Hardware</h2>
        </div>
        {Object.keys(hwGroups).length === 0 ? (
          <p className="text-sm text-gray-500">No hardware selected.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(hwGroups).map(({ hw, refNumber, ioRefNumber, count, ioPoints, attachments }, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{hw?.Name || "Unknown hardware"}</p>

                {refNumber && (
                  <p className="text-xs font-mono text-green-700 mt-1">Ref: {refNumber}</p>
                )}
                {ioRefNumber && (
                  <p className="text-xs font-mono text-blue-700 mt-0.5">IO Ref: {ioRefNumber}</p>
                )}

                <p className="text-sm text-gray-500 mt-1">
                  Qty: {count} {ioPoints > 0 && `· ${ioPoints} IO points`}
                </p>

                {attachments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {attachments.map((url, j) => (
                      <a
                        key={j}
                        href={`${FILE_BASE}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-700 hover:underline"
                      >
                        <Paperclip className="w-3 h-3 flex-shrink-0" />
                        Attachment {attachments.length > 1 ? j + 1 : ""}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HMI */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">HMI</h2>
        </div>
        {project.hmiUsesControlHw ? (
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
        ) : project.Hmi_id ? (
          <div className="rounded-xl border border-gray-200 p-4 inline-flex items-center gap-4">
            {project.Hmi_id.image && (
              <img
                src={project.Hmi_id.image}
                alt={project.Hmi_id.Name}
                className="w-16 h-16 object-contain"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{project.Hmi_id.Name}</p>
              <p className="text-sm text-gray-500">{project.Hmi_id.brand}</p>
              {project.hmiRefNumber && (
                <p className="text-xs font-mono text-green-700 mt-1">
                  Ref: {project.hmiRefNumber}
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
        <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Build Time: </span>
            <span className="text-gray-900">
              {buildTime.wanted
                ? `${buildTime.tier}${
                    buildTime.addons?.length ? ` (${buildTime.addons.join(", ")})` : ""
                  }`
                : "Not needed"}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Runtime IO Points: </span>
            <span className="text-gray-900">{totalIoPoints || "—"}</span>
          </p>
          <p>
            <span className="text-gray-500">Orchestration Nodes: </span>
            <span className="text-gray-900">{orchestration.nodeCount || "—"}</span>
          </p>
          <p>
            <span className="text-gray-500">Communication Protocols: </span>
            <span className="text-gray-900">
              {communication.protocols?.length ? communication.protocols.join(", ") : "None"}
            </span>
          </p>
        </div>
      </section>

      {/* Required Licenses */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Licenses</h2>
        {requiredLicenses.length === 0 ? (
          <p className="text-sm text-gray-500">No licences required.</p>
        ) : (
          <div className="space-y-2">
            {requiredLicenses.map(({ lic, quantity }) => (
              <div
                key={lic._id}
                className="rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <span className="font-medium text-gray-900 flex items-center gap-2">
                  {lic.name}
                  {quantity > 1 && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                      × {quantity}
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-400 font-mono">{lic.reference_no}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}