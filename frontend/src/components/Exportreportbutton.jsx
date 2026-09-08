import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, AlertCircle } from "lucide-react";
import { downloadProjectReportPdf } from "../export/Projectreportpdf.js";
import { downloadProjectReportExcel } from "../export/Projectreportexcel.js";

/**
 * Export button + small dropdown ("PDF" / "Excel"), styled to match the
 * rest of the app (ProjectDetail's Edit/Delete buttons, Summary's action
 * row).
 *
 * `project` must already be normalized — pass it through
 * projectFromDraft() (Summary.jsx) or projectFromDetail() (ProjectDetail.jsx)
 * from ../lib/report/reportAdapters, not the raw draft/response.
 */
export default function ExportReportButtons({ project, className = "" }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function runExport(format) {
    setError(null);
    setOpen(false);
    setGenerating(true);
    try {
      if (format === "pdf") {
        downloadProjectReportPdf(project);
      } else {
        await downloadProjectReportExcel(project);
      }
    } catch (err) {
      console.error(`Failed to generate ${format} report:`, err);
      setError("Couldn't generate the report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={generating || !project?.name}
        className="inline-flex items-center gap-1.5 text-sm text-green-700 border border-green-200 hover:bg-green-50 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {generating ? "Generating..." : "Export"}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => runExport("pdf")}
            className="w-full flex items-center gap-2 text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
          >
            <FileText className="w-4 h-4 text-green-600" />
            Export as PDF
          </button>
          <button
            type="button"
            onClick={() => runExport("excel")}
            className="w-full flex items-center gap-2 text-left text-sm text-gray-700 hover:bg-gray-50 px-3 py-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Export as Excel
          </button>
        </div>
      )}

      {error && (
        <p className="absolute right-0 mt-2 w-64 flex items-center gap-2 text-xs text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 z-20">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}