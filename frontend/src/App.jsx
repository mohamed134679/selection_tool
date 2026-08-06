// import { useEffect, useMemo, useState } from "react";
// import StackHeader from "./components/StackHeader.jsx";
// import StepLayer from "./components/StepLayer.jsx";
// import ResultPanel from "./components/ResultPanel.jsx";
// import { getOptions, postRecommend } from "./api.js";

// const STEPS = ["control", "io", "hmi", "result"];

// export default function App() {
//   const [options, setOptions] = useState(null);
//   const [loadError, setLoadError] = useState(null);
//   const [step, setStep] = useState(0);

//   const [controlId, setControlId] = useState(null);
//   const [hmiId, setHmiId] = useState(null);
//   const [ioId, setIoId] = useState(null);

//   const [sizing, setSizing] = useState({ ioCount: "", nodeCount: "" });
//   const [result, setResult] = useState(null);
//   const [computeError, setComputeError] = useState(null);

//   useEffect(() => {
//     getOptions()
//       .then(setOptions)
//       .catch((err) => setLoadError(err.message));
//   }, []);

//   const selectedControl = useMemo(
//     () => options?.control.find((c) => c.id === controlId) || null,
//     [options, controlId]
//   );

//   const stackValues = {
//     control: options?.control.find((c) => c.id === controlId)?.label,
//     hmi: options?.hmi.find((h) => h.id === hmiId)?.label,
//     io: options?.io.find((i) => i.id === ioId)?.label,
//     license: result ? `${result.licenses.length} license(s)` : null,
//   };

//   function handleStackSegmentClick(targetStep) {
//     setStep(targetStep);
//   }

//   async function handleComputeAndAdvance() {
//     setComputeError(null);
//     try {
//       const data = await postRecommend({
//         controlId,
//         hmiId,
//         ioId,
//         ioCount: sizing.ioCount || undefined,
//         nodeCount: sizing.nodeCount || undefined,
//       });
//       setResult(data);
//       setStep(3);
//     } catch (err) {
//       setComputeError(err.message);
//     }
//   }

//   async function recomputeWithSizing(nextSizing) {
//     setSizing(nextSizing);
//     try {
//       const data = await postRecommend({
//         controlId,
//         hmiId,
//         ioId,
//         ioCount: nextSizing.ioCount || undefined,
//         nodeCount: nextSizing.nodeCount || undefined,
//       });
//       setResult(data);
//     } catch (err) {
//       setComputeError(err.message);
//     }
//   }

//   function handleRestart() {
//     setControlId(null);
//     setHmiId(null);
//     setIoId(null);
//     setSizing({ ioCount: "", nodeCount: "" });
//     setResult(null);
//     setComputeError(null);
//     setStep(0);
//   }

//   if (loadError) {
//     return (
//       <div id="root">
//         <p className="note-row">Could not reach the API: {loadError}. Is the backend running on port 4000?</p>
//       </div>
//     );
//   }

//   if (!options) {
//     return (
//       <>
//         <header className="app-header">
//           <p className="app-eyebrow">EAE Selection Tool</p>
//           <h1 className="app-title">Loading configurator\u2026</h1>
//         </header>
//       </>
//     );
//   }

//   return (
//     <>
//       <header className="app-header">
//         <p className="app-eyebrow">EAE Selection Tool</p>
//         <h1 className="app-title">Architecture Configurator</h1>
//         <p className="app-subtitle">
//           Choose the Control, I/O and HMI layers for this project. The tool recommends the license
//           set to configure, following the EAE selection workflow.
//         </p>
//       </header>

//       <StackHeader activeStep={step} values={stackValues} onSegmentClick={handleStackSegmentClick} />

//       {step === 0 && (
//         <StepLayer
//           stepNumber={1}
//           title="Control Layer"
//           description="Select the control execution platform \u2014 SoftdPAC (hardware-independent virtual runtime) or a dedicated dPAC controller."
//           options={options.control}
//           selectedId={controlId}
//           onSelect={setControlId}
//           onAdvance={() => setStep(1)}
//         />
//       )}

//       {step === 1 && (
//         <StepLayer
//           stepNumber={2}
//           title="I/O Layer"
//           description="Select the remote I/O communication strategy. This determines whether a Communication Add-On License is required."
//           options={options.io}
//           selectedId={ioId}
//           onSelect={setIoId}
//           onAdvance={() => setStep(2)}
//           compactCards
//         />
//       )}

//       {step === 2 && (
//         <StepLayer
//           stepNumber={3}
//           title="HMI Layer"
//           description="Select the visualization deployment model. Consolidation onto the same CPU as Control is only available for SoftdPAC on Harmony P6 / Harmony PSA."
//           options={options.hmi}
//           selectedId={hmiId}
//           onSelect={setHmiId}
//           onAdvance={handleComputeAndAdvance}
//           isDisabledOption={(option) =>
//             option.id === "hmi_consolidated" && !(selectedControl && selectedControl.consolidationCapable)
//           }
//         />
//       )}

//       {step === 3 && result && (
//         <ResultPanel
//           result={result}
//           sizing={sizing}
//           onSizingChange={recomputeWithSizing}
//           onBack={() => setStep(2)}
//           onRestart={handleRestart}
//         />
//       )}

//       {computeError && <p className="note-row" style={{ marginTop: 16 }}>{computeError}</p>}
//     </>
//   );
// }


import { Routes, Route } from "react-router-dom";
import "./styles.css";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";

import ProjectBuilderPage from "./pages/ProjectBuilderPage";

import Hmi from "./pages/Hmi";
import Licence from "./pages/Licence";


function App() {
  useEffect(() => {
    // enable the app theme by default; pages can override it
    document.body.setAttribute("data-theme", "app");
    return () => document.body.removeAttribute("data-theme");
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/new" element={<ProjectBuilderPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/hmi" element={<Hmi />} />
      <Route path="/licence" element={<Licence />} />
    </Routes>
  );
}

export default App;