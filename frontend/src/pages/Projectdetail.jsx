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
} from "lucide-react";

const addonLicenseNames = {
  "High Availability": "High Availability Add-on",
  "Asset Link": "Asset Link for AVEVA OMI Add-on",
  "Procedural Libraries": "Procedural Automation Add-on",
};

const protocolLicenseNames = {
  Profinet: "Communication Protocol PROFINET RT IO-Controller Client",
  "IEC 61850": "Communication Protocol IEC 61850",
  "OPC UA as a client": "Communication Protocol OPC UA Client",
};

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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [licenseCatalog, setLicenseCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("You must be signed in to view this project.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:3000/projects/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
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

  async function handleDelete() {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:3000/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
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

  const requiredLicenseNames = [];
  if (buildTime.wanted) {
    requiredLicenseNames.push(`${buildTime.tier} Engineering License`);
    (buildTime.addons || []).forEach((addon) => {
      requiredLicenseNames.push(addonLicenseNames[addon]);
    });
  }
  const controlPack = getControlPackName(totalIoPoints);
  if (controlPack) requiredLicenseNames.push(controlPack);
  const orchestrationPack = getOrchestrationPackName(orchestration.nodeCount);
  if (orchestrationPack) requiredLicenseNames.push(orchestrationPack);
  (communication.protocols || []).forEach((protocol) => {
    requiredLicenseNames.push(protocolLicenseNames[protocol]);
  });

  const requiredLicenses = requiredLicenseNames
    .map((name) => licenseCatalog.find((lic) => lic.name === name))
    .filter(Boolean);

  if (project.Hmi_id?.license) {
    const hmiLicense = licenseCatalog.find((lic) => lic._id === project.Hmi_id.license);
    if (hmiLicense) requiredLicenses.push(hmiLicense);
  }

  const hwCounts = {};
  (project.SelectedHw || []).forEach((entry) => {
    const key = entry.hw_id?._id || entry.hw_id;
    if (!hwCounts[key]) hwCounts[key] = { hw: entry.hw_id, count: 0, ioPoints: 0 };
    hwCounts[key].count += 1;
    hwCounts[key].ioPoints += Number(entry.ioPoints) || 0;
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

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
        {project.createdBy?.username && (
          <span className="inline-flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {project.createdBy.username}
          </span>
        )}
      </div>

      {/* Hardware */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Hardware</h2>
        </div>
        {Object.keys(hwCounts).length === 0 ? (
          <p className="text-sm text-gray-500">No hardware selected.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(hwCounts).map(({ hw, count, ioPoints }, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900">{hw?.Name || "Unknown hardware"}</p>
                <p className="text-sm text-gray-500">
                  Qty: {count} {ioPoints > 0 && `· ${ioPoints} IO points`}
                </p>
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
        {project.Hmi_id ? (
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
            {requiredLicenses.map((lic) => (
              <div
                key={lic._id}
                className="rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">{lic.name}</span>
                <span className="text-sm text-gray-400 font-mono">{lic.reference_no}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}