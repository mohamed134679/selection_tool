// frontend/src/components/TemplatesPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ShieldCheck, ArrowLeft, Plus, X, Cpu, Monitor } from 'lucide-react'
import { authFetch } from '../api.js'
import { useProjectDraft } from '../context/ProjectDraftContext.jsx'
import { isHarmonyP6 } from '../lib/harmonyP6'

const CATEGORIES = [
  { key: 'standalone', label: 'Standalone Architectures', icon: LayoutGrid },
  { key: 'redundant', label: 'Redundant Architectures', icon: ShieldCheck },
]

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { setProjectDraft } = useProjectDraft()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('standalone')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [hardwareCatalog, setHardwareCatalog] = useState([])
  const [hmiOptions, setHmiOptions] = useState([])

  // ASSUMPTION: adjust to however you actually expose the logged-in user's role.
  // Currently reading from a "user" object stored in localStorage, e.g.
  // localStorage.setItem('user', JSON.stringify({ id, role, ... })) at login.
  let isAdmin = false
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    isAdmin = storedUser?.role === 'admin'
  } catch {
    isAdmin = false
  }

  useEffect(() => {
    let active = true

    async function loadTemplates() {
      try {
        const res = await authFetch('http://localhost:3000/templates')
        if (!res.ok) throw new Error(`Failed to load templates (${res.status})`)
        const data = await res.json()
        if (!active) return
        setTemplates(data)
      } catch (err) {
        console.error(err)
        if (active) setError('Could not load templates.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTemplates()
    return () => {
      active = false
    }
  }, [])

  // Fetched once so the preview modal can resolve hardware/HMI names
  // instead of showing raw ids.
  useEffect(() => {
    fetch('http://localhost:3000/hardware')
      .then((res) => res.json())
      .then(setHardwareCatalog)
      .catch(() => {})
  }, [])
  useEffect(() => {
    fetch('http://localhost:3000/hmi')
      .then((res) => res.json())
      .then(setHmiOptions)
      .catch(() => {})
  }, [])

  function chooseTemplate(template) {
    setProjectDraft({
      mode: "project",
      name: template.name,
      description: template.description ?? '',
      locked: false,
      justCreated: false,
      editingProjectId: null,
      templateMeta: null,
      selectedHw: template.SelectedHw ?? [],
      hmiId: template.Hmi_id ?? null,
      hmiUsesControlHw: template.hmiUsesControlHw ?? false,
      hmiDisabled: template.hmiDisabled ?? false,
      hmiRefNumber: template.hmiRefNumber ?? null,
      licences: template.licences ?? {
        buildTime: { wanted: null, tier: null, addons: [] },
        runtime: { ioPoints: null },
        orchestration: { nodeCount: null },
        communication: { protocols: [] },
      },
    })
    navigate('/hardware')
  }

  const filtered = templates.filter((t) => t.category === activeCategory)

  // Group SelectedHw by hw_id for a clean count display in the preview.
  const previewHwGroups = previewTemplate
    ? Object.values(
        (previewTemplate.SelectedHw ?? []).reduce((acc, entry) => {
          const key = entry.hw_id;
          if (!acc[key]) acc[key] = { hwId: key, count: 0 };
          acc[key].count += 1;
          return acc;
        }, {})
      )
    : []

  const previewHmi = previewTemplate?.hmiUsesControlHw
    ? hmiOptions.find(isHarmonyP6)
    : hmiOptions.find((h) => h._id === previewTemplate?.Hmi_id)

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">

        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
            <p className="text-gray-600">Start from a previously saved project.</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => navigate('/admin/templates/new')}
              className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 mb-10 border-b border-gray-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeCategory === cat.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        {loading ? (
          <p className="text-sm text-gray-500">Loading templates…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            No saved templates in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map((template) => (
              <div
                key={template.id}
                onClick={() => setPreviewTemplate(template)}
                className="h-full rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition cursor-pointer overflow-hidden"
              >
                {template.imageUrl ? (
                  <img
                    src={`http://localhost:3000${template.imageUrl}`}
                    alt={template.name}
                    className="w-full h-40 object-contain bg-gray-50"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                    <LayoutGrid className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-gray-600 text-sm">{template.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="relative">
              {previewTemplate.imageUrl ? (
                <img
                  src={`http://localhost:3000${previewTemplate.imageUrl}`}
                  alt={previewTemplate.name}
                  className="w-full h-56 object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                  <LayoutGrid className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <button
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {previewTemplate.name}
              </h3>
              {previewTemplate.description ? (
                <p className="text-sm text-gray-600 mb-6">{previewTemplate.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic mb-6">No description provided</p>
              )}

              {/* Hardware summary */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Hardware</p>
                </div>
                {previewHwGroups.length === 0 ? (
                  <p className="text-sm text-gray-500">No hardware included.</p>
                ) : (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {previewHwGroups.map((g) => {
                      const hw = hardwareCatalog.find((h) => h._id === g.hwId)
                      return (
                        <li key={g.hwId}>
                          {hw ? hw.Name : g.hwId} <span className="text-gray-400">× {g.count}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* HMI summary */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">HMI</p>
                </div>
                {previewTemplate.hmiUsesControlHw ? (
                  <p className="text-sm text-gray-700">Uses Control/IO hardware (Harmony P6)</p>
                ) : previewTemplate.hmiDisabled ? (
                  <p className="text-sm text-gray-500">No HMI</p>
                ) : previewHmi ? (
                  <p className="text-sm text-gray-700">{previewHmi.Name}</p>
                ) : (
                  <p className="text-sm text-gray-500">No HMI selected</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => chooseTemplate(previewTemplate)}
                  className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}