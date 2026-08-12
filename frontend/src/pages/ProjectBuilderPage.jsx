import { useEffect, useMemo, useState } from "react";
import StackHeader from "../components/StackHeader.jsx";
import StepLayer from "../components/StepLayer.jsx";
import ResultPanel from "../components/ResultPanel.jsx";
import { getOptions, postRecommend } from "../api.js";

export default function ProjectBuilderPage() {
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(0);
  const [controlId, setControlId] = useState(null);
  const [hmiId, setHmiId] = useState(null);
  const [ioId, setIoId] = useState(null);
  const [sizing, setSizing] = useState({ ioCount: "", nodeCount: "" });
  const [result, setResult] = useState(null);
  const [computeError, setComputeError] = useState(null);

  useEffect(() => {
    document.body.setAttribute("data-theme", "app");
    return () => document.body.removeAttribute("data-theme");
  }, []);

  useEffect(() => {
    getOptions()
      .then(setOptions)
      .catch((err) => setLoadError(err.message));
  }, []);

  const selectedControl = useMemo(
    () => options?.control.find((control) => control.id === controlId) || null,
    [options, controlId]
  );

  const stackValues = {
    control: options?.control.find((control) => control.id === controlId)?.label,
    hmi: options?.hmi.find((hmi) => hmi.id === hmiId)?.label,
    io: options?.io.find((io) => io.id === ioId)?.label,
    license: result ? `${result.licenses.length} license(s)` : null,
  };

  function handleStackSegmentClick(targetStep) {
    setStep(targetStep);
  }

  async function handleComputeAndAdvance() {
    setComputeError(null);
    try {
      const data = await postRecommend({
        controlId,
        hmiId,
        ioId,
        ioCount: sizing.ioCount || undefined,
        nodeCount: sizing.nodeCount || undefined,
      });
      setResult(data);
      setStep(3);
    } catch (err) {
      setComputeError(err.message);
    }
  }

  async function recomputeWithSizing(nextSizing) {
    setSizing(nextSizing);
    try {
      const data = await postRecommend({
        controlId,
        hmiId,
        ioId,
        ioCount: nextSizing.ioCount || undefined,
        nodeCount: nextSizing.nodeCount || undefined,
      });
      setResult(data);
    } catch (err) {
      setComputeError(err.message);
    }
  }

  function handleRestart() {
    setControlId(null);
    setHmiId(null);
    setIoId(null);
    setSizing({ ioCount: "", nodeCount: "" });
    setResult(null);
    setComputeError(null);
    setStep(0);
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Choose Control, I/O, and HMI layers step by step.</p>
        </div>

        {loadError ? (
          <div className="step-card">
            <div className="step-heading">
              <span className="step-number">01</span>
              <h2 className="step-title">Could not load options</h2>
            </div>
            <p className="step-description">{loadError}</p>
            <p className="note-row" style={{ marginTop: 16 }}>
              The backend should expose /options before the wizard can continue.
            </p>
          </div>
        ) : !options ? (
          <div className="step-card">
            <div className="step-heading">
              <span className="step-number">01</span>
              <h2 className="step-title">Loading configurator</h2>
            </div>
            <p className="step-description">Fetching the catalog data for the project builder.</p>
          </div>
        ) : (
          <>
            <StackHeader activeStep={step} values={stackValues} onSegmentClick={handleStackSegmentClick} />

            {step === 0 && (
              <StepLayer
                stepNumber={1}
                title="Control Layer"
                description="Select the control execution platform — SoftdPAC (hardware-independent virtual runtime) or a dedicated dPAC controller."
                options={options.control}
                selectedId={controlId}
                onSelect={setControlId}
                onAdvance={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <StepLayer
                stepNumber={2}
                title="I/O Layer"
                description="Select the remote I/O communication strategy. This determines whether a Communication Add-On License is required."
                options={options.io}
                selectedId={ioId}
                onSelect={setIoId}
                onAdvance={() => setStep(2)}
                compactCards
              />
            )}

            {step === 2 && (
              <StepLayer
                stepNumber={3}
                title="HMI Layer"
                description="Select the visualization deployment model. Consolidation onto the same CPU as Control is only available for SoftdPAC on Harmony P6 / Harmony PSA."
                options={options.hmi}
                selectedId={hmiId}
                onSelect={setHmiId}
                onAdvance={handleComputeAndAdvance}
                isDisabledOption={(option) =>
                  option.requiresConsolidationCapableControl && !(selectedControl && selectedControl.consolidationCapable)
                }
              />
            )}

            {step === 3 && result && (
              <ResultPanel
                result={result}
                sizing={sizing}
                onSizingChange={recomputeWithSizing}
                onBack={() => setStep(2)}
                onRestart={handleRestart}
              />
            )}

            {computeError && <p className="note-row" style={{ marginTop: 16 }}>{computeError}</p>}
          </>
        )}
      </main>
    </div>
  );
}
