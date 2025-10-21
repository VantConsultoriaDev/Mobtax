import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  DollarSign, 
  Truck, 
  Users, 
  UserCog, 
  Menu, 
  X, 
  Sun, 
  Moon,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Inicia colapsado
  const [isHovering, setIsHovering] = useState(false)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  // Auto-collapse quando não está em hover
  useEffect(() => {
    if (!isHovering) {
      const timer = setTimeout(() => {
        setSidebarCollapsed(true)
      }, 300) // Delay para evitar flickering
      return () => clearTimeout(timer)
    }
  }, [isHovering])

  const navigation = [
    { name: 'Início', href: '/inicio', icon: Home, permission: 'inicio' },
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign, permission: 'financeiro' },
    { name: 'Cargas', href: '/cargas', icon: Truck, permission: 'cargas' },
    { name: 'Parceiros', href: '/parceiros', icon: Users, permission: 'parceiros' },
    { name: 'Usuários', href: '/usuarios', icon: UserCog, permission: 'usuarios' },
  ]

  const hasPermission = (permission: string) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.[permission as keyof typeof user.permissions] !== 'none'
  }

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission))

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 dark:from-slate-900 dark:via-purple-900 dark:to-violet-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col bg-gradient-to-b from-white/95 via-purple-50/95 to-violet-100/95 dark:from-slate-900/95 dark:via-purple-900/95 dark:to-violet-900/95 backdrop-blur-2xl shadow-2xl border-r border-purple-200/50 dark:border-purple-700/50">
          <div className="flex h-20 items-center justify-between px-6 border-b border-purple-200/50 dark:border-purple-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                MOBTAX
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl text-purple-400 hover:text-purple-600 hover:bg-purple-100/50 dark:hover:text-purple-300 dark:hover:bg-purple-800/50 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-3 px-4 py-6">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center justify-between px-5 py-4 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-500/30 border border-purple-400/20'
                      : 'text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-900 hover:shadow-lg dark:text-purple-300 dark:hover:bg-gradient-to-r dark:hover:from-purple-900/50 dark:hover:to-violet-900/50 dark:hover:text-white border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-4 h-5 w-5" />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed && !isHovering ? 'lg:w-20' : 'lg:w-80'} z-30`}
        onMouseEnter={() => {
          setIsHovering(true)
          setSidebarCollapsed(false)
        }}
        onMouseLeave={() => {
          setIsHovering(false)
        }}
      >
        <div className="flex flex-col flex-grow bg-gradient-to-b from-white/95 via-purple-50/95 to-violet-100/95 dark:from-slate-900/95 dark:via-purple-900/95 dark:to-violet-900/95 backdrop-blur-2xl border-r border-purple-200/50 dark:border-purple-700/50 shadow-2xl">
          <div className="flex h-20 items-center px-6 border-b border-purple-200/50 dark:border-purple-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div className={`text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent transition-all duration-300 ${sidebarCollapsed && !isHovering ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                MOBTAX
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-3 px-4 py-6">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              const isCollapsed = sidebarCollapsed && !isHovering
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'} py-4 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-500/30 border border-purple-400/20'
                      : 'text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-900 hover:shadow-lg dark:text-purple-300 dark:hover:bg-gradient-to-r dark:hover:from-purple-900/50 dark:hover:to-violet-900/50 dark:hover:text-white border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-4'}`} />
                    <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                      {item.name}
                    </span>
                  </div>
                  {!isCollapsed && isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed && !isHovering ? 'lg:pl-20' : 'lg:pl-80'}`}>
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-r from-white/90 via-purple-50/90 to-violet-100/90 dark:from-slate-900/90 dark:via-purple-900/90 dark:to-violet-900/90 backdrop-blur-2xl px-4 shadow-xl sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button - only visible on mobile */}
          <button
            type="button"
            className="p-2.5 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-800/50 transition-all duration-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-3 lg:gap-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-purple-500 hover:text-purple-700 hover:bg-purple-100/50 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-800/50 transition-all duration-200 shadow-md hover:shadow-lg"
                title={isDark ? 'Modo claro' : 'Modo escuro'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* User info */}
              <div className="flex items-center gap-x-3 pl-3 border-l border-purple-200 dark:border-purple-700">
                <div className="flex flex-col items-end">
                  <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    {user?.username}
                  </div>
                  <div className="text-xs text-purple-500 dark:text-purple-400 capitalize">
                    {user?.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-purple-500 hover:text-red-600 hover:bg-red-50 dark:text-purple-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
