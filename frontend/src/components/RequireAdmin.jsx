import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const role = localStorage.getItem("userRole");
  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }
  return children;
}