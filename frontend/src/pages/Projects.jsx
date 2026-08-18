import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Cpu, Monitor, ShieldCheck, Calendar, ArrowRight } from "lucide-react";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError("You must be signed in to view your projects.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:3000/projects", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            `Failed to load projects (${res.status} ${res.statusText}): ${
              body.message || "no message returned"
            }`
          );
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function hasLicences(project) {
    return (
      project.licences?.buildTime?.wanted ||
      Boolean(project.licences?.orchestration?.nodeCount) ||
      (project.licences?.communication?.protocols?.length ?? 0) > 0
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
        <p className="text-gray-600">
          Architectures you've created — visible only to you.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-2xl">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">You haven't created any projects yet.</p>
          <Link to="/home" className="text-green-700 hover:underline text-sm font-medium">
            Start a new project
          </Link>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const hwCount = (project.SelectedHw || []).length;
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 hover:border-green-600 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {project.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition flex-shrink-0 mt-1" />
                </div>

                {project.description ? (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">No description</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                    <Cpu className="w-3 h-3" />
                    {hwCount} hardware
                  </span>
                  {project.Hmi_id?.Name && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                      <Monitor className="w-3 h-3" />
                      {project.Hmi_id.Name}
                    </span>
                  )}
                  {hasLicences(project) && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2.5 py-1">
                      <ShieldCheck className="w-3 h-3" />
                      Licensed
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <Calendar className="w-3 h-3" />
                  {project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Unknown date"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}