'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'

export default function SubpageNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md py-4 shadow-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Receipt className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Restoloop</span>
        </Link>
        <Link href="/" className="text-sm text-white/50 hover:text-lp-accent transition-colors">← Back to Home</Link>
      </div>
    </nav>
  )
}
