// frontend/src/pages/admin/AdminTemplatesManager.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, ShieldCheck, Plus, Pencil, Trash2, X, Cpu, Monitor, FileText, Paperclip, Check } from 'lucide-react'
import { authFetch } from '../../api.js'
import { useProjectDraft } from '../../context/ProjectDraftContext.jsx'
import { isHarmonyP6 } from '../../lib/harmonyP6'
import { buildRequiredLicenses } from '../../lib/licensing'

const FILE_BASE = 'http://localhost:3000'
const CATEGORIES = [
  { key: 'standalone', label: 'Standalone Architectures', icon: LayoutGrid },
  { key: 'redundant', label: 'Redundant Architectures', icon: ShieldCheck },
]

export default function AdminTemplatesManager() {
  const navigate = useNavigate()
  const { loadTemplateForEdit } = useProjectDraft()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('standalone')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [hardwareCatalog, setHardwareCatalog] = useState([])
  const [hmiOptions, setHmiOptions] = useState([])
  const [licenseCatalog, setLicenseCatalog] = useState([])

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
    fetch('http://localhost:3000/hmi').then((res) => res.json()).then(setHmiOptions).catch(() => {})
    fetch('http://localhost:3000/license').then((res) => res.json()).then(setLicenseCatalog).catch(() => {})
  }, [])

  function createNewTemplate() {
    navigate('/admin/templates/new')
  }

  function editTemplate(template) {
    loadTemplateForEdit(template)
    setPreviewTemplate(null)
    navigate('/hardware')
  }

  async function deleteTemplate(template) {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    setDeletingId(template._id)
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
      setDeletingId(null)
    }
  }

  const filtered = templates.filter((t) => t.category === activeCategory)
  const previewHw = previewTemplate?.SelectedHw ?? []
  const previewTotalIoPoints = previewHw.reduce((sum, entry) => sum + (Number(entry.ioPoints) || 0), 0)
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
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Templates</h2>
          <p className="text-sm text-gray-600">Create, edit, and remove saved architecture templates.</p>
        </div>
        <button
          onClick={createNewTemplate}
          className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-3 mb-6 border-b border-gray-200">
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

      {deleteError && (
        <p className="text-sm text-red-600 mb-4">{deleteError}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading templates…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No templates in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <div
              key={template._id}
              onClick={() => setPreviewTemplate(template)}
              className="rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col"
            >
              {template.imageUrl ? (
                <img
                  src={`${FILE_BASE}${template.imageUrl}`}
                  alt={template.name}
                  className="w-full h-32 object-contain bg-gray-50"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                  <LayoutGrid className="w-7 h-7 text-gray-300" />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{template.description}</p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      editTemplate(template)
                    }}
                    className="flex items-center justify-center gap-1.5 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-green-600 hover:text-green-700 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteTemplate(template)
                    }}
                    disabled={deletingId === template._id}
                    className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-500 hover:text-red-600 transition ${
                      deletingId === template._id ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === template._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="relative">
              {previewTemplate.imageUrl ? (
                <img src={`${FILE_BASE}${previewTemplate.imageUrl}`} alt={previewTemplate.name} className="w-full h-56 object-contain bg-gray-50" />
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
                <h3 className="text-xl font-semibold text-gray-900">{previewTemplate.name}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => editTemplate(previewTemplate)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(previewTemplate)}
                    disabled={deletingId === previewTemplate._id}
                    className={`flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 ${deletingId === previewTemplate._id ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === previewTemplate._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              {previewTemplate.description ? (
                <p className="text-sm text-gray-600 mb-6">{previewTemplate.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic mb-6">No description provided</p>
              )}
              {deleteError && <p className="text-sm text-red-600 mb-4">{deleteError}</p>}

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
                      const hw = hardwareCatalog.find((item) => item._id === hwId)
                      return (
                        <div key={key} className="rounded-xl border border-gray-200 p-3">
                          <p className="text-sm font-medium text-gray-900">{hw ? hw.Name : hwId}</p>
                          {refNumber && <p className="text-xs font-mono text-green-700 mt-1">Ref: {refNumber}</p>}
                          {ioRefNumber && <p className="text-xs font-mono text-blue-700 mt-0.5">IO Ref: {ioRefNumber}</p>}
                          <p className="text-xs text-gray-500 mt-1">Qty: {count}</p>
                          {attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                              {attachments.map((url, index) => (
                                <a key={index} href={`${FILE_BASE}${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-700 hover:underline">
                                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                                  Attachment {attachments.length > 1 ? index + 1 : ''}
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
                    {previewActiveHmi.image && <img src={previewActiveHmi.image} alt={previewActiveHmi.Name} className="w-12 h-12 object-contain" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{previewActiveHmi.Name}</p>
                      {previewActiveHmi.brand && <p className="text-xs text-gray-500">{previewActiveHmi.brand}</p>}
                      {previewTemplate.hmiRefNumber && <p className="text-xs font-mono text-green-700 mt-1">Ref: {previewTemplate.hmiRefNumber}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No HMI selected.</p>
                )}
              </section>

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
                        ? `${previewTemplate.licences.buildTime.tier}${previewTemplate.licences.buildTime.addons?.length > 0 ? ` (${previewTemplate.licences.buildTime.addons.join(', ')})` : ''}`
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
                      {previewTemplate.licences?.communication?.protocols?.length > 0 ? previewTemplate.licences.communication.protocols.join(', ') : 'None'}
                    </p>
                  </div>
                </div>
              </section>

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
                          <p className="text-sm font-semibold text-gray-900">
                            {lic.name}
                            {quantity > 1 && <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 ml-2">× {quantity}</span>}
                          </p>
                          <span className="flex-shrink-0 text-xs font-mono text-green-700 bg-green-50 rounded-full px-2.5 py-1">{lic.reference_no}</span>
                        </div>
                        {lic.description && <p className="text-xs text-gray-600">{lic.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button onClick={() => setPreviewTemplate(null)} className="text-sm text-gray-600 hover:underline">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}