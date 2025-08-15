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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white shadow-2xl border-r border-gray-200">
          {/* Mobile Header */}
          <div className="flex h-20 flex-shrink-0 items-center justify-between bg-white border-b border-gray-200 px-6">
            <div className="-mt-6">
              <Logo size="md" showText={false} />
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile User Profile */}
          <div className="p-6 bg-gradient-to-br from-government-dark-blue/5 to-blue-50/50 border-b border-blue-100">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-government-dark-blue to-blue-700 flex items-center justify-center shadow-lg">
                <span className="text-base font-bold text-white">
                  {user?.profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-base font-bold text-gray-900">
                  {user?.profile?.full_name || 'User'}
                </p>
                <p className="text-sm text-blue-600 capitalize font-medium">
                  {user?.profile?.role || 'citizen'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const current = isCurrentPage(item.href)
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                        current 
                          ? 'bg-gradient-to-r from-government-dark-blue to-blue-700 text-white shadow-lg shadow-blue-500/25 scale-105' 
                          : 'text-gray-700 hover:text-government-dark-blue hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50/50 hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <div className={`mr-3 p-1.5 rounded-lg ${current ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'} transition-all duration-300`}>
                        <item.icon className={`h-4 w-4 ${
                          current ? 'text-white' : 'text-blue-600 group-hover:text-government-dark-blue'
                        }`} />
                      </div>
                      {item.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Mobile Sign Out */}
          <div className="p-4 border-t border-red-100 bg-gradient-to-r from-red-50/50 to-pink-50/50">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-4 py-3.5 text-sm font-semibold text-red-700 rounded-xl hover:text-red-800 hover:bg-gradient-to-r hover:from-red-100 hover:to-red-50 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <div className="mr-3 p-1.5 rounded-lg bg-red-100 group-hover:bg-red-200 transition-all duration-300">
                <LogOut className="h-4 w-4 text-red-600" />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200 shadow-lg">
          {/* Logo Section */}
          <div className="flex h-20 flex-shrink-0 items-center justify-center bg-white border-b border-gray-200 px-6">
            <div className="-mt-6">
              <Logo size="md" showText={false} />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const current = isCurrentPage(item.href)
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        current 
                          ? 'bg-gradient-to-r from-government-dark-blue to-blue-700 text-white shadow-md' 
                          : 'text-gray-700 hover:text-government-dark-blue hover:bg-blue-50 hover:shadow-sm'
                      }`}
                    >
                      <div className={`mr-3 p-2 rounded-lg ${current ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'} transition-colors`}>
                        <item.icon className={`h-4 w-4 ${
                          current ? 'text-white' : 'text-blue-600 group-hover:text-government-dark-blue'
                        }`} />
                      </div>
                      {item.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Desktop Sign Out */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-4 py-3 text-sm font-semibold text-red-700 rounded-xl hover:text-red-800 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
            >
              <div className="mr-3 p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                <LogOut className="h-4 w-4 text-red-600" />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Professional Top Header */}
        <div className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <button
            className="border-r border-blue-200 px-6 text-government-dark-blue hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-government-dark-blue focus:ring-inset lg:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-7 w-7" />
          </button>
          
          <div className="flex flex-1 items-center justify-between px-8">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-black text-government-dark-blue">
                  {user?.profile?.role === 'admin' ? 'Administrative Portal' :
                   user?.profile?.role === 'officer' ? 'Officer Management Portal' :
                   'Citizen Services Portal'}
                </h1>
                <div className="hidden lg:block h-6 w-px bg-blue-200"></div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-blue-600">Government of Sri Lanka</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Date Display */}
              <div className="hidden md:flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                <div className="text-sm font-bold text-blue-800">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Notifications */}
              <button className="relative rounded-2xl p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 shadow-md"></span>
              </button>

              {/* Settings */}
              <button className="rounded-2xl p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <Settings className="h-6 w-6" />
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200">
                <div className="relative">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-government-dark-blue to-blue-700 flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {user?.profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-bold text-gray-900">
                    {user?.profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-blue-600 capitalize font-medium">
                    {user?.profile?.role || 'citizen'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Page content */}
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}