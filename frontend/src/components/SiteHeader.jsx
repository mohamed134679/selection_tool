export default function SiteHeader() {
  const username = localStorage.getItem('appUsername') || ''
  const initial = username.trim().charAt(0).toUpperCase() || 'H'

  return (
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
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
              {initial}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}