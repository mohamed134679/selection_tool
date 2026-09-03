export default function ReferenceNumberPicker({ options, selectedCode, onSelect, name, renderBadge }) {
  return (
    <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden max-h-52 overflow-y-auto">
      {options.map((pn) => {
        const isSelected = selectedCode === pn.code;
        const badge = renderBadge ? renderBadge(pn) : null;
        return (
          <label
            key={pn.code}
            className={
              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition " +
              (isSelected ? "bg-green-50" : "hover:bg-gray-50")
            }
          >
            <input
              type="radio"
              name={name}
              checked={isSelected}
              onChange={() => onSelect(pn.code)}
              className="sr-only"
            />
            <span
              className={
                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
                (isSelected ? "border-green-600 bg-green-600" : "border-gray-300 bg-white")
              }
            >
              {isSelected ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-gray-900 truncate">{pn.code}</p>
              {pn.label ? <p className="text-xs text-gray-500 truncate">{pn.label}</p> : null}
            </div>
            {badge}
          </label>
        );
      })}
    </div>
  );
}