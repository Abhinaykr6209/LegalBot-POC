import { useAuth } from './AuthContext'
import { Shield, Bell, ChevronDown, LogOut, Settings } from 'lucide-react'

export function NavBar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        
        {/* Enterprise Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 leading-tight">
              AI Audit Trail
            </h1>
            <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              Enterprise Governance
            </span>
          </div>
        </div>

        {/* Action Center & Profile */}
        <div className="flex items-center gap-4">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-primary">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger border border-white"></span>
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-primary">
            <Settings className="h-4 w-4" />
          </button>
          
          <div className="mx-2 h-6 w-px bg-slate-200"></div>

          {/* User Profile Dropdown Simulator */}
          <div className="group relative flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-inner">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-semibold text-slate-700 leading-none">
                {user.display_name}
              </span>
              <span className="mt-1 text-[11px] font-medium text-blue-600 capitalize leading-none">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-hover:text-slate-600" />
            
            {/* Hover Dropdown */}
            <div className="absolute right-0 top-full mt-2 hidden w-48 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl group-hover:flex animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{user.username || user.display_name}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}