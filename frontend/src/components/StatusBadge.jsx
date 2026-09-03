// Single source of truth for review-status labels and colors, used by
// AdminProjectsReview.jsx, Projects.jsx, and Projectdetail.jsx. Changing a
// label or color only ever needs to happen here.

const STATUS_CONFIG = {
  pending: { label: "Pending Review", className: "text-amber-700 bg-amber-50" },
  needs_edit: { label: "Needs Edit", className: "text-red-700 bg-red-50" },
  approved: { label: "Approved", className: "text-green-700 bg-green-50" },
};

export default function StatusBadge({ status, className = "" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 flex-shrink-0 ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };