import LicenceStep from "../components/LicenceStep.jsx";
import { useNavigate } from "react-router-dom";

export default function Licence() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto p-8">
      <LicenceStep onNext={() => navigate("/summary")} />
    </div>
  );
}