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
import HardwareCatalog from "./pages/HardwareCatalog.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import LiveStackHeader from "./components/LiveStackHeader.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

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
      <Route path="/hardware-catalog" element={<HardwareCatalog />} />
      <Route path="/hmi" element={<Hmi />} />
      <Route path="/licence" element={<Licence />} />
      <Route path="/summary" element={<Summary />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
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
    document.body.setAttribute("data-theme", "app");
    return () => document.body.removeAttribute("data-theme");
  }, []);

  return (
    <AppShell />
  );
}

export default App;