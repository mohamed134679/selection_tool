export default function ResultPanel({ result, sizing, onSizingChange, onBack, onRestart }) {
  const { selections, licenses, addOns, notes } = result;

  return (
    <div className="step-card">
      <div className="step-heading">
        <span className="step-number">04</span>
        <h2 className="step-title">Recommended License Configuration</h2>
      </div>
      <p className="step-description">
        Based on the Control, HMI and I/O layers selected, here is the license set to configure in
        EAE. Add optional sizing values to annotate the parameters below.
      </p>

      <div className="result-summary">
        <div className="result-summary-item">
          <p className="stack-label">Control</p>
          <p className="stack-value" style={{ color: "var(--text)" }}>
            {selections.control.label}
          </p>
        </div>
        <div className="result-summary-item">
          <p className="stack-label">HMI</p>
          <p className="stack-value" style={{ color: "var(--text)" }}>
            {selections.hmi.label}
          </p>
        </div>
        <div className="result-summary-item">
          <p className="stack-label">I/O</p>
          <p className="stack-value" style={{ color: "var(--text)" }}>
            {selections.io.label}
          </p>
        </div>
      </div>

      <div className="sizing-inputs">
        <div className="sizing-field">
          <label htmlFor="ioCount">I/O Count (optional)</label>
          <input
            id="ioCount"
            type="number"
            min="0"
            placeholder="e.g. 256"
            value={sizing.ioCount}
            onChange={(e) => onSizingChange({ ...sizing, ioCount: e.target.value })}
          />
        </div>
        <div className="sizing-field">
          <label htmlFor="nodeCount">Node Count (optional)</label>
          <input
            id="nodeCount"
            type="number"
            min="0"
            placeholder="e.g. 4"
            value={sizing.nodeCount}
            onChange={(e) => onSizingChange({ ...sizing, nodeCount: e.target.value })}
          />
        </div>
      </div>

      <p className="section-label">Required Licenses</p>
      <div className="license-list">
        {licenses.map((lic) => (
          <div className="license-row" key={lic.id}>
            <div>
              <div className="license-name">
                {lic.name}
                {lic.aka && <span className="license-aka"> \u00b7 {lic.aka}</span>}
                {lic.type && <span className="license-aka"> \u00b7 {lic.type}</span>}
              </div>
              <p className="license-reason">{lic.reason}</p>
            </div>
            {lic.sizedBy && (
              <div className="license-sizing">
                Sized by {lic.sizedBy}
                {lic.sizingValue ? `: ${lic.sizingValue}` : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {addOns.length > 0 && (
        <>
          <p className="section-label">Add-On Licenses to Consider</p>
          <div className="license-list">
            {addOns.map((addon) => (
              <div className="license-row addon" key={addon.id}>
                <div>
                  <div className="license-name">{addon.name}</div>
                  <p className="license-reason">{addon.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {notes.length > 0 && (
        <>
          <p className="section-label">Validation Notes</p>
          <div className="note-list">
            {notes.map((note, i) => (
              <div className="note-row" key={i}>
                {note}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="step-actions">
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn" onClick={onRestart}>
          Start Over
        </button>
      </div>
    </div>
  );
}
