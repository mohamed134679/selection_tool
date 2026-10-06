// frontend/src/components/TemplatesPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ShieldCheck, ArrowLeft, Plus, X, Cpu, Monitor, FileText, Paperclip, Check, Pencil, Trash2, Search } from 'lucide-react'
import { authFetch } from '../api.js'
import { useProjectDraft } from '../context/ProjectDraftContext.jsx'
import { isHarmonyP6 } from '../lib/harmonyP6'
import { buildRequiredLicenses } from '../lib/licensing'

const FILE_BASE = 'http://localhost:3000'
const CATEGORIES = [
  { key: 'standalone', label: 'Standalone Architectures', icon: LayoutGrid },
  { key: 'redundant', label: 'Redundant Architectures', icon: ShieldCheck },
]

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { setProjectDraft, loadTemplateForEdit } = useProjectDraft()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('standalone')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [hardwareCatalog, setHardwareCatalog] = useState([])
  const [hmiOptions, setHmiOptions] = useState([])
  const [licenseCatalog, setLicenseCatalog] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewQuantities, setPreviewQuantities] = useState([])
  const [usingTemplate, setUsingTemplate] = useState(false)
  const [useTemplateError, setUseTemplateError] = useState(null)

  // ASSUMPTION: adjust to however you actually expose the logged-in user's role.
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
    return () => { active = false }
  }, [])

  useEffect(() => {
    fetch('http://localhost:3000/hardware').then((res) => res.json()).then(setHardwareCatalog).catch(() => {})
  }, [])
  useEffect(() => {
    fetch('http://localhost:3000/hmi').then((res) => res.json()).then(setHmiOptions).catch(() => {})
  }, [])
  useEffect(() => {
    fetch('http://localhost:3000/license').then((res) => res.json()).then(setLicenseCatalog).catch(() => {})
  }, [])

  async function chooseTemplate(template) {
    const templateItems = (template.items ?? []).map((item, index) => ({
      ...item,
      quantity: previewQuantities[index]?.quantity ?? item.quantity ?? 1,
    }))
    if (template.sourceType === 'manual') {
      setProjectDraft({
        mode: "project",
        sourceType: "manual",
        items: templateItems,
        name: template.name,
        description: template.description ?? '',
        locked: false,
        justCreated: false,
        editingProjectId: null,
        editingTemplateId: null,
        templateMeta: null,
        selectedHw: [],
        hmiId: null,
        hmiUsesControlHw: false,
        hmiDisabled: true,
        hmiRefNumber: null,
        licences: {
          buildTime: { wanted: null, tier: null, addons: [] },
          runtime: { ioPoints: null },
          orchestration: { nodeCount: null },
          communication: { protocols: [] },
        },
      })
      navigate('/summary')
      return
    }
    setUsingTemplate(true)
    setUseTemplateError(null)
    try {
      const res = await authFetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description ?? '',
          sourceType: 'wizard',
          items: [],
          SelectedHw: template.SelectedHw ?? [],
          Hmi_id: template.Hmi_id ?? null,
          hmiUsesControlHw: template.hmiUsesControlHw ?? false,
          hmiDisabled: template.hmiDisabled ?? false,
          hmiRefNumber: template.hmiRefNumber ?? null,
          licences: template.licences ?? {
            buildTime: { wanted: null, tier: null, addons: [] },
            runtime: { ioPoints: null },
            orchestration: { nodeCount: null },
            communication: { protocols: [] },
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Could not save the project.')
      setPreviewTemplate(null)
      navigate(`/projects/${body._id}`)
    } catch (err) {
      console.error(err)
      setUseTemplateError(err.message || 'Could not save the project.')
    } finally {
      setUsingTemplate(false)
    }
  }

  function editTemplate(template) {
    loadTemplateForEdit(template)
    setPreviewTemplate(null)
    navigate('/hardware')
  }

  async function deleteTemplate(template) {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await authFetch(`http://localhost:3000/templates/${template._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete template')
      setTemplates((prev) => prev.filter((t) => t._id !== template._id))
      setPreviewTemplate(null)
    } catch (err) {
      console.error(err)
      setDeleteError('Could not delete template. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = templates.filter((t) => t.category === activeCategory)
    .filter((t) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return [
        t.name,
        t.description,
        ...(t.items || []).flatMap((item) => [item.reference, item.description]),
        ...(t.SelectedHw || []).flatMap((entry) => [entry.refNumber, entry.ioRefNumber]),
        t.hmiRefNumber,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })

  // --- Detailed preview computations (mirrors Summary.jsx) ---
  const previewHw = previewTemplate?.SelectedHw ?? []

  const previewTotalIoPoints = previewHw.reduce(
    (sum, entry) => sum + (Number(entry.ioPoints) || 0),
    0
  )

  const previewActiveHmi = previewTemplate?.hmiDisabled
    ? null
    : previewTemplate?.hmiUsesControlHw
    ? hmiOptions.find(isHarmonyP6)
    : hmiOptions.find((h) => h._id === previewTemplate?.Hmi_id)

  const previewHwGroups = {}
  previewHw.forEach((entry) => {
    const key = `${entry.hw_id}::${entry.refNumber || 'no-ref'}::${entry.ioRefNumber || 'no-io-ref'}`
    if (!previewHwGroups[key]) {
      previewHwGroups[key] = {
        hwId: entry.hw_id,
        refNumber: entry.refNumber,
        ioRefNumber: entry.ioRefNumber,
        count: 0,
        attachments: [],
      }
    }
    previewHwGroups[key].count += 1
    if (entry.attachmentUrl) previewHwGroups[key].attachments.push(entry.attachmentUrl)
  })
  const previewHwEntries = Object.entries(previewHwGroups)

  const previewHardwareLicenseIds = previewHw
    .map((entry) => hardwareCatalog.find((h) => h._id === entry.hw_id)?.license)
    .filter(Boolean)

  const previewRequiredLicenses = previewTemplate
    ? buildRequiredLicenses({
        buildTimeWanted: previewTemplate.licences?.buildTime?.wanted,
        buildTimeTier: previewTemplate.licences?.buildTime?.tier,
        buildTimeAddons: previewTemplate.licences?.buildTime?.addons ?? [],
        totalIoPoints: previewTotalIoPoints,
        orchestrationNodeCount: previewTemplate.licences?.orchestration?.nodeCount,
        protocols: previewTemplate.licences?.communication?.protocols ?? [],
        licenseCatalog,
        hmiLicenseId: previewActiveHmi?.license,
        hardwareLicenseIds: previewHardwareLicenseIds,
      })
    : []

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">

        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
            <p className="text-gray-600">Start from a previously saved project.</p>
            <div className="relative mt-4 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by template or reference"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-green-600 focus:outline-none"
              />
            </div>
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
                key={template._id}
                onClick={() => {
                  setPreviewTemplate(template)
                  setPreviewQuantities((template.items || []).map((item) => ({ quantity: item.quantity ?? 1 })))
                }}
                className="h-full rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition cursor-pointer overflow-hidden"
              >
                {template.imageUrl ? (
                  <img
                    src={`${FILE_BASE}${template.imageUrl}`}
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

      {/* Detailed preview modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="relative">
              {previewTemplate.imageUrl ? (
                <img
                  src={`${FILE_BASE}${previewTemplate.imageUrl}`}
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
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {previewTemplate.name}
                </h3>
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => editTemplate(previewTemplate)}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(previewTemplate)}
                      disabled={deleting}
                      className={`flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 ${deleting ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {previewTemplate.description ? (
                <p className="text-sm text-gray-600 mb-6">{previewTemplate.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic mb-6">No description provided</p>
              )}

              {deleteError && (
                <p className="text-sm text-red-600 mb-4">{deleteError}</p>
              )}
              {useTemplateError && (
                <p className="text-sm text-red-600 mb-4">{useTemplateError}</p>
              )}

              {previewTemplate.sourceType === 'manual' && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Template Items</h4>
                  </div>
                  {previewTemplate.items?.length ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      {previewTemplate.items.map((item, index) => (
                        <div key={`${item.reference}-${index}`} className="grid grid-cols-[1fr_2fr_90px] gap-3 px-3 py-2 border-b last:border-b-0 border-gray-100 text-sm">
                          <span className="font-mono text-green-700">{item.reference || '—'}</span>
                          <span className="text-gray-700">{item.description || '—'}</span>
                          <label className="grid gap-1 text-xs text-gray-500">
                            Quantity
                            <input
                              type="number"
                              min="1"
                              value={previewQuantities[index]?.quantity ?? item.quantity ?? 1}
                              onChange={(event) => setPreviewQuantities((quantities) => quantities.map((quantity, quantityIndex) => quantityIndex === index ? { quantity: event.target.value } : quantity))}
                              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-500">No template items.</p>}
                </section>
              )}

              {/* Hardware */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Hardware</h4>
                </div>
                {previewHwEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No hardware selected.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewHwEntries.map(([key, { hwId, refNumber, ioRefNumber, count, attachments }]) => {
                      const hw = hardwareCatalog.find((h) => h._id === hwId)
                      return (
                        <div key={key} className="rounded-xl border border-gray-200 p-3">
                          <p className="text-sm font-medium text-gray-900">{hw ? hw.Name : hwId}</p>
                          {refNumber && <p className="text-xs font-mono text-green-700 mt-1">Ref: {refNumber}</p>}
                          {ioRefNumber && <p className="text-xs font-mono text-blue-700 mt-0.5">IO Ref: {ioRefNumber}</p>}
                          <p className="text-xs text-gray-500 mt-1">Qty: {count}</p>
                          {attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                              {attachments.map((url, i) => (
                                <a
                                  key={i}
                                  href={`${FILE_BASE}${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-green-700 hover:underline"
                                >
                                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                                  Attachment {attachments.length > 1 ? i + 1 : ""}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* HMI */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900">HMI</h4>
                </div>
                {previewTemplate.hmiUsesControlHw ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 inline-flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <p className="text-sm text-gray-900">Uses Control/IO hardware (Harmony P6)</p>
                  </div>
                ) : previewTemplate.hmiDisabled ? (
                  <p className="text-sm text-gray-500">No HMI</p>
                ) : previewActiveHmi ? (
                  <div className="rounded-xl border border-gray-200 p-3 inline-flex items-center gap-3">
                    {previewActiveHmi.image && (
                      <img src={previewActiveHmi.image} alt={previewActiveHmi.Name} className="w-12 h-12 object-contain" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{previewActiveHmi.Name}</p>
                      {previewActiveHmi.brand && <p className="text-xs text-gray-500">{previewActiveHmi.brand}</p>}
                      {previewTemplate.hmiRefNumber && (
                        <p className="text-xs font-mono text-green-700 mt-1">Ref: {previewTemplate.hmiRefNumber}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No HMI selected.</p>
                )}
              </section>

              {/* Licences */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Licences</h4>
                </div>
                <div className="rounded-xl border border-gray-200 p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Build Time</p>
                    <p className="text-gray-900 font-medium">
                      {previewTemplate.licences?.buildTime?.wanted
                        ? `${previewTemplate.licences.buildTime.tier}${
                            previewTemplate.licences.buildTime.addons?.length > 0
                              ? ` (${previewTemplate.licences.buildTime.addons.join(', ')})`
                              : ''
                          }`
                        : 'Not needed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Runtime IO Points</p>
                    <p className="text-gray-900 font-medium">{previewTotalIoPoints || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Orchestration Nodes</p>
                    <p className="text-gray-900 font-medium">{previewTemplate.licences?.orchestration?.nodeCount || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Communication Protocols</p>
                    <p className="text-gray-900 font-medium">
                      {previewTemplate.licences?.communication?.protocols?.length > 0
                        ? previewTemplate.licences.communication.protocols.join(', ')
                        : 'None'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Required Licenses */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Required Licenses</h4>
                </div>
                {previewRequiredLicenses.length === 0 ? (
                  <p className="text-sm text-gray-500">No licences required.</p>
                ) : (
                  <div className="space-y-2">
                    {previewRequiredLicenses.map(({ lic, quantity }) => (
                      <div key={lic._id} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-4 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {lic.name}
                            {quantity > 1 && (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                                × {quantity}
                              </span>
                            )}
                          </p>
                          <span className="flex-shrink-0 text-xs font-mono text-green-700 bg-green-50 rounded-full px-2.5 py-1">
                            {lic.reference_no}
                          </span>
                        </div>
                        {lic.description && <p className="text-xs text-gray-600">{lic.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => chooseTemplate(previewTemplate)}
                  disabled={usingTemplate}
                  className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40"
                >
                  {usingTemplate
                    ? 'Saving…'
                    : previewTemplate.sourceType === 'wizard'
                    ? 'Use & Save Project'
                    : 'Use This Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}