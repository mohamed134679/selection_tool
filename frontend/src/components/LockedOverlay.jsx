import { Link } from "react-router-dom";

export default function LockedOverlay() {
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="text-center bg-white rounded-2xl border border-gray-200 shadow-lg px-8 py-6">
        <p className="text-lg font-semibold text-gray-900 mb-2">This project has already been created</p>
        <Link to="/" className="text-green-700 hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
