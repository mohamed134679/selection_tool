import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function SiteHeader() {
  const username = localStorage.getItem("appUsername") || "";
  const initial = username.trim().charAt(0).toUpperCase() || "H";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("appUsername");

    window.location.href = "/login";
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/home"
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                SE
              </span>
            </div>

            <span className="font-bold text-lg text-gray-900">
              EAE Architecture Builder
            </span>
          </Link>

          {/* Profile */}
          <div className="relative group">

            {/* Profile Circle */}
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm hover:bg-green-200 transition"
            >
              {initial}
            </button>

            {/* Hover Dropdown */}
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block">

              <div className="w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

                {/* Username */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">
                    Signed in as
                  </p>

                  <p className="font-semibold text-gray-900 truncate">
                    {username}
                  </p>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

              </div>

            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}