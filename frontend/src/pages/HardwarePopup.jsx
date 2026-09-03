import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image as ImageIcon, X, Loader2, Check, Zap } from "lucide-react";
import { uploadFile } from "../api";
import { isHarmonyP6 } from "../lib/harmonyP6";
import { isRedundantLabel } from "../lib/redundancy";
import ReferenceNumberPicker from "../components/ReferenceNumberPicker.jsx";

function RefModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 p-0.5 mb-3">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={
          "text-xs font-medium rounded-full px-3 py-1.5 transition " +
          (mode === "list" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50")
        }
      >
        Choose from list
      </button>
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={
          "text-xs font-medium rounded-full px-3 py-1.5 transition " +
          (mode === "manual" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50")
        }
      >
        Enter manually
      </button>
    </div>
  );
}

export default function HardwarePopup({ hw, onApply, onClose }) {
  const [ioOptions, setIoOptions] = useState([]);
  const [selectedIoId, setSelectedIoId] = useState(null);
  const [selectedIoRef, setSelectedIoRef] = useState(null);
  const [ioPoints, setIoPoints] = useState("");
  const [selectedRef, setSelectedRef] = useState(null);
  const [refMode, setRefMode] = useState(null); // 'list' | 'manual' | null — Harmony P6 only

  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const [attachmentName, setAttachmentName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const [dragY, setDragY] = useState(0);
const [dragging, setDragging] = useState(false);
const dragStartRef = useRef(null);

function handleDragStart(e) {
  dragStartRef.current = e.touches ? e.touches[0].clientY : e.clientY;
  setDragging(true);
}

function handleDragMove(e) {
  if (!dragging || dragStartRef.current === null) return;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  const delta = currentY - dragStartRef.current;
  setDragY(Math.max(0, delta)); // only allow dragging downward
}

function handleDragEnd() {
  setDragging(false);
  dragStartRef.current = null;
  if (dragY > 120) {
    onClose();
  } else {
    setDragY(0); // snap back
  }
}
useEffect(() => {
  if (!dragging) return;
  window.addEventListener("mousemove", handleDragMove);
  window.addEventListener("mouseup", handleDragEnd);
  window.addEventListener("touchmove", handleDragMove);
  window.addEventListener("touchend", handleDragEnd);
  return () => {
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
    window.removeEventListener("touchmove", handleDragMove);
    window.removeEventListener("touchend", handleDragEnd);
  };
}, [dragging, dragY]);

  useEffect(() => {
    fetch("http://localhost:3000/io")
      .then((res) => res.json())
      .then(setIoOptions)
      .catch(() => {});
  }, []);

  const compatibleIo = ioOptions.filter((io) => hw.compatible_io && hw.compatible_io.includes(io._id));
  const selectedIoModule = compatibleIo.find((io) => io._id === selectedIoId) || null;

  const hasIoRefChoices = Boolean(
    selectedIoModule && selectedIoModule.partNumbers && selectedIoModule.partNumbers.length > 1
  );
  const ioRefValid = !hasIoRefChoices || Boolean(selectedIoRef);

  function selectIoModule(ioId) {
    setSelectedIoId(ioId);
    const io = compatibleIo.find((i) => i._id === ioId);
    if (io && io.partNumbers && io.partNumbers.length === 1) {
      setSelectedIoRef(io.partNumbers[0].code);
    } else {
      setSelectedIoRef(null);
    }
  }

  const ioPointsValid = ioPoints && Number(ioPoints) >= 1 && Number(ioPoints) <= 5000;

  const isHarmonyP6Hw = isHarmonyP6(hw);
  const hasRefChoices = !isHarmonyP6Hw && hw.partNumbers && hw.partNumbers.length > 0;
  const p6HasFixedRefs = Boolean(hw.partNumbers && hw.partNumbers.length > 0);

  function switchRefMode(mode) {
    setRefMode(mode);
    setSelectedRef(null);
  }

  let refValid;
  if (isHarmonyP6Hw) {
    if (refMode === "list") refValid = Boolean(selectedRef);
    else if (refMode === "manual") refValid = Boolean(selectedRef && selectedRef.trim().length > 0);
    else refValid = false;
  } else {
    refValid = !hasRefChoices || Boolean(selectedRef);
  }

  const canApply = ioPointsValid && Boolean(selectedIoId) && refValid && ioRefValid && !uploading;

  // Does the chosen reference number represent a redundant configuration?
  // Redundant setups need two physical units, so applying adds 2 instead of 1.
  const selectedPartNumber = hw.partNumbers?.find((pn) => pn.code === selectedRef) || null;
  const isRedundantSelection = Boolean(selectedPartNumber && isRedundantLabel(selectedPartNumber.label));

  async function handleFileChange(e) {
    const file = e.target.files ? e.target.files[0] : null;
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

  function triggerFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const uploadButtonClass = uploading
    ? "w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-4 mb-4 text-sm font-medium transition border-gray-200 text-gray-400 cursor-wait"
    : "w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-4 mb-4 text-sm font-medium transition border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer";

return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div
      style={{
        transform: `translateY(${dragY}px)`,
        opacity: dragY > 0 ? Math.max(0.4, 1 - dragY / 300) : 1,
        transition: dragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
      }}
      className="bg-white rounded-2xl p-6 w-full max-w-md"
    >
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing"
      />
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{hw.Name} - IO Setup</h3>

        {isHarmonyP6Hw ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Reference number:</p>
            <RefModeToggle mode={refMode} onChange={switchRefMode} />

            {refMode === "list" ? (
              p6HasFixedRefs ? (
                <ReferenceNumberPicker
                  options={hw.partNumbers}
                  selectedCode={selectedRef}
                  onSelect={setSelectedRef}
                  name="ref-number-list"
                  renderBadge={(pn) =>
                    isRedundantLabel(pn.label) ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 flex-shrink-0">
                        2 units
                      </span>
                    ) : null
                  }
                />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No fixed references available yet — switch to "Enter manually" instead.
                </p>
              )
            ) : null}

            {refMode === "manual" ? (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  Configure your Harmony P6 on the Schneider Electric product page below, then paste the product code you were given.
                </p>
                <a
                  href="https://www.se.com/eg/en/product-range/22953172-harmony-p6/#products"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:underline font-medium text-xs block mb-2"
                >
                  Open Schneider Electric product page
                </a>
                <input
                  type="text"
                  value={selectedRef || ""}
                  onChange={(e) => setSelectedRef(e.target.value)}
                  placeholder="e.g. HMIP6CTO..."
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono text-sm"
                />
              </>
            ) : null}

            {isRedundantSelection ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  This is a redundant configuration — it requires two physical
                  units. Applying will add <span className="font-semibold">2 devices</span> to your project.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasRefChoices ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Choose a reference number:</p>
            <ReferenceNumberPicker
              options={hw.partNumbers}
              selectedCode={selectedRef}
              onSelect={setSelectedRef}
              name="ref-number"
              renderBadge={(pn) =>
                isRedundantLabel(pn.label) ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 flex-shrink-0">
                    2 units
                  </span>
                ) : null
              }
            />

            {isRedundantSelection ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  This is a redundant configuration — it requires two physical
                  units. Applying will add <span className="font-semibold">2 devices</span> to your project.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-sm text-gray-600 mb-2">Choose an IO module:</p>
        <div className="flex flex-col gap-2 mb-1 max-h-52 overflow-y-auto">
          {compatibleIo.length === 0 ? (
            <p className="text-sm text-gray-500">No compatible IO modules found.</p>
          ) : null}
          {compatibleIo.map((io) => {
            const isSelected = selectedIoId === io._id;
            const refCount = io.partNumbers ? io.partNumbers.length : 0;
            return (
              <button
                key={io._id}
                type="button"
                onClick={() => selectIoModule(io._id)}
                className={
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition " +
                  (isSelected
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-400 hover:bg-gray-50")
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
                      (isSelected ? "border-green-600 bg-green-600" : "border-gray-300 bg-white")
                    }
                  >
                    {isSelected ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : null}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{io.Name}</span>
                </div>

                {refCount > 1 ? (
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2.5 py-1 flex-shrink-0">
                    {refCount} references
                  </span>
                ) : null}
                {refCount === 1 ? (
                  <span className="text-xs font-mono text-gray-500 flex-shrink-0">{io.partNumbers[0].code}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {selectedIoModule && !hasIoRefChoices && selectedIoModule.partNumbers && selectedIoModule.partNumbers.length === 1 ? (
          <p className="text-xs text-gray-500 mb-4 mt-1.5 pl-1">
            Reference <span className="font-mono text-gray-700">{selectedIoModule.partNumbers[0].code}</span> applied automatically.
          </p>
        ) : (
          <div className="mb-4" />
        )}

        {hasIoRefChoices ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Choose a reference number for {selectedIoModule.Name}:</p>
            <ReferenceNumberPicker
              options={selectedIoModule.partNumbers}
              selectedCode={selectedIoRef}
              onSelect={setSelectedIoRef}
              name="io-ref-number"
            />
          </div>
        ) : null}

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
        <p className="text-xs text-gray-500 mb-3">Optional - attach an image or PDF for reference.</p>

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
                {attachmentName && attachmentName.toLowerCase().endsWith(".pdf") ? (
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
            onClick={triggerFilePicker}
            disabled={uploading}
            className={uploadButtonClass}
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

        {uploadError ? (
          <p className="text-xs text-red-600 mb-4 -mt-2">{uploadError}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
          <Button
            disabled={!canApply}
            onClick={() =>
              onApply(
                [selectedIoId],
                Number(ioPoints),
                selectedRef,
                attachmentUrl,
                selectedIoRef,
                isRedundantSelection ? 2 : 1
              )
            }
            className={!canApply ? "opacity-40 cursor-not-allowed" : ""}
          >
            {isRedundantSelection ? "Add 2 Devices" : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}