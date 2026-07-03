'use client'

import Link from 'next/link'
import SubpageNav from '@/components/landing/SubpageNav'

export default function About() {
  return (
    <div className="landing-theme min-h-screen bg-lp-bg text-white">
      <SubpageNav />

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl md:text-6xl font-lp-serif mb-6">About Resto Loop</h1>
        <div className="h-1 w-16 bg-lp-accent rounded-full mb-12" />

        <div className="space-y-6 text-white/70 text-lg leading-relaxed">
          <p>
            Resto Loop is a customer retention and engagement platform built for restaurant businesses to increase repeat customers and maximize lifetime value.
          </p>
          <p>
            Our objective is simple: help restaurants turn one-time visitors into loyal, repeat customers using structured communication, automation, and data-driven follow-ups.
          </p>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 my-10">
            <h2 className="text-xl font-semibold text-white mb-5">Resto Loop enables restaurants to:</h2>
            <ul className="space-y-3">
              {[
                'Capture customer data',
                'Re-engage customers through WhatsApp and other channels',
                'Run targeted campaigns and offers',
                'Build long-term customer relationships',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-lp-accent rounded-full mt-2.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            Resto Loop is a product of <strong className="text-white">Bluetideapp</strong>, operated by Ankit as a sole proprietorship based in India.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20 uppercase tracking-widest">
        © 2026 Resto Loop · A product of Bluetideapp
      </footer>
    </div>
  )
}
