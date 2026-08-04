const SEGMENTS = [
  { key: "control", label: "Control" },
  { key: "io", label: "I/O" },
  { key: "hmi", label: "HMI" },
  { key: "license", label: "License" },
];

export default function StackHeader({ activeStep, values, onSegmentClick }) {
  return (
    <div className="stack">
      {SEGMENTS.map((seg, index) => {
        const value = values[seg.key];
        const isActive = index === activeStep;
        const isFilled = Boolean(value);
        const isClickable = Boolean(onSegmentClick) && (isFilled || isActive);
        return (
          <button
            key={seg.key}
            type="button"
            className={`stack-segment${isFilled ? " filled" : ""}${isActive ? " active" : ""}${isClickable ? " clickable" : ""}`}
            onClick={isClickable ? () => onSegmentClick(index) : undefined}
            disabled={!isClickable}
          >
            <p className="stack-label">{seg.label}</p>
            <p className="stack-value">{value || "\u2014 pending"}</p>
          </button>
        );
      })}
    </div>
  );
}
