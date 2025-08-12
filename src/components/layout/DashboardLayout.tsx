'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { signOut } from '@/lib/auth'
import { Logo } from '@/components/ui/Logo'
import { 
  Calendar, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X,
  Settings,
  Bell,
  BarChart3
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthContext()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, current: true },
    { name: 'Book Appointment', href: '/dashboard/book', icon: Calendar },
    { name: 'My Appointments', href: '/dashboard/appointments', icon: FileText },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  // Add officer/admin specific navigation
  if (user?.profile?.role === 'officer') {
    navigation.splice(1, 0, 
      { name: 'Manage Appointments', href: '/officer/appointments', icon: Calendar },
      { name: 'Review Documents', href: '/officer/documents', icon: FileText }
    )
  }

  if (user?.profile?.role === 'admin') {
    navigation.splice(1, 0, 
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Manage Services', href: '/admin/services', icon: Settings }
    )
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <Logo size="sm" showText={false} />
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-base font-medium rounded-md"
              >
                <item.icon className="text-gray-400 mr-4 h-6 w-6" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4">
              <Logo size="sm" showText={false} />
            </div>
            <nav className="mt-8 flex-1 flex flex-col divide-y divide-gray-200 overflow-y-auto">
              <div className="px-2 space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  >
                    <item.icon className="text-gray-400 mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {user?.profile?.role === 'admin' ? 'Admin Dashboard' :
                 user?.profile?.role === 'officer' ? 'Officer Dashboard' :
                 'Dashboard'}
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <button className="text-gray-400 hover:text-gray-500 p-2">
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="relative flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.profile?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.profile?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.profile?.role || 'citizen'}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-gray-500 p-2"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}