import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    apiLogin(username, password)
      .then((data) => {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('appUsername', username)
        setLoading(false)
        navigate('/home')
      })
      .catch((err) => {
        setLoading(false)
        alert(err.message || 'Login failed')
      })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-bold">SE</span>
          </div>
          <span className="font-bold text-xl">EAE Architecture Builder</span>
        </div>

        <div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Build the Right EAE Architecture
          </h1>
          <p className="text-lg opacity-90 mb-12 max-w-md">
            Select controllers, I/O, HMI, and licensing for EcoStruxure Automation Expert
            deployments, guided by validated Schneider Electric selection.
          </p>

          <div className="space-y-4">
            {[
              'Guided Control, I/O, HMI & License selection',
              'Validated against EAE Solution Architect guidelines',
              'Employee & certified partner access',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-75">&copy; 2026 Schneider Electric — Internal Tool. Not for external distribution.</p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <span className="font-bold text-lg text-gray-900">EAE Architecture Builder</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-8">Sign in with your Schneider Electric account or Certified Partner account.</p>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600" />
                Remember me
              </label>
              <a href="#" className="text-green-600 hover:text-green-700 font-semibold">Forgot password?</a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-green-600 hover:text-green-700 font-semibold">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}