import { useEffect, useState } from "react";
import { getAdminProjects, getAdminProject, reviewProject } from "../../api.js";
import { X, Cpu, Monitor, ShieldCheck, User, CheckCircle2, AlertCircle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge.jsx";

const FILTERS = [
  { key: "all", label: "History" },
  { key: "pending", label: "Pending Review" },
  { key: "needs_edit", label: "Needs Edit" },
  { key: "approved", label: "Approved" },
];

export default function AdminProjectsReview() {
  const [filter, setFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    getAdminProjects(filter === "all" ? undefined : filter)
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${
              filter === f.key
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading projects...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
          {error}
        </p>
      )}
      {!loading && !error && projects.length === 0 && (
        <p className="text-gray-500 text-sm">No projects in this category.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project) => (
          <button
            key={project._id}
            onClick={() => setSelectedId(project._id)}
            className="text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-green-600 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <StatusBadge status={project.reviewStatus} />
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {project.createdBy?.username || "Unknown user"}
            </p>
            <p className="text-xs text-gray-400">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })
                : ""}
            </p>
          </button>
        ))}
      </div>

      {selectedId && (
        <ProjectReviewModal
          projectId={selectedId}
          onClose={() => setSelectedId(null)}
          onReviewed={() => {
            setSelectedId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProjectReviewModal({ projectId, onClose, onReviewed }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    getAdminProject(projectId)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleApprove() {
    setSubmitting(true);
    setActionError(null);
    try {
      await reviewProject(projectId, "approve");
      onReviewed();
    } catch (err) {
      setActionError(err.message);
      setSubmitting(false);
    }
  }

  async function handleRequestEdit() {
    if (!comment.trim()) {
      setActionError("Please explain what needs to change.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await reviewProject(projectId, "request_edit", comment.trim());
      onReviewed();
    } catch (err) {
      setActionError(err.message);
      setSubmitting(false);
    }
  }

  const totalIoPoints = (project?.SelectedHw || []).reduce(
    (sum, entry) => sum + (Number(entry.ioPoints) || 0), 0
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{project?.name || "Loading..."}</h3>
            {project?.createdBy?.username && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <User className="w-3.5 h-3.5" />
                {project.createdBy.username}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && <p className="text-gray-500 text-sm">Loading...</p>}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
              {error}
            </p>
          )}

          {project && (
            <>
              {project.description && (
                <p className="text-gray-600 mb-6">{project.description}</p>
              )}

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Hardware</h4>
                </div>
                {(project.SelectedHw || []).length === 0 ? (
                  <p className="text-sm text-gray-500">None selected.</p>
                ) : (
                  <div className="space-y-2">
                    {project.SelectedHw.map((entry, i) => (
                      <div key={i} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-900">{entry.hw_id?.Name || "Unknown"}</span>
                        {entry.refNumber && <span className="text-gray-500 font-mono ml-2">Ref: {entry.refNumber}</span>}
                        {entry.ioRefNumber && <span className="text-gray-500 font-mono ml-2">IO Ref: {entry.ioRefNumber}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">HMI</h4>
                </div>
                {project.hmiUsesControlHw ? (
                  <p className="text-sm text-gray-700">Same as Control/IO hardware (Harmony P6)</p>
                ) : project.Hmi_id ? (
                  <p className="text-sm text-gray-700">
                    {project.Hmi_id.Name}
                    {project.hmiRefNumber && <span className="text-gray-500 font-mono ml-2">Ref: {project.hmiRefNumber}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">None selected.</p>
                )}
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Licences</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Build Time: {project.licences?.buildTime?.wanted ? project.licences.buildTime.tier : "Not needed"}</p>
                  <p>Runtime IO Points: {totalIoPoints || "—"}</p>
                  <p>Orchestration Nodes: {project.licences?.orchestration?.nodeCount || "—"}</p>
                  <p>Protocols: {project.licences?.communication?.protocols?.join(", ") || "None"}</p>
                </div>
              </section>

              {project.reviewStatus === "needs_edit" && project.reviewComment && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                    Previous edit request
                  </p>
                  <p className="text-sm text-red-800">{project.reviewComment}</p>
                </div>
              )}

              {actionError && (
                <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {actionError}
                </p>
              )}

              {showCommentBox ? (
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-sm text-gray-600 mb-2 block">What needs to change?</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3"
                    placeholder="e.g. IO point count looks too high for the selected hardware"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowCommentBox(false)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestEdit}
                      disabled={submitting}
                      className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Send Edit Request"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setShowCommentBox(true)}
                    disabled={submitting}
                    className="rounded-lg border border-red-200 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    Write Feedback
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submitting ? "Saving..." : "Approve"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}