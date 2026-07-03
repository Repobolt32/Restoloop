'use client'

import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import SubpageNav from '@/components/landing/SubpageNav'

export default function ContactPage() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Contact</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-12 mx-auto" />

        <p className="text-white/60 text-lg mb-16 max-w-xl mx-auto">
          For inquiries, support, or business-related communication, please reach out to us:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="glass-card p-10 rounded-3xl border border-white/5 hover:border-lp-accent/30 transition-all">
            <div className="w-14 h-14 bg-lp-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="text-lp-accent w-7 h-7" />
            </div>
            <h2 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Email</h2>
            <a href="mailto:ankit@bluetideapp.com" className="text-xl md:text-2xl font-semibold hover:text-lp-accent transition-colors">
              ankit@bluetideapp.com
            </a>
          </div>

          <div className="glass-card p-10 rounded-3xl border border-white/5 hover:border-lp-accent/30 transition-all">
            <div className="w-14 h-14 bg-lp-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="text-lp-accent w-7 h-7" />
            </div>
            <h2 className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Phone</h2>
            <a href="tel:+917542011085" className="text-xl md:text-2xl font-semibold hover:text-lp-accent transition-colors">
              +91 7542011085
            </a>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-white/30">
          <p>Based in Bihar, India</p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
