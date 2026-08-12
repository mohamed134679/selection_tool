const SEGMENTS = [
  { key: "controlIo", label: "Control / I/O", valueKeys: ["control", "io"] },
  { key: "hmi", label: "HMI", valueKeys: ["hmi"] },
  { key: "license", label: "License", valueKeys: ["license"] },
];

export default function StackHeader({ activeStep, values, onSegmentClick }) {
  return (
    <div className="flex rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {SEGMENTS.map((seg, index) => {
        const segValues = seg.valueKeys.map((k) => values[k]).filter(Boolean);
        const isActive = index === activeStep;
        const isFilled = segValues.length > 0;
        const isClickable = Boolean(onSegmentClick) && (isFilled || isActive);
        const isLast = index === SEGMENTS.length - 1;

        return (
          <button
            key={seg.key}
            type="button"
            onClick={isClickable ? () => onSegmentClick(index) : undefined}
            disabled={!isClickable}
            className={`relative flex-1 px-6 py-4 text-center transition
              ${isActive ? "bg-green-50" : "bg-white"}
              ${isClickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}
              ${!isLast ? "border-r border-gray-200" : ""}
            `}
          >
            {!isLast && (
              <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-300" />
            )}

            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                isActive ? "text-green-700" : "text-gray-400"
              }`}
            >
              {seg.label}
            </p>
            <p
              className={`text-sm font-semibold ${
                isActive ? "text-gray-900" : isFilled ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {segValues.length > 0 ? segValues.join(" · ") : "\u2014 pending"}
            </p>

            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}
