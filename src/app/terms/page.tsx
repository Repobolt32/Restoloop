'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function Terms() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">Terms of Service</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-4" />
        <p className="text-white/30 text-sm mb-12">Bluetideapp · Last updated: March 2026</p>

        <div className="space-y-8 text-white/70 text-base leading-relaxed">
          <p>
            By using Resto Loop, you agree to the following terms:
          </p>

          <ul className="space-y-6">
            {[
              {
                title: "Service Overview",
                content: "Resto Loop provides tools for customer communication, engagement, and retention for restaurant businesses."
              },
              {
                title: "User Responsibility",
                content: "Users are responsible for obtaining proper consent from their customers before sending messages."
              },
              {
                title: "Usage Policy",
                content: "The platform must not be used for spam, unsolicited messaging, or violation of messaging platform policies."
              },
              {
                title: "Liability",
                content: "Bluetideapp is not responsible for misuse of the platform by users."
              },
              {
                title: "Termination",
                content: "We reserve the right to suspend or terminate access in case of misuse or policy violations."
              }
            ].map((item, i) => (
              <li key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-2">{item.title}</h2>
                <p>{item.content}</p>
              </li>
            ))}
          </ul>

          <p className="pt-4 italic text-white/50">
            Use of the service constitutes acceptance of these terms.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
