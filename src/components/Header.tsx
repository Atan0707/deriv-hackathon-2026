import { Link } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { data: session } = authClient.useSession()

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.reload()
  }

  return (
    <nav className="sticky top-0 z-50 pt-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
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
          
          {session && (
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-lg rounded-full px-4 py-2 border border-gray-200/50 shadow-lg">
              <span className="text-sm text-gray-700">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="rounded-full"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
