import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Boxes, LayoutGrid, Clock, ShieldCheck, CheckCircle } from 'lucide-react'
import { authFetch } from '../api.js'
import { useProjectDraft } from '../context/ProjectDraftContext.jsx'

const initialStats = [
  { icon: LayoutGrid, label: 'Total Projects', value: 0, filter: null },
  { icon: Clock, label: 'Pending Projects', value: 0, filter: 'pending' },
  { icon: ShieldCheck, label: 'Needs Edit', value: 0, filter: 'needs_edit' },
  { icon: CheckCircle, label: 'Approved Projects', value: 0, filter: 'approved' },
]

const PIE_COLORS = {
  pending: '#f59e0b',    // amber-500
  needs_edit: '#ef4444', // red-500
  approved: '#16a34a',   // green-600
}

export default function HomePage() {
  const navigate = useNavigate()
  const { projectDraft, setProjectDraft } = useProjectDraft()
  const [showBanner, setShowBanner] = useState(false)
  const [fading, setFading] = useState(false)
  const [showCreatePopup, setShowCreatePopup] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stats, setStats] = useState(initialStats)

  function startProject() {
    setProjectDraft({
      name,
      description,
      locked: false,
      justCreated: false,
      editingProjectId: null,
      selectedHw: [],
      hmiId: null,
      hmiUsesControlHw: false,
      hmiRefNumber: null,
      licences: {
        buildTime: { wanted: null, tier: null, addons: [] },
        runtime: { ioPoints: null },
        orchestration: { nodeCount: null },
        communication: { protocols: [] },
      },
    })
    navigate('/hardware')
  }

  // Navigate to the projects list, optionally pre-filtered by status.
  function goToProjects(filter) {
    navigate(filter ? `/projects?status=${filter}` : '/projects')
  }

  // One-shot: show the banner if we just created a project, then clear the
  // flag so it doesn't reappear on later re-renders of this same mounted
  // instance (e.g. every trapped Back-button attempt re-renders HomePage
  // without unmounting it, since we're already on "/").
  useEffect(() => {
    if (!projectDraft.justCreated) return
    setShowBanner(true)
    setProjectDraft((prev) => ({ ...prev, justCreated: false }))
  }, [])

  useEffect(() => {
    if (!showBanner) return
    const fadeTimer = setTimeout(() => setFading(true), 2500)
    const removeTimer = setTimeout(() => setShowBanner(false), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [showBanner])

  useEffect(() => {
    let active = true

    async function loadStats() {
      if (!localStorage.getItem('accessToken')) return

      try {
        const res = await authFetch('http://localhost:3000/projects')
        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`)
        const data = await res.json()
        if (!active) return

        const counts = {
          pending: 0,
          needs_edit: 0,
          approved: 0,
        }
        data.forEach((project) => {
          if (project.reviewStatus in counts) counts[project.reviewStatus] += 1
        })

        setStats((prev) =>
          prev.map((stat) => {
            if (stat.filter === null) return { ...stat, value: data.length }
            return { ...stat, value: counts[stat.filter] ?? 0 }
          })
        )
      } catch (err) {
        console.error(err)
      }
    }

    loadStats()

    return () => {
      active = false
    }
  }, [])

  // --- Donut chart geometry (built from the same `stats` values as the cards above) ---
  const size = 176
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  const totalStat = stats.find((s) => s.filter === null)
  const pieSegments = stats.filter((s) => s.filter !== null)
  const pieTotal = pieSegments.reduce((sum, s) => sum + s.value, 0)

  let cumulative = 0
  const arcs = pieSegments.map((seg) => {
    const fraction = pieTotal > 0 ? seg.value / pieTotal : 0
    const dashLength = fraction * circumference
    const arc = {
      key: seg.filter,
      label: seg.label,
      value: seg.value,
      color: PIE_COLORS[seg.filter],
      dasharray: `${dashLength} ${circumference - dashLength}`,
      dashoffset: -cumulative,
    }
    cumulative += dashLength
    return arc
  })

  return (
    <div className="min-h-screen bg-white">
      {showBanner && (
        <div
          className={`bg-green-50 text-green-800 text-sm text-center py-3 border-b border-green-200 transition-opacity duration-500 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          Project created successfully.
        </div>
      )}
      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Start a new architecture or pick up where you left off.</p>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          <div
            onClick={() => setShowCreatePopup(true)}
            className="h-full p-8 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mb-6 group-hover:bg-green-700 transition">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Project</h2>
            <p className="text-gray-600 text-sm">
              Start a new architecture — select Control, I/O, HMI, and licensing step by step.
            </p>
          </div>

          <Link to="/hardware-catalog">
            <div className="h-full p-8 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition group cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Hardware Catalog</h2>
              <p className="text-gray-600 text-sm">
                Browse available Control, I/O, and HMI hardware and their specs.
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToProjects(stat.filter)}
              className="p-6 rounded-xl border border-gray-200 flex items-center gap-4 text-left hover:border-green-600 hover:shadow-md transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Status Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Status Breakdown</h2>

          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
            {/* Donut chart */}
            <div className="relative flex-shrink-0">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Track */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth={strokeWidth}
                />
                {pieTotal === 0 ? null : (
                  <g transform={`rotate(-90 ${cx} ${cy})`}>
                    {arcs.map((arc) =>
                      arc.value === 0 ? null : (
                        <circle
                          key={arc.key}
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill="none"
                          stroke={arc.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={arc.dasharray}
                          strokeDashoffset={arc.dashoffset}
                          strokeLinecap="butt"
                        />
                      )
                    )}
                  </g>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900">{totalStat?.value ?? 0}</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full sm:w-auto flex-1 space-y-1.5">
              {pieSegments.map((seg) => (
                <div
                  key={seg.filter}
                  className="w-full flex items-center justify-between gap-4 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[seg.filter] }}
                    />
                    <span className="text-sm text-gray-700 truncate">{seg.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Project</h3>

            <label className="text-sm text-gray-600 mb-1 block">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4"
            />

            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4"
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreatePopup(false)}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
              <button
                disabled={!name}
                onClick={startProject}
                className={`rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 ${
                  !name ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}