export default function OptionCard({ option, selected, disabled, onSelect, compactCards = false }) {
  const hoverDetail = option.protocol ? `Communication: ${option.protocol}` : null;
  const detailClassName = compactCards ? "option-detail option-detail-hidden" : "option-detail";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      className={`option-card${selected ? " selected" : ""}${disabled ? " disabled" : ""}${compactCards ? " compact" : ""}`}
      onClick={() => !disabled && onSelect(option.id)}
      title={hoverDetail || option.summary}
    >
      <div className="option-card-head">
        <div>
          <div className="option-label">{option.label}</div>
          {option.part && <div className={detailClassName}>{option.part}</div>}
        </div>
        <span className="option-radio" />
      </div>
      <div className={compactCards ? "option-compact-details" : "option-detail-group"}>
        <p className={detailClassName}>{option.summary}</p>
        {hoverDetail && <p className={`${detailClassName} option-hover-detail`}>{hoverDetail}</p>}
        {option.tags && option.tags.length > 0 && (
          <div className={compactCards ? "option-tags option-tags-compact option-detail-hidden" : "option-tags"}>
            {option.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {disabled && (
        <p className="option-summary" style={{ color: "var(--text)" }}>
          Not available for this control selection
        </p>
      )}
    </button>
  );
}
