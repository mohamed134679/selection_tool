import { useEffect, useState } from "react";
import { getAllUsers, setUserRole, deleteUser } from "../../api.js";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const currentUserId = localStorage.getItem("userId");

  function load() {
    setLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(user) {
    setActionError(null);
    setBusyId(user._id);
    const nextRole = user.role === "admin" ? "user" : "admin";
    try {
      await setUserRole(user._id, nextRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: nextRole } : u)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete "${user.username}"? This can't be undone. Their existing projects will remain but show as "Unknown user".`)) {
      return;
    }
    setActionError(null);
    setBusyId(user._id);
    try {
      await deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {loading && <p className="text-gray-500 text-sm">Loading users...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
          {error}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
          {actionError}
        </p>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Account Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user._id === currentUserId;
                return (
                  <tr key={user._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{user.accountType}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{user.status}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                          user.role === "admin"
                            ? "text-green-700 bg-green-50"
                            : "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleRole(user)}
                          disabled={busyId === user._id || (isSelf && user.role === "admin")}
                          title={
                            isSelf && user.role === "admin"
                              ? "You can't remove your own admin access"
                              : undefined
                          }
                          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.role === "admin"
                              ? "text-gray-600 border border-gray-200 hover:bg-gray-50"
                              : "text-green-700 border border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <ShieldOff className="w-3.5 h-3.5" />
                              Demote
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Make Admin
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={busyId === user._id || isSelf}
                          title={isSelf ? "You can't delete your own account" : undefined}
                          className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 text-red-600 border border-red-200 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}