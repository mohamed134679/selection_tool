// frontend/src/pages/admin/AdminManualTemplateForm.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { authFetch } from '../../api.js'

const CATEGORIES = [
  { value: 'standalone', label: 'Standalone Architecture' },
  { value: 'redundant', label: 'Redundant Architecture' },
]

function emptyItem() {
  return { reference: '', description: '', quantity: 1 }
}

export default function AdminManualTemplateForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('standalone')
  const [items, setItems] = useState([emptyItem()])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    let active = true
    authFetch(`http://localhost:3000/templates/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load template')
        return res.json()
      })
      .then((template) => {
        if (!active) return
        setName(template.name || '')
        setDescription(template.description || '')
        setCategory(template.category || 'standalone')
        setItems(
          template.items && template.items.length > 0
            ? template.items.map((it) => ({ reference: it.reference || '', description: it.description || '', quantity: it.quantity ?? 1 }))
            : [emptyItem()]
        )
        setExistingImageUrl(template.imageUrl || null)
      })
      .catch((err) => {
        console.error(err)
        if (active) setError('Could not load this template.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id, isEditing])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItemRow() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItemRow(index) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !category) return

    setSubmitting(true)
    setError(null)
    try {
      const cleanedItems = items
        .filter((it) => it.reference.trim() || it.description.trim())
        .map((it) => ({
          reference: it.reference.trim(),
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
        }))

      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('sourceType', 'manual')
      formData.append('items', JSON.stringify(cleanedItems))
      if (imageFile) formData.append('image', imageFile)

      const url = isEditing
        ? `http://localhost:3000/templates/${id}`
        : 'http://localhost:3000/templates'

      const res = await authFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} template (${res.status})`)

      navigate('/admin?tab=templates')
    } catch (err) {
      console.error(err)
      setError(`Could not ${isEditing ? 'update' : 'create'} template. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  const currentImageSrc = imagePreview
    || (existingImageUrl ? `http://localhost:3000${existingImageUrl}` : null)

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-sm text-gray-500">Loading template…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <button
          onClick={() => navigate('/admin?tab=templates')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Edit Template' : 'New Template'} <span className="text-base font-normal text-gray-400">· Manual Entry</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Image</label>
            <label className="flex items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-600 cursor-pointer overflow-hidden transition">
              {currentImageSrc ? (
                <img src={currentImageSrc} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <ImagePlus className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Category <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    category === cat.value
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items (BOM) */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Bill of Materials</label>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 px-1">
                <p className="text-xs font-medium text-gray-500">Reference</p>
                <p className="text-xs font-medium text-gray-500">Description</p>
                <p className="text-xs font-medium text-gray-500">Qty</p>
                <span />
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
                  <input
                    type="text"
                    value={item.reference}
                    onChange={(e) => updateItem(index, 'reference', e.target.value)}
                    placeholder="e.g. BMED581020"
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-mono w-full"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="e.g. M580 distributed CPU"
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-full"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length === 1}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition ${
                      items.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="mt-3 flex items-center gap-1.5 text-sm text-green-700 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add row
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin?tab=templates')}
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || submitting}
              className={`rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-medium hover:bg-green-700 ${
                !name || submitting ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Template' : 'Create Template')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}