import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen, LayoutGrid, Clock, ShieldCheck } from 'lucide-react'

// Mock data — replace with real values once the backend/project API is wired up
const stats = [
  { icon: LayoutGrid, label: 'Total Projects', value: 12 },
  { icon: Clock, label: 'In Progress', value: 4 },
  { icon: ShieldCheck, label: 'Needs Review', value: 2 },
]

export default function HomePage() {
  const location = useLocation()
  const [showBanner, setShowBanner] = useState(!!location.state?.projectCreated)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!showBanner) return
    const fadeTimer = setTimeout(() => setFading(true), 2500)
    const removeTimer = setTimeout(() => setShowBanner(false), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
              <span className="font-bold text-lg text-gray-900">EAE Architecture Builder</span>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button>Login</Button>
              </Link>

              <Link to="/register">
                <Button variant="outline">Register</Button>
              </Link>

              <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
                H
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Start a new architecture or pick up where you left off.</p>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          <Link to="/projects/new">
            <div className="h-full p-8 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition group cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mb-6 group-hover:bg-green-700 transition">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Project</h2>
              <p className="text-gray-600 text-sm">
                Start a new architecture — select Control, I/O, HMI, and licensing step by step.
              </p>
            </div>
          </Link>

          <Link to="/projects">
            <div className="h-full p-8 rounded-2xl border border-gray-200 hover:border-green-600 hover:shadow-md transition group cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center mb-6 group-hover:bg-gray-700 transition">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">View Projects</h2>
              <p className="text-gray-600 text-sm">
                Review, resume, or export architectures you've already built.
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-gray-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}