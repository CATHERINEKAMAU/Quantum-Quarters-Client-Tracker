'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut,
  Upload,
  Printer,
  Menu,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/report', label: 'Print Report', icon: Printer },
  { href: '/import', label: 'Import Excel', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-display font-bold text-lg">QQ</span>
          </div>
          <div>
            <p className="font-display font-bold text-slate-900 text-sm leading-tight">Quantum Quarters</p>
            <p className="text-xs text-slate-500">Payment Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">QQ</span>
          </div>
          <span className="font-display font-bold text-slate-900 text-sm">Quantum Quarters</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  )
}
