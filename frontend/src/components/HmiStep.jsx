import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";


export default function HmiStep({ selectedId, onSelect, onNext }) {
  const [hmiOptions, setHmiOptions] = useState([]);
  const [error, setError] = useState(null);
  const [brand,setBrand] = useState(null);
  useEffect(() => {
    // your turn: fetch from http://localhost:3000/hmi,
    // parse the JSON, and setHmiOptions with the result
    fetch("http://localhost:3000/hmi")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setHmiOptions(data))
      .catch((err) => setError(err.message));
  }, []);
  if (!brand) {
    return (
     <div>
  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
  <p className="text-gray-600 mb-4">First, choose the HMI category.</p>

  <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
    <p className="text-sm text-gray-700">
      <span className="font-semibold text-gray-900">💡Note:</span>{" "}
      If you selected SoftdPAC, your chosen hardware may also run the HMI.
      You can combine{" "}
      <span className="font-semibold">Control + HMI on the same CPU</span>{" "}
      instead of using separate hardware.
    </p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div
      onClick={() => setBrand("Schneider")}
      className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold text-gray-900">Schneider HMI</h3>
    </div>

    <div
      onClick={() => setBrand("Third-Party")}
      className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold text-gray-900">Third-Party HMI</h3>
    </div>
  </div>
</div>
    );
}


  return (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
    <p className="text-gray-600 mb-6">Select the visualization deployment for this project.</p>
    <button onClick={() => setBrand(null)} className="text-sm text-green-700 hover:underline mb-4">
      ← Change category
    </button>
    {error && (
    <p className="text-sm text-red-700 bg-red-50 border-l-2 border-red-500 rounded-r-md px-3 py-2 mb-6">
      {error}
    </p>
  )}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {
        hmiOptions.filter((hmi) => hmi.brand === brand).map((hmi) => (
          <div
            key={hmi._id}
            className={`rounded-2xl border p-6 cursor-pointer transition ${
              selectedId === hmi._id
                ? "border-green-600 shadow-md bg-green-50"
                : "border-gray-200 hover:border-green-600 hover:shadow-md"
            }`}
            onClick={() => {
              if (selectedId !== hmi._id) {
                onSelect(hmi._id);
              }else {
                onSelect(null);
              }
            }}
          >
            {hmi.image && (
              <img src={hmi.image} alt={hmi.Name} className="w-full h-32 object-contain mb-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{hmi.Name}</h3>
          </div>
        ))
      }
    </div>
        <div className="flex justify-end">
          <Button
            disabled={!selectedId}
            onClick={onNext}
            className={!selectedId ? "opacity-40 cursor-not-allowed" : ""}
          >
            Next
          </Button>
        </div>
  </div>
);

}
