'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface NavbarProps {
  user?: Profile | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const dashboardLink =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'vendor' ? '/vendor' : '/user'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🔨</span>
          <div>
            <span className="font-black text-xl text-[#1A1A2E]">Lok Lagbe</span>
            <span className="text-[#E8441A] font-black text-xl">?</span>
            <div className="text-xs text-gray-400 -mt-1">লোক লাগবে?</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/services" className="text-gray-600 hover:text-[#E8441A] font-medium transition-colors">
            Browse Services
          </Link>
          {user ? (
            <>
              <Link href={dashboardLink} className="text-gray-600 hover:text-[#E8441A] font-medium transition-colors">
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Hi, {user.full_name.split(' ')[0]}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'vendor' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.role}
                </span>
                <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-[#E8441A] font-medium transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-[#E8441A] hover:bg-[#C73610] text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          <Link href="/services" className="text-gray-700 font-medium">Browse Services</Link>
          {user ? (
            <>
              <Link href={dashboardLink} className="text-gray-700 font-medium">Dashboard</Link>
              <button onClick={handleSignOut} className="text-left text-red-500 font-medium">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 font-medium">Login</Link>
              <Link href="/signup" className="bg-[#E8441A] text-white font-semibold px-5 py-2.5 rounded-xl text-center">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
