import { useEffect, useState } from "react";
import { createCatalogItem, updateCatalogItem, deleteCatalogItem } from "../../api.js";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const emptyForm = { name: "", reference_no: "", description: "" };

export default function AdminLicenseManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function loadAll() {
    setLoading(true);
    fetch("http://localhost:3000/license")
      .then((r) => r.json())
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
    setFormOpen(true);
  }

  function openEdit(item) {
    setForm({
      name: item.name || "",
      reference_no: item.reference_no || "",
      description: item.description || "",
    });
    setEditingId(item._id);
    setSaveError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.reference_no.trim()) {
      setSaveError("Name and reference number are both required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await updateCatalogItem("license", editingId, form);
      } else {
        await createCatalogItem("license", form);
      }
      setFormOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    try {
      await deleteCatalogItem("license", item._id);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add License
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <span className="text-xs font-mono text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                  {item.reference_no}
                </span>
              </div>
              {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => openEdit(item)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-700 hover:bg-green-50 transition"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit License" : "Add License"}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {saveError && (
                <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
                  {saveError}
                </p>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Reference Number *</label>
                <input
                  type="text"
                  value={form.reference_no}
                  onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="text-sm text-gray-600 hover:underline">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create License"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}