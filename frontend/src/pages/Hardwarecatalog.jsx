import { useEffect, useMemo, useState } from "react";
import { Cpu, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function HardwareCatalog() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/hardware")
      .then((res) => res.json())
      .then((data) => {
        setDevices(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const haystack = [
        d.Name,
        d.family,
        d.range,
        d.description,
        ...(d.partNumbers || []).map((p) => `${p.code} ${p.label || ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [devices, search]);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hardware Catalog</h1>
        <p className="text-gray-600">
          Reference overview of available Control/IO hardware and their part numbers.
        </p>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, family, or part number..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
        />
      </div>

      {loading && <p className="text-gray-500">Loading catalog...</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-gray-500">No devices match your search.</p>
      )}

      <div className="space-y-4">
        {filtered.map((device) => {
          const isOpen = expandedId === device._id;
          return (
            <div
              key={device._id}
              className="rounded-2xl border border-gray-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : device._id)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{device.Name}</h3>
                      {device.version && (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                          {device.version}
                        </span>
                      )}
                      {device.regionRestriction && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                          {device.regionRestriction}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[device.family, device.range].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  {device.description && (
                    <p className="text-sm text-gray-700 mb-4">{device.description}</p>
                  )}

                  {device.partNumbers?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Part Numbers
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {device.partNumbers.map((pn) => (
                          <span
                            key={pn.code}
                            className="text-xs font-mono text-green-700 bg-green-50 rounded-full px-2.5 py-1"
                            title={pn.label}
                          >
                            {pn.code}
                            {pn.label ? ` \u2014 ${pn.label}` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {device.featureGroups?.map((group, i) => (
                    <div key={i} className="mb-4">
                      {group.title && (
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {group.title}
                        </p>
                      )}
                      <ul className="list-disc list-inside space-y-1">
                        {group.items.map((item, j) => (
                          <li key={j} className="text-sm text-gray-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {device.notes?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                      {device.notes.map((note, i) => (
                        <p key={i} className="text-xs text-gray-400">
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}