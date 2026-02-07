import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <nav className="sticky top-0 z-50 pt-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg rounded-full p-1 border border-gray-200/50 shadow-lg">
            <Link
              to="/"
              className="font-medium text-gray-700 px-6 py-2 rounded-full transition-all hover:bg-gray-100 [&.active]:bg-gray-900 [&.active]:text-white"
            >
              Portfolio
            </Link>
            <Link
              to="/market"
              className="font-medium text-gray-700 px-6 py-2 rounded-full transition-all hover:bg-gray-100 [&.active]:bg-gray-900 [&.active]:text-white"
            >
              Market
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
