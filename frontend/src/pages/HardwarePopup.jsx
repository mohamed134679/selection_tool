import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { uploadFile } from "../api";

export default function HardwarePopup({ hw, onApply, onClose }) {
  const [ioOptions, setIoOptions] = useState([]);
  const [selectedIoId, setSelectedIoId] = useState(null);
  const [ioPoints, setIoPoints] = useState("");
  const [selectedRef, setSelectedRef] = useState(null);

  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [attachmentName, setAttachmentName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/io")
      .then((res) => res.json())
      .then(setIoOptions)
      .catch(() => {});
  }, []);

  const compatibleIo = ioOptions.filter((io) => hw.compatible_io?.includes(io._id));

  const ioPointsValid = ioPoints && Number(ioPoints) >= 1 && Number(ioPoints) <= 5000;
  const hasRefChoices = (hw.partNumbers?.length || 0) > 0;
  const refValid = !hasRefChoices || !!selectedRef;
  const canApply = ioPointsValid && !!selectedIoId && refValid && !uploading;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setAttachmentUrl(result.url);
      setAttachmentName(file.name);
    } catch (err) {
      setUploadError(err.message || "Upload failed");
      setAttachmentUrl(null);
      setAttachmentName(null);
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment() {
    setAttachmentUrl(null);
    setAttachmentName(null);
    setUploadError(null);
  }

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

<p className="text-sm font-medium text-gray-900 mb-1">Previous architecture</p>
<p className="text-xs text-gray-500 mb-3">Optional — attach an image or PDF for reference.</p>

<input
  ref={fileInputRef}
  type="file"
  accept="image/png,image/jpeg,image/webp,application/pdf"
  onChange={handleFileChange}
  disabled={uploading}
  className="hidden"
/>

{attachmentUrl ? (
  <div className="flex items-center justify-between gap-3 border border-green-200 bg-green-50 rounded-lg px-4 py-3 mb-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-green-200">
        {attachmentName?.toLowerCase().endsWith(".pdf") ? (
          <FileText className="w-4 h-4 text-green-700" />
        ) : (
          <ImageIcon className="w-4 h-4 text-green-700" />
        )}
      </div>
      <span className="text-sm font-medium text-gray-800 truncate">{attachmentName}</span>
    </div>
    <button
      type="button"
      onClick={removeAttachment}
      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
      aria-label="Remove attachment"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
) : (
  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    disabled={uploading}
    className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-4 mb-4 text-sm font-medium transition ${
      uploading
        ? "border-gray-200 text-gray-400 cursor-wait"
        : "border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
    }`}
  >
    {uploading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Uploading...
      </>
    ) : (
      <>
        <Upload className="w-4 h-4" />
        Upload image or PDF
      </>
    )}
  </button>
)}

{uploadError && (
  <p className="text-xs text-red-600 mb-4 -mt-2">{uploadError}</p>
)}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
          <Button
            disabled={!canApply}
            onClick={() => onApply([selectedIoId], Number(ioPoints), selectedRef, attachmentUrl)}
            className={!canApply ? "opacity-40 cursor-not-allowed" : ""}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}