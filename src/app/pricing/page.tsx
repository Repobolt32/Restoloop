'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Check, Receipt, Menu, X, ArrowRight, ChevronDown, MessageSquare, TrendingUp, Gift } from 'lucide-react'
import { NebulaCanvas } from '@/components/landing/NebulaCanvas'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 no-underline">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Receipt className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Restoloop</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium no-underline">
            Home
          </Link>
          <Link href="/signup" className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 no-underline">
            Get Started
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
          <Link href="/" className="block text-gray-300 hover:text-white text-lg font-medium no-underline" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link href="/signup" className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 no-underline">
            Get Started Free
          </Link>
        </div>
      )}
    </nav>
  )
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-white/10 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-white hover:text-orange-400 transition-colors py-2 bg-transparent border-0 cursor-pointer"
      >
        <span className="font-bold text-base md:text-lg">{question}</span>
        <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-white/60 text-sm md:text-base leading-relaxed pt-2 pb-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-44 pb-20 overflow-hidden">
        <NebulaCanvas />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] md:w-[1000px] h-[300px] md:h-[800px] bg-lp-accent/5 blur-[80px] md:blur-[150px] rounded-full opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-7xl font-display font-lp-serif leading-tight mb-6">
              Simple, transparent pricing.
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-white/40 mb-16 leading-relaxed">
              No hidden fees, no auto-billing. Pay for what you need to run your campaign automations seamlessly.
            </p>
          </motion.div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20 text-left">
            {[
              {
                id: 'trial',
                name: 'Trial',
                price: '₹599',
                period: '21 days',
                credits: 'Unlimited',
                desc: 'Perfect to test the waters and experience Restoloop loyalty growth.',
                features: ['Unlimited messaging', 'Enrollment table QR code', 'Auto-welcome coupons', 'Opt-out keyword handling'],
                cta: 'Start Trial Now',
                highlight: false,
              },
              {
                id: 'pro',
                name: 'Pro',
                price: '₹999',
                period: 'month',
                credits: '300 base credits',
                desc: 'Perfect for growing outlets with moderate daily visitors.',
                features: ['300 base credits/mo', 'Expiry reminder campaign', 'Opt-out keyword handling', 'Table QR code download', 'Customer analytics dashboard'],
                cta: 'Get Pro Plan',
                highlight: true,
              },
              {
                id: 'max',
                name: 'Max',
                price: '₹1,999',
                period: 'month',
                credits: '700 base credits',
                desc: 'Ideal for busy outlets and established neighborhood eateries.',
                features: ['700 base credits/mo', 'Birthday coupon campaign', 'Expiry reminder campaign', 'Opt-out keyword handling', 'Full customer loyalty portal'],
                cta: 'Get Max Plan',
                highlight: false,
              },
              {
                id: 'ultra',
                name: 'Ultra',
                price: '₹2,999',
                period: 'month',
                credits: '1,500 base credits',
                desc: 'Designed for high-traffic joints with multiple active tables.',
                features: ['1,500 base credits/mo', 'Winback campaign triggers', 'Birthday coupon campaign', 'Expiry reminder campaign', 'Dedicated premium analytics'],
                cta: 'Get Ultra Plan',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.id}
                className={`glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  plan.highlight ? 'border-orange-500 bg-white/[0.05]' : 'border-white/10'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-600 text-white font-bold text-[8px] uppercase tracking-widest py-1.5 px-4 rounded-bl-xl">
                    Popular
                  </div>
                )}
                <div>
                  <span className="text-white/40 text-xs font-black uppercase tracking-wider block mb-2">{plan.name}</span>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl md:text-4xl font-bold font-lp-serif text-white">{plan.price}</span>
                    <span className="text-xs text-white/40">/ {plan.period}</span>
                  </div>
                  <span className="text-xs font-bold text-orange-400 block mb-4">🪙 {plan.credits}</span>
                  <p className="text-xs text-white/50 leading-relaxed mb-6 border-b border-white/10 pb-6">{plan.desc}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-bold text-white/80">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-center no-underline transition-all block ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Recharge Callout Card */}
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-10 border border-white/10 relative overflow-hidden mb-24 text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
              <div>
                <span className="text-orange-400 text-xs font-black uppercase tracking-widest block mb-2">Need More Messages?</span>
                <h3 className="font-display font-lp-serif text-2xl md:text-3xl text-white mb-2">Recharge packs roll over forever.</h3>
                <p className="text-xs md:text-sm text-white/40 leading-relaxed max-w-xl">
                  Running low? Buy recharge packs starting from ₹1,500 for 500 messages (🪙 500). Packs are valid as long as you maintain an active plan subscription.
                </p>
              </div>
              <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 font-bold text-sm w-full md:w-auto">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-2">Available Top-ups</span>
                <ul className="space-y-2">
                  <li className="flex justify-between md:gap-12"><span>Starter (🪙 500)</span> <span className="text-orange-400">₹1,500</span></li>
                  <li className="flex justify-between md:gap-12"><span>Growth (🪙 1,000)</span> <span className="text-orange-400">₹3,000</span></li>
                  <li className="flex justify-between md:gap-12"><span>Power (🪙 2,000)</span> <span className="text-orange-400">₹6,000</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQs Section */}
          <div className="max-w-3xl mx-auto text-left mb-20">
            <h2 className="text-center font-display font-lp-serif text-3xl md:text-5xl mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <FAQItem
                question="How does manual renewal work?"
                answer="Restoloop does not auto-debit your payment method. When your monthly plan ends, you can renew it at any time from your settings page. Campaign triggers will simply pause until you renew."
              />
              <FAQItem
                question="Do unused credits expire?"
                answer="No, credits in your wallet do not expire. When a plan expires, your credits are preserved. Once you renew the plan, you can continue using all your leftover credits plus the new plan's credits."
              />
              <FAQItem
                question="Who is eligible to purchase recharge packs?"
                answer="Recharge packs are available only to customers with an active plan (Trial, Pro, Max, or Ultra). If your plan is expired or you are on the Free plan, you must renew or subscribe before buying a top-up pack."
              />
              <FAQItem
                question="What happens when credits hit zero?"
                answer="When credits hit zero, our campaigns hit a hard stop to prevent unexpected charges. Messages will log as 'blocked_no_credits'. If you are on the Trial plan, messaging remains unlimited until the 21 days expire."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-white/30 font-bold">&copy; {new Date().getFullYear()} Restoloop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
