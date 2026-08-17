import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./styles.css";
import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";

import ProjectBuilderPage from "./pages/ProjectBuilderPage";

import Hmi from "./pages/Hmi";
import Licence from "./pages/Licence";

import {ProjectDraftProvider, useProjectDraft} from "./context/ProjectDraftContext.jsx";
import Summary from "./pages/Summary.jsx";
import Hardware from "./pages/Hardware.jsx";
import Projects from "./pages/Projects.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import LiveStackHeader from "./components/LiveStackHeader.jsx";

// Runs INSIDE ProjectDraftProvider so it can read `locked`. If a project
// was already created, the abandoned Hardware/HMI/Licence/Summary flow
// specifically becomes unreachable — this is checked on every render
// (including ones triggered by the browser's Back/Forward buttons), so it
// can't be defeated by repeatedly pressing Back. Everything else (View
// Projects, Login, Register, etc.) stays fully navigable.
const LOCKED_FLOW_PATHS = ["/hardware", "/hmi", "/licence", "/summary"];

function AppRoutes() {
  const { projectDraft } = useProjectDraft();
  const location = useLocation();

  if (projectDraft.locked && LOCKED_FLOW_PATHS.includes(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/new" element={<ProjectBuilderPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/hardware" element={<Hardware />} />
      <Route path="/hmi" element={<Hmi />} />
      <Route path="/licence" element={<Licence />} />
      <Route path="/summary" element={<Summary />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const hideHeader = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register";

  return (
    <ProjectDraftProvider>
      {!hideHeader && <SiteHeader />}
      {!hideHeader && <LiveStackHeader />}
      <AppRoutes />
    </ProjectDraftProvider>
  );
}

function App() {
  useEffect(() => {
    // enable the app theme by default; pages can override it
    document.body.setAttribute("data-theme", "app");
    return () => document.body.removeAttribute("data-theme");
  }, []);

  return (
    <AppShell />
  );
}

export default App;
