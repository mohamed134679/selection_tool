import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function HardwarePopup({ hw, onApply, onClose }) {
  const [ioOptions, setIoOptions] = useState([]);
  const [selectedIoIds, setSelectedIoIds] = useState([]);
  const [ioPoints, setIoPoints] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/io")
      .then((res) => res.json())
      .then(setIoOptions)
      .catch(() => {});
  }, []);

  function toggleIo(id) {
    setSelectedIoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const ioPointsValid = ioPoints && Number(ioPoints) >= 1 && Number(ioPoints) <= 5000;
  const canApply = ioPointsValid && selectedIoIds.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{hw.Name} — IO Setup</h3>

        <p className="text-sm text-gray-600 mb-2">Choose IO modules:</p>
        <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
          {ioOptions.map((io) => (
            <label key={io._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIoIds.includes(io._id)}
                onChange={() => toggleIo(io._id)}
              />
              {io.Name}
            </label>
          ))}
        </div>

        <p className="text-sm text-gray-600 mb-2">IO Points:</p>
        <input
          type="number"
          min="1"
          max="5000"
          value={ioPoints}
          onChange={(e) => setIoPoints(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-6"
          placeholder="e.g. 100"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
          <Button
            disabled={!canApply}
            onClick={() => onApply(selectedIoIds, Number(ioPoints))}
            className={!canApply ? "opacity-40 cursor-not-allowed" : ""}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
