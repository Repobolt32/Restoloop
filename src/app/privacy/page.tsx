'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function Privacy() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Privacy Policy</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-4" />
        <p className="text-white/30 text-sm mb-12">Bluetideapp · Last updated: March 2026</p>

        <div className="space-y-8 text-white/70 text-base leading-relaxed">
          <p>
            At <strong className="text-white">Bluetideapp</strong>, we are committed to protecting user data and maintaining transparency in how information is collected and used.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>
            <p>
              We may collect customer information including names, phone numbers, and interaction data when users engage with our platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">How We Use This Data</h2>
            <p className="mb-4">This data is used to:</p>
            <ul className="space-y-3 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              {[
                'Provide and improve our services',
                'Enable communication via WhatsApp and other messaging platforms',
                'Send service-related updates, notifications, and promotional messages where applicable',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-lp-accent rounded-full mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Our Commitments</h2>
            <ul className="space-y-3 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              {[
                'Users provide consent before receiving communication',
                'Data is not sold or shared with unauthorized third parties',
                'Information is handled securely and used only for intended business purposes',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-lp-accent/30 bg-lp-accent/5 rounded-2xl p-6">
            <p className="text-white font-medium">
              We only communicate with users who have provided consent to receive messages.
            </p>
          </div>

          <p>
            By using our services, users agree to this data usage policy.
          </p>

          <div className="pt-4 border-t border-white/5">
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>For privacy-related inquiries: <a href="mailto:ankit@bluetideapp.com" className="text-lp-accent hover:underline">ankit@bluetideapp.com</a></p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
