import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function FloatingLogout() {
  const { data: session } = authClient.useSession()

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.reload()
  }

  if (!session) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-lg rounded-full px-4 py-2 border border-gray-200/50 shadow-lg">
      <span className="text-sm text-gray-700">
        {session.user.name || session.user.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}
