import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Heart,
  Phone,
  Megaphone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/kampagnen', label: 'Kampagnen', icon: Megaphone },
  { href: '/admin/calls', label: 'Call-Log', icon: Phone },
  { href: '/admin/posts', label: 'LinkedIn Posts', icon: FileText },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#0D9488]" />
            <span className="font-semibold text-[#1E3A5F]">CHMetrics</span>
            <span className="text-xs bg-[#0D9488] text-white px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#0D9488] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find((item) => item.href === location.pathname)?.label || 'Dashboard'}
          </h1>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
