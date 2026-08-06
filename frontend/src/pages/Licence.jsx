import LicenceStep from "../components/LicenceStep.jsx";

export default function Licence() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <LicenceStep onNext={() => alert("Next clicked!")} />
    </div>
  );
}