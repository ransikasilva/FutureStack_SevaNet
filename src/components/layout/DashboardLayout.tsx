'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  BarChart3,
  Clock,
  UserCheck,
  FolderOpen,
  Home
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Role-based navigation
  const getNavigationForRole = () => {
    const role = user?.profile?.role
    
    switch (role) {
      case 'officer':
        return [
          { name: 'Dashboard', href: '/officer', icon: Home },
          { name: 'Appointments', href: '/officer/appointments', icon: Calendar },
          { name: 'Schedule', href: '/officer/schedule', icon: Clock },
          { name: 'Documents', href: '/officer/documents', icon: FileText },
          { name: 'Profile', href: '/dashboard/profile', icon: User },
        ]
      
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin', icon: Home },
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Services', href: '/admin/services', icon: Settings },
          { name: 'Officers', href: '/admin/officers', icon: UserCheck },
          { name: 'Profile', href: '/dashboard/profile', icon: User },
        ]
      
      default: // citizen
        return [
          { name: 'Dashboard', href: '/dashboard', icon: Home },
          { name: 'Book Appointment', href: '/dashboard/book', icon: Calendar },
          { name: 'My Appointments', href: '/dashboard/appointments', icon: FileText },
          { name: 'Documents', href: '/dashboard/documents', icon: FolderOpen },
          { name: 'Profile', href: '/dashboard/profile', icon: User },
        ]
    }
  }

  const navigation = getNavigationForRole()

  const isCurrentPage = (href: string) => {
    return pathname === href || (href !== '/dashboard' && href !== '/officer' && href !== '/admin' && pathname.startsWith(href))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl">
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 px-6">
            <Logo size="md" showText={true} />
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-government-dark-blue flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.profile?.role || 'citizen'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-6 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const current = isCurrentPage(item.href)
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                        current 
                          ? 'bg-government-dark-blue text-white' 
                          : 'text-gray-700 hover:text-government-dark-blue hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        current ? 'text-white' : 'text-gray-400 group-hover:text-government-dark-blue'
                      }`} />
                      {item.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-6">
            <Logo size="md" showText={true} />
          </div>
          
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-government-dark-blue flex items-center justify-center">
                <span className="text-base font-semibold text-white">
                  {user?.profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-base font-semibold text-gray-900">
                  {user?.profile?.full_name || 'User'}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user?.profile?.role || 'citizen'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const current = isCurrentPage(item.href)
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        current 
                          ? 'bg-government-dark-blue text-white shadow-md' 
                          : 'text-gray-700 hover:text-government-dark-blue hover:bg-blue-50'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${
                        current ? 'text-white' : 'text-gray-400 group-hover:text-government-dark-blue'
                      }`} />
                      {item.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-lg hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center border-b border-gray-200 bg-white shadow-sm">
          <button
            className="border-r border-gray-200 px-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-government-dark-blue focus:ring-inset lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 items-center justify-between px-6">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {user?.profile?.role === 'admin' ? 'Admin Portal' :
                 user?.profile?.role === 'officer' ? 'Officer Portal' :
                 'SevaNet Portal'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date */}
              <div className="hidden md:block text-sm font-medium text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              {/* Notifications */}
              <button className="relative rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Settings */}
              <button className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}