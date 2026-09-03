import { Plus, X } from "lucide-react";

export default function PartNumbersEditor({ value, onChange }) {
  const rows = value || [];

  function updateRow(index, field, val) {
    const next = rows.map((row, i) => (i === index ? { ...row, [field]: val } : row));
    onChange(next);
  }

  function removeRow(index) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { code: "", label: "" }]);
  }

  return (
    <div>
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              value={row.code || ""}
              onChange={(e) => updateRow(i, "code", e.target.value)}
              placeholder="Code, e.g. BMEP581020"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono flex-1"
            />
            <input
              type="text"
              value={row.label || ""}
              onChange={(e) => updateRow(i, "label", e.target.value)}
              placeholder="Label (optional)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              aria-label="Remove reference"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline"
      >
        <Plus className="w-4 h-4" />
        Add reference number
      </button>
    </div>
  );
}