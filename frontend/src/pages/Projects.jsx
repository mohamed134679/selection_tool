import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";

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
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h1>
      <p className="text-gray-600 mb-8">
        Architectures you've created. Only visible to you.
      </p>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-2xl">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">You haven't created any projects yet.</p>
          <Link to="/home" className="text-green-700 hover:underline text-sm mt-2 inline-block">
            Start a new project
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project._id} className="rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-600 mb-3">{project.description}</p>
            )}
            <p className="text-xs text-gray-400 mb-3">
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString()
                : ""}
            </p>
            {project.Hmi_id?.Name && (
              <p className="text-sm text-gray-500">HMI: {project.Hmi_id.Name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
