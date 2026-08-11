import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {useSearchParams} from "react-router-dom";

export default function HmiStep({ selectedId, onSelect, onNext }) {
  const [hmiOptions, setHmiOptions] = useState([]);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const step = searchParams.get("step") || "brand";
  const brand = searchParams.get("brand");

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
  if (step === "brand") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose HMI</h2>
        <p className="text-gray-600 mb-6">First, choose the HMI category.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            onClick={() => setSearchParams({ step: "select", brand: "Schneider"})}
            className="rounded-2xl border border-gray-200 p-6 cursor-pointer hover:border-green-600 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">Schneider HMI</h3>
          </div>
          <div
            onClick={() => setSearchParams({ step: "select", brand: "Third-Party" })}
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
    <button onClick={() => {setSearchParams({ step: "brand" })
    }}className="text-sm text-green-700 hover:underline mb-4">
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
