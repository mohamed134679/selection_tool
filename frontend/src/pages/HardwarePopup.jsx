import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function HardwarePopup({ hw, onApply, onClose }) {
  const [ioOptions, setIoOptions] = useState([]);
  const [selectedIoId, setSelectedIoId] = useState(null);
  const [ioPoints, setIoPoints] = useState("");
  const [selectedRef, setSelectedRef] = useState(null); // NEW

  useEffect(() => {
    fetch("http://localhost:3000/io")
      .then((res) => res.json())
      .then(setIoOptions)
      .catch(() => {});
  }, []);

  const compatibleIo = ioOptions.filter((io) => hw.compatible_io?.includes(io._id));

  const ioPointsValid = ioPoints && Number(ioPoints) >= 1 && Number(ioPoints) <= 5000;
  const hasRefChoices = (hw.partNumbers?.length || 0) > 0;
  const refValid = !hasRefChoices || !!selectedRef; // no partNumbers on this hw → don't block
  const canApply = ioPointsValid && !!selectedIoId && refValid;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{hw.Name} — IO Setup</h3>

        {hasRefChoices && (
          <>
            <p className="text-sm text-gray-600 mb-2">Choose a reference number:</p>
            <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
              {hw.partNumbers.map((pn) => (
                <label key={pn.code} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ref-number"
                    checked={selectedRef === pn.code}
                    onChange={() => setSelectedRef(pn.code)}
                  />
                  <span className="font-mono text-sm">{pn.code}</span>
                  {pn.label && <span className="text-sm text-gray-500">— {pn.label}</span>}
                </label>
              ))}
            </div>
          </>
        )}

        <p className="text-sm text-gray-600 mb-2">Choose an IO module:</p>
        <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
          {compatibleIo.length === 0 && (
            <p className="text-sm text-gray-500">No compatible IO modules found.</p>
          )}
          {compatibleIo.map((io) => (
            <label key={io._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="io-module"
                checked={selectedIoId === io._id}
                onChange={() => setSelectedIoId(io._id)}
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
            onClick={() => onApply([selectedIoId], Number(ioPoints), selectedRef)}
            className={!canApply ? "opacity-40 cursor-not-allowed" : ""}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}