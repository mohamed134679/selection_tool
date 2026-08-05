import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Eye, EyeOff, User, Building2 } from 'lucide-react'
import { register as apiRegister } from '../api'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    accountType: 'employee',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      username: formData.username,
      password: formData.password,
      accountType: formData.accountType,
    }

    apiRegister(payload)
      .then((data) => {
        setLoading(false)
        // store accessToken if returned
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
        navigate('/')
      })
      .catch((err) => {
        setLoading(false)
        alert(err.message || 'Registration failed')
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
            Request Your Access
          </h1>
          <p className="text-lg opacity-90 mb-12 max-w-md">
            Join Schneider Electric employees and certified partners using the tool to scope
            Control, I/O, HMI, and license architectures for EAE deployments.
          </p>

          <div className="space-y-6">
            {[
              { title: 'Guided by the Numbers', desc: 'Four architecture layers, one consistent seven-step workflow' },
              { title: 'Partner Accounts Reviewed', desc: 'Certified partner requests are typically approved within 2 business days' },
              { title: 'Validated Recommendations', desc: 'Every suggestion traces back to EAE Solution Architect guidelines' },
            ].map((feature, idx) => (
              <div key={idx}>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm opacity-75">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-75">&copy; 2026 Schneider Electric — Internal Tool. Not for external distribution.</p>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto py-12">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <span className="font-bold text-lg text-gray-900">EAE Architecture Builder</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Access</h2>
          <p className="text-gray-600 mb-8">For Schneider Electric employees and certified partners only.</p>

        

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'employee', label: 'SE Employee' },
                  { value: 'partner', label: 'Certified Partner' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center gap-2 py-3 border rounded-lg cursor-pointer text-sm font-semibold transition ${
                      formData.accountType === option.value
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={option.value}
                      checked={formData.accountType === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your_username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Company Input */}
            {/* <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {formData.accountType === 'partner' ? 'Partner Company' : 'Business Unit / Site (Optional)'}
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={formData.accountType === 'partner' ? 'Your company' : 'e.g. Industrial Automation, EMEA'}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required={formData.accountType === 'partner'}
                />
              </div>
            </div> */}

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="text-xs text-gray-500 mt-2">At least 8 characters with uppercase, lowercase, and numbers</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-green-600 mt-0.5 flex-shrink-0"
                required
              />
              <span className="text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-green-600 hover:text-green-700 font-semibold">Internal Use Policy</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:text-green-700 font-semibold">Data Handling Guidelines</a>
              </span>
            </label>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold text-base"
            >
              {loading
                ? 'Submitting...'
                : formData.accountType === 'partner'
                ? 'Submit Access Request'
                : 'Create Account'}
            </Button>

            {formData.accountType === 'partner' && (
              <p className="text-xs text-gray-500 text-center">
                Partner requests are reviewed before access is granted.
              </p>
            )}
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}