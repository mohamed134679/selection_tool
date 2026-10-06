// frontend/src/pages/admin/AdminTemplatesManager.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { LayoutGrid, ShieldCheck, Plus, Pencil, Trash2, Wand2, ListChecks, Upload, X, Cpu, Monitor, FileText, Paperclip, Check, Search } from 'lucide-react'
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
  const { startTemplateDraft } = useProjectDraft()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('standalone')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [showChoicePopup, setShowChoicePopup] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [isEditingPreview, setIsEditingPreview] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)
  const [savingPreview, setSavingPreview] = useState(false)
  const [previewSaveError, setPreviewSaveError] = useState(null)
  const [hardwareCatalog, setHardwareCatalog] = useState([])
  const [hmiOptions, setHmiOptions] = useState([])
  const [licenseCatalog, setLicenseCatalog] = useState([])
  const [importSheets, setImportSheets] = useState([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  function startWizardTemplate() {
    setShowChoicePopup(false)
    startTemplateDraft()
    navigate('/hardware')
  }

  function startManualTemplate() {
    setShowChoicePopup(false)
    navigate('/admin/templates/manual')
  }

  async function readExcelFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError(null)
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await file.arrayBuffer())
      const imageDataUrl = (image) => {
        if (!image?.buffer) return null
        const bytes = image.buffer instanceof ArrayBuffer
          ? new Uint8Array(image.buffer)
          : new Uint8Array(image.buffer.buffer, image.buffer.byteOffset, image.buffer.byteLength)
        let binary = ''
        const chunkSize = 0x8000
        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
        }
        const mime = image.extension === 'png'
          ? 'image/png'
          : image.extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg'
        return `data:${mime};base64,${btoa(binary)}`
      }
      const sheets = workbook.worksheets.map((worksheet) => {
        const cellText = (cell) => {
          if (cell && typeof cell === 'object' && Array.isArray(cell.richText)) {
            return cell.richText.map((part) => part.text || '').join('').trim()
          }
          return String(cell ?? '').trim()
        }
        const rows = []
        for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
          const values = (worksheet.getRow(rowNumber).values || []).map(cellText)
          if (values.some((cell) => cell)) rows.push(values)
        }
        const headerIndex = rows.findIndex((row) => {
          const header = row.map((cell) => cell.toLowerCase())
          return header.includes('quantity') && header.some((cell) => ['reference', 'ref', 'reference number'].includes(cell))
        })
        const header = headerIndex >= 0 ? rows[headerIndex].map((cell) => cell.toLowerCase()) : []
        const referenceIndex = header.findIndex((cell) => ['reference', 'ref', 'reference number'].includes(cell))
        const descriptionIndex = header.findIndex((cell) => cell === 'description' || cell === 'desc')
        const quantityIndex = header.findIndex((cell) => ['quantity', 'qty'].includes(cell))
        if (referenceIndex < 0 || descriptionIndex < 0 || quantityIndex < 0) {
          throw new Error(`Worksheet "${worksheet.name}" must contain Reference, Description, and Quantity columns.`)
        }
        const worksheetImage = worksheet.getImages()[0]
        const embeddedImage = worksheetImage ? workbook.media[worksheetImage.imageId] : null
        return {
          name: worksheet.name,
          category: 'standalone',
          imageData: imageDataUrl(embeddedImage),
          items: rows.slice(headerIndex + 1).map((row) => ({
            reference: row[referenceIndex],
            description: row[descriptionIndex],
            quantity: Math.max(1, Number(row[quantityIndex]) || 1),
          })).filter((item) => item.reference || item.description),
        }
      })
      if (sheets.length === 0) throw new Error('The workbook does not contain any worksheets.')
      setImportSheets(sheets)
    } catch (err) {
      console.error(err)
      setImportError(err.message || 'Could not read the Excel workbook.')
    }
  }

  async function importExcelTemplates() {
    setImporting(true)
    setImportError(null)
    try {
      const res = await authFetch('http://localhost:3000/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheets: importSheets }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Could not import templates.')
      setTemplates((prev) => [...body, ...prev])
      setImportSheets([])
      setShowChoicePopup(false)
      setImportSuccess(`Successfully imported and saved ${body.length} template${body.length === 1 ? '' : 's'} to the database.`)
    } catch (err) {
      console.error(err)
      setImportError(err.message || 'Could not import templates.')
    } finally {
      setImporting(false)
    }
  }

  function editTemplate(template) {
    setPreviewTemplate(template)
    setIsEditingPreview(false)
    setPreviewDraft(null)
    setPreviewSaveError(null)
  }

  function startPreviewEdit() {
    setPreviewDraft({
      name: previewTemplate.name || '',
      description: previewTemplate.description || '',
      category: previewTemplate.category || 'standalone',
      items: (previewTemplate.items || []).map((item) => ({
        reference: item.reference || '',
        description: item.description || '',
        quantity: item.quantity ?? 1,
      })),
      selectedHw: (previewTemplate.SelectedHw || []).map((entry) => ({ ...entry })),
      hmiRefNumber: previewTemplate.hmiRefNumber || '',
    })
    setPreviewSaveError(null)
    setIsEditingPreview(true)
  }

  async function savePreview() {
    if (!previewDraft.name.trim() || !previewDraft.category) {
      setPreviewSaveError('Name and category are required.')
      return
    }

    setSavingPreview(true)
    setPreviewSaveError(null)
    try {
      const formData = new FormData()
      formData.append('name', previewDraft.name.trim())
      formData.append('description', previewDraft.description)
      formData.append('category', previewDraft.category)
      formData.append('sourceType', previewTemplate.sourceType || 'wizard')
      formData.append('items', JSON.stringify(previewDraft.items || []))
      formData.append('SelectedHw', JSON.stringify(previewDraft.selectedHw || previewTemplate.SelectedHw || []))
      formData.append('Hmi_id', previewTemplate.Hmi_id || '')
      formData.append('hmiUsesControlHw', String(Boolean(previewTemplate.hmiUsesControlHw)))
      formData.append('hmiDisabled', String(Boolean(previewTemplate.hmiDisabled)))
      formData.append('hmiRefNumber', previewDraft.hmiRefNumber ?? previewTemplate.hmiRefNumber ?? '')
      formData.append('licences', JSON.stringify(previewTemplate.licences || {}))

      const res = await authFetch(`http://localhost:3000/templates/${previewTemplate._id}`, {
        method: 'PUT',
        body: formData,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Failed to update template')

      setTemplates((prev) => prev.map((template) => (
        template._id === body._id ? body : template
      )))
      setPreviewTemplate(body)
      setIsEditingPreview(false)
      setPreviewDraft(null)
    } catch (err) {
      console.error(err)
      setPreviewSaveError(err.message || 'Could not save template. Please try again.')
    } finally {
      setSavingPreview(false)
    }
  }

  function continueEditingTemplate(template) {
    startPreviewEdit()
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
      setIsEditingPreview(false)
    } catch (err) {
      console.error(err)
      setDeleteError('Could not delete template. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = templates
    .filter((t) => t.category === activeCategory)
    .filter((template) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      return [
        template.name,
        template.description,
        ...(template.items || []).flatMap((item) => [item.reference, item.description]),
        ...(template.SelectedHw || []).flatMap((entry) => [entry.refNumber, entry.ioRefNumber]),
        template.hmiRefNumber,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
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
      previewHwGroups[key] = { hwId: entry.hw_id, refNumber: entry.refNumber, ioRefNumber: entry.ioRefNumber, count: 0, attachments: [] }
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search templates or references..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900"
          />
        </div>
        <button
          onClick={() => setShowChoicePopup(true)}
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    template.sourceType === 'manual'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {template.sourceType === 'manual' ? 'Manual' : 'Wizard'}
                  </span>
                </div>
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
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center"><LayoutGrid className="w-10 h-10 text-gray-300" /></div>
              )}
              <button onClick={() => setPreviewTemplate(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-gray-900 shadow" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-1">
                {isEditingPreview ? (
                  <h3 className="text-xl font-semibold text-gray-900">Edit Template</h3>
                ) : (
                  <h3 className="text-xl font-semibold text-gray-900">{previewTemplate.name}</h3>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEditingPreview && (
                    <button onClick={() => continueEditingTemplate(previewTemplate)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700">
                      <Pencil className="w-3.5 h-3.5" /> Edit Template
                    </button>
                  )}
                  <button onClick={() => deleteTemplate(previewTemplate)} disabled={deletingId === previewTemplate._id} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" /> {deletingId === previewTemplate._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              {isEditingPreview ? (
                <div className="grid gap-4 mb-6">
                  <label className="grid gap-1 text-sm font-medium text-gray-700">
                    Name
                    <input
                      value={previewDraft.name}
                      onChange={(event) => setPreviewDraft((draft) => ({ ...draft, name: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-gray-700">
                    Description
                    <textarea
                      value={previewDraft.description}
                      onChange={(event) => setPreviewDraft((draft) => ({ ...draft, description: event.target.value }))}
                      rows={3}
                      className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900 focus:border-green-600 focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-gray-700">
                    Category
                    <select
                      value={previewDraft.category}
                      onChange={(event) => setPreviewDraft((draft) => ({ ...draft, category: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900 focus:border-green-600 focus:outline-none"
                    >
                      {CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                    </select>
                  </label>
                </div>
              ) : (
                previewTemplate.description
                  ? <p className="text-sm text-gray-600 mb-6">{previewTemplate.description}</p>
                  : <p className="text-sm text-gray-400 italic mb-6">No description provided</p>
              )}
              {previewSaveError && <p className="text-sm text-red-600 mb-4">{previewSaveError}</p>}

              {previewTemplate.sourceType === 'manual' && (
                <section className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Template Items</h4>
                    {isEditingPreview && (
                      <button
                        onClick={() => setPreviewDraft((draft) => ({ ...draft, items: [...draft.items, { reference: '', description: '', quantity: 1 }] }))}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Add item
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(isEditingPreview ? previewDraft.items : previewTemplate.items || []).map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_2fr_80px_auto] gap-2">
                        {isEditingPreview ? (
                          <>
                            <input value={item.reference} onChange={(event) => setPreviewDraft((draft) => ({ ...draft, items: draft.items.map((row, rowIndex) => rowIndex === index ? { ...row, reference: event.target.value } : row) }))} placeholder="Reference" className="rounded border border-gray-300 px-2 py-1.5 text-xs" />
                            <input value={item.description} onChange={(event) => setPreviewDraft((draft) => ({ ...draft, items: draft.items.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row) }))} placeholder="Description" className="rounded border border-gray-300 px-2 py-1.5 text-xs" />
                            <input type="number" min="1" value={item.quantity} onChange={(event) => setPreviewDraft((draft) => ({ ...draft, items: draft.items.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row) }))} className="rounded border border-gray-300 px-2 py-1.5 text-xs" />
                            <button onClick={() => setPreviewDraft((draft) => ({ ...draft, items: draft.items.filter((_, rowIndex) => rowIndex !== index) }))} className="text-gray-400 hover:text-red-600" aria-label="Remove item"><Trash2 className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="font-mono text-xs text-green-700">{item.reference || '—'}</span>
                            <span className="text-xs text-gray-700">{item.description || '—'}</span>
                            <span className="text-xs text-gray-700">{item.quantity}</span>
                            <span />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Cpu className="w-4 h-4 text-green-600" /><h4 className="text-sm font-semibold text-gray-900">Hardware</h4></div>
                {previewHwEntries.length === 0 ? <p className="text-sm text-gray-500">No hardware selected.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewHwEntries.map(([key, { hwId, refNumber, ioRefNumber, count, attachments }]) => {
                      const hw = hardwareCatalog.find((item) => item._id === hwId)
                      return (
                        <div key={key} className="rounded-xl border border-gray-200 p-3">
                          <p className="text-sm font-medium text-gray-900">{hw ? hw.Name : hwId}</p>
                              {isEditingPreview && previewTemplate.sourceType === 'wizard' ? (
                                <div className="mt-2 space-y-2">
                                  {(() => {
                                    const entryIndex = (previewTemplate.SelectedHw || []).findIndex((entry) => (
                                      String(entry.hw_id) === String(hwId)
                                      && entry.refNumber === refNumber
                                      && entry.ioRefNumber === ioRefNumber
                                    ))
                                    return (
                                      <label className="grid gap-1 text-xs text-gray-600">
                                        Hardware reference
                                        <input
                                          value={previewDraft.selectedHw[entryIndex]?.refNumber || ''}
                                          onChange={(event) => setPreviewDraft((draft) => ({
                                            ...draft,
                                            selectedHw: draft.selectedHw.map((row, rowIndex) => (
                                              String(row.hw_id) === String(hwId)
                                              && row.refNumber === refNumber
                                              && row.ioRefNumber === ioRefNumber
                                                ? { ...row, refNumber: event.target.value }
                                                : row
                                            )),
                                          }))}
                                          className="rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-900"
                                        />
                                      </label>
                                    )
                                  })()}
                                </div>
                              ) : refNumber ? <p className="text-xs font-mono text-green-700 mt-1">Ref: {refNumber}</p> : null}
                              {ioRefNumber && <p className="text-xs font-mono text-blue-700 mt-0.5">IO Ref: {ioRefNumber}</p>}
                          <p className="text-xs text-gray-500 mt-1">Qty: {count}</p>
                          {attachments.length > 0 && <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">{attachments.map((url, index) => <a key={index} href={`${FILE_BASE}${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-700 hover:underline"><Paperclip className="w-3 h-3" />Attachment {attachments.length > 1 ? index + 1 : ''}</a>)}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Monitor className="w-4 h-4 text-green-600" /><h4 className="text-sm font-semibold text-gray-900">HMI</h4></div>
                {previewTemplate.hmiUsesControlHw ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 inline-flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-700" />
                    <div>
                      <p className="text-sm text-gray-900">Uses Control/IO hardware (Harmony P6)</p>
                      {isEditingPreview && previewTemplate.sourceType === 'wizard' && (
                        <input
                          value={previewDraft.hmiRefNumber}
                          onChange={(event) => setPreviewDraft((draft) => ({ ...draft, hmiRefNumber: event.target.value }))}
                          placeholder="HMI reference"
                          className="mt-1 rounded border border-green-300 px-2 py-1.5 text-xs text-gray-900"
                        />
                      )}
                    </div>
                  </div>
                ) : previewTemplate.hmiDisabled ? <p className="text-sm text-gray-500">No HMI</p> : previewActiveHmi ? (
                  <div className="rounded-xl border border-gray-200 p-3 inline-flex items-center gap-3">
                    {previewActiveHmi.image && <img src={previewActiveHmi.image} alt={previewActiveHmi.Name} className="w-12 h-12 object-contain" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{previewActiveHmi.Name}</p>
                      {previewActiveHmi.brand && <p className="text-xs text-gray-500">{previewActiveHmi.brand}</p>}
                      {isEditingPreview && previewTemplate.sourceType === 'wizard' ? (
                        <input
                          value={previewDraft.hmiRefNumber}
                          onChange={(event) => setPreviewDraft((draft) => ({ ...draft, hmiRefNumber: event.target.value }))}
                          placeholder="HMI reference"
                          className="mt-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-900"
                        />
                      ) : previewTemplate.hmiRefNumber ? <p className="text-xs font-mono text-green-700 mt-1">Ref: {previewTemplate.hmiRefNumber}</p> : null}
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-500">No HMI selected.</p>}
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-green-600" /><h4 className="text-sm font-semibold text-gray-900">Licences</h4></div>
                <div className="rounded-xl border border-gray-200 p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div><p className="text-gray-500 text-xs mb-0.5">Build Time</p><p className="text-gray-900 font-medium">{previewTemplate.licences?.buildTime?.wanted ? `${previewTemplate.licences.buildTime.tier}${previewTemplate.licences.buildTime.addons?.length > 0 ? ` (${previewTemplate.licences.buildTime.addons.join(', ')})` : ''}` : 'Not needed'}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Runtime IO Points</p><p className="text-gray-900 font-medium">{previewTotalIoPoints || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Orchestration Nodes</p><p className="text-gray-900 font-medium">{previewTemplate.licences?.orchestration?.nodeCount || '—'}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Communication Protocols</p><p className="text-gray-900 font-medium">{previewTemplate.licences?.communication?.protocols?.length > 0 ? previewTemplate.licences.communication.protocols.join(', ') : 'None'}</p></div>
                </div>
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-green-600" /><h4 className="text-sm font-semibold text-gray-900">Required Licenses</h4></div>
                {previewRequiredLicenses.length === 0 ? <p className="text-sm text-gray-500">No licences required.</p> : <div className="space-y-2">{previewRequiredLicenses.map(({ lic, quantity }) => <div key={lic._id} className="rounded-xl border border-gray-200 p-3"><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-gray-900">{lic.name}{quantity > 1 && <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 ml-2">× {quantity}</span>}</p><span className="text-xs font-mono text-green-700 bg-green-50 rounded-full px-2.5 py-1">{lic.reference_no}</span></div>{lic.description && <p className="text-xs text-gray-600">{lic.description}</p>}</div>)}</div>}
              </section>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                {isEditingPreview && (
                  <button
                    onClick={() => {
                      setIsEditingPreview(false)
                      setPreviewDraft(null)
                      setPreviewSaveError(null)
                    }}
                    disabled={savingPreview}
                    className="text-sm text-gray-600 hover:underline disabled:opacity-40"
                  >
                    Cancel
                  </button>
                )}
                {isEditingPreview ? (
                  <button
                    onClick={savePreview}
                    disabled={savingPreview}
                    className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40"
                  >
                    {savingPreview ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <button onClick={() => setPreviewTemplate(null)} className="text-sm text-gray-600 hover:underline">Close</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Template choice popup */}
      {showChoicePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Template</h3>
            <p className="text-sm text-gray-600 mb-6">How would you like to build it?</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <button
                onClick={startWizardTemplate}
                className="p-5 rounded-xl border border-gray-200 hover:border-green-600 hover:shadow-md transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center mb-3">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Hardware Wizard</p>
                <p className="text-xs text-gray-600">Pick hardware, HMI, and licences from the catalog, step by step.</p>
              </button>

              <button
                onClick={startManualTemplate}
                className="p-5 rounded-xl border border-gray-200 hover:border-green-600 hover:shadow-md transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3">
                  <ListChecks className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Manual Entry</p>
                <p className="text-xs text-gray-600">Type a reference, description, and quantity for each item.</p>
              </button>

              <label className="p-5 rounded-xl border border-gray-200 hover:border-green-600 hover:shadow-md transition text-left cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Import from Excel</p>
                <p className="text-xs text-gray-600">Create one manual template per worksheet.</p>
                <input type="file" accept=".xlsx,.xls" onChange={readExcelFile} className="hidden" />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowChoicePopup(false)}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
            </div>
            {importError && <p className="text-sm text-red-600 mt-4">{importError}</p>}
          </div>
        </div>
      )}

      {importSheets.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Import Excel Templates</h3>
                <p className="text-sm text-gray-600">Choose a category for each worksheet before saving.</p>
              </div>
              <button onClick={() => setImportSheets([])} className="text-gray-500 hover:text-gray-900" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {importSheets.map((sheet, index) => (
                <div key={sheet.name} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sheet.name}</p>
                      <p className="text-xs text-gray-500">{sheet.items.length} imported item{sheet.items.length === 1 ? '' : 's'}</p>
                    </div>
                    <select
                      value={sheet.category}
                      onChange={(event) => setImportSheets((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {importError && <p className="text-sm text-red-600 mt-4">{importError}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setImportSheets([])} disabled={importing} className="text-sm text-gray-600 hover:underline disabled:opacity-40">Cancel</button>
              <button onClick={importExcelTemplates} disabled={importing} className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40">
                {importing ? 'Importing…' : `Import ${importSheets.length} Template${importSheets.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {importSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import complete</h3>
            <p className="text-sm text-gray-600">{importSuccess}</p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setImportSuccess(null)}
                className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}