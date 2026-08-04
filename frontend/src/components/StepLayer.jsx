import OptionCard from "./OptionCard.jsx";

export default function StepLayer({
  stepNumber,
  title,
  description,
  options,
  selectedId,
  onSelect,
  onAdvance,
  isDisabledOption,
  compactCards = false,
}) {
  return (
    <div className="step-card">
      <div className="step-heading">
        <span className="step-number">{`0${stepNumber}`}</span>
        <h2 className="step-title">{title}</h2>
      </div>
      <p className="step-description">{description}</p>

      <div className="option-grid" role="radiogroup" aria-label={title}>
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            disabled={isDisabledOption ? isDisabledOption(option) : false}
            compactCards={compactCards}
            onSelect={(id) => {
              onSelect(id);
              if (onAdvance) {
                onAdvance(id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
