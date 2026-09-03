import { useState } from "react";
import { ClipboardList, Users, Cpu, Monitor, ShieldCheck } from "lucide-react";
import AdminProjectsReview from "./AdminProjectsReview.jsx";
import AdminUsers from "./AdminUsers.jsx";
import AdminHardwareManager from "./AdminHardwareManager.jsx";
import AdminHmiManager from "./AdminHmiManager.jsx";
import AdminLicenseManager from "./AdminLicenseManager.jsx";

const TABS = [
  { key: "projects", label: "Project Review", icon: ClipboardList },
  { key: "users", label: "Users", icon: Users },
  { key: "hardware", label: "Hardware", icon: Cpu },
  { key: "hmi", label: "HMI", icon: Monitor },
  { key: "licenses", label: "Licenses", icon: ShieldCheck },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Review projects, manage users, and edit the catalog.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "projects" && <AdminProjectsReview />}
      {activeTab === "users" && <AdminUsers />}
      {activeTab === "hardware" && <AdminHardwareManager />}
      {activeTab === "hmi" && <AdminHmiManager />}
      {activeTab === "licenses" && <AdminLicenseManager />}
    </div>
  );
}