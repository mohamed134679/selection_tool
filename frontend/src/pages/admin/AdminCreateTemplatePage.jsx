// frontend/src/pages/admin/AdminCreateTemplatePage.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectDraft } from '../../context/ProjectDraftContext.jsx'

export default function AdminCreateTemplatePage() {
  const navigate = useNavigate()
  const { startTemplateDraft } = useProjectDraft()

  useEffect(() => {
    startTemplateDraft()
    navigate('/hardware')
  }, [])

  return null
}