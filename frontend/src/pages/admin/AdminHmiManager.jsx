import { useEffect, useState } from "react";
import { createCatalogItem, updateCatalogItem, deleteCatalogItem } from "../../api.js";
import PartNumbersEditor from "../../components/admin/PartNumbersEditor.jsx";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const BRANDS = ["Schneider", "Third-Party"];

const emptyForm = {
  Name: "",
  brand: "Schneider",
  image: "",
  license: "",
  partNumbers: [],
};

export default function AdminHmiManager() {
  const [items, setItems] = useState([]);
  const [licenseOptions, setLicenseOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:3000/hmi").then((r) => r.json()),
      fetch("http://localhost:3000/license").then((r) => r.json()),
    ])
      .then(([hmi, lic]) => {
        setItems(hmi);
        setLicenseOptions(lic);
      })
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
      Name: item.Name || "",
      brand: item.brand || "Schneider",
      image: item.image || "",
      license: item.license || "",
      partNumbers: item.partNumbers || [],
    });
    setEditingId(item._id);
    setSaveError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.Name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const payload = {
      Name: form.Name.trim(),
      brand: form.brand,
      image: form.image || undefined,
      license: form.license || undefined,
      partNumbers: form.partNumbers.filter((pn) => pn.code && pn.code.trim()),
    };
    try {
      if (editingId) {
        await updateCatalogItem("hmi", editingId, payload);
      } else {
        await createCatalogItem("hmi", payload);
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
    if (!window.confirm(`Delete "${item.Name}"? This can't be undone.`)) return;
    try {
      await deleteCatalogItem("hmi", item._id);
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
          Add HMI
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item._id} className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-semibold text-gray-900">{item.Name}</h3>
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
            <p className="text-sm text-gray-500">{item.brand}</p>
            {item.partNumbers?.length > 0 && (
              <p className="text-xs font-mono text-gray-400 mt-2">
                {item.partNumbers.length} reference{item.partNumbers.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit HMI" : "Add HMI"}
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
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Brand *</label>
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Image URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Reference numbers</label>
                <PartNumbersEditor
                  value={form.partNumbers}
                  onChange={(pn) => setForm({ ...form, partNumbers: pn })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Associated license</label>
                <select
                  value={form.license}
                  onChange={(e) => setForm({ ...form, license: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  <option value="">None</option>
                  {licenseOptions.map((lic) => (
                    <option key={lic._id} value={lic._id}>{lic.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="text-sm text-gray-600 hover:underline">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create HMI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}