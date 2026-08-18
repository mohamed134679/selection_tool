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
import ProjectDetail from "./pages/ProjectDetail.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import LiveStackHeader from "./components/LiveStackHeader.jsx";

// Runs INSIDE ProjectDraftProvider so it can read `locked`. Once a project
// has been created, the WIZARD routes specifically should redirect home so
// the user can't re-enter a stale wizard with an already-submitted draft.
// Everything else (home, login, register, viewing projects) should always
// be reachable. Listing the routes that SHOULD be blocked (rather than
// trying to list every route that should be allowed) means new pages added
// later are reachable by default instead of silently getting swept into
// the lock by accident.
const WIZARD_PATHS = ["/hardware", "/hmi", "/licence", "/summary", "/projects/new"];

function AppRoutes() {
  const { projectDraft } = useProjectDraft();
  const location = useLocation();

  const isWizardPath = WIZARD_PATHS.includes(location.pathname);

  if (projectDraft.locked && isWizardPath) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
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