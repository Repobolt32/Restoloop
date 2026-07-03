'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  motion, useScroll, useTransform, AnimatePresence, useInView,
} from 'framer-motion'
import {
  Menu, X, ArrowRight, Smartphone, QrCode, Repeat,
  Star, TrendingUp, Users, Check, ChevronDown,
  MessageCircle, Clock, Zap, Shield, Gift,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { NebulaCanvas } from '@/components/landing/NebulaCanvas'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

const faqData = [
  {
    q: 'How does the WhatsApp integration work?',
    a: 'Restoloop connects via the WhatsApp Business API or a third-party gateway. Customers opt in by scanning your QR code, and all campaigns are delivered automatically through WhatsApp.',
  },
  {
    q: 'Is there a minimum commitment?',
    a: 'No. Start free with 1,000 credits. Upgrade anytime as your restaurant grows. No long-term contracts.',
  },
  {
    q: 'Do I need a POS system?',
    a: 'Nope. Restoloop works standalone. Customers join via QR code — no POS integration needed.',
  },
  {
    q: 'How do customers opt in?',
    a: 'They scan your QR code, fill a 30-second form (name + phone), and receive a welcome coupon on WhatsApp. It\'s fully compliant with WhatsApp\'s opt-in policies.',
  },
  {
    q: 'Can I customize the campaigns?',
    a: 'Yes. You control timing, message content, and coupon values from your dashboard. Set it once and it runs on autopilot.',
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Owner, Tandoori Nights',
    text: 'Our repeat customers went up 40% in two months. The birthday campaign alone fills our slow Tuesday nights.',
    rating: 5,
  },
  {
    name: 'Rajesh Mehta',
    role: 'Owner, Spice Route Cafe',
    text: 'Setup took 5 minutes. Now we send winback offers automatically — no more manual texting.',
    rating: 5,
  },
  {
    name: 'Anita Desai',
    role: 'Manager, Curry House',
    text: 'The QR code enrollment is genius. We got 200 signups in the first week just from table tents.',
    rating: 5,
  },
  {
    name: 'Vikram Patel',
    role: 'Owner, Dosa Express',
    text: '₹1.2L in additional revenue from winback campaigns in the first quarter alone.',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'Owner, Mint Leaf Bistro',
    text: 'I was skeptical about WhatsApp marketing, but the automated campaigns are incredibly effective.',
    rating: 5,
  },
  {
    name: 'Arun Kumar',
    role: 'Owner, Biryani House',
    text: 'Best investment for our restaurant. Customers love the birthday treats and keep coming back.',
    rating: 5,
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    credits: '1,000 / month',
    features: ['1 restaurant', '3 auto-campaigns', 'QR code enrollment', 'Dashboard access', 'Email support'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '₹999',
    period: '/month',
    credits: '10,000 / month',
    features: ['Everything in Starter', '5 restaurants', 'Custom campaign timing', 'Analytics & reports', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₹2,499',
    period: '/month',
    credits: '50,000 / month',
    features: ['Everything in Pro', 'Unlimited restaurants', 'Custom API access', 'Dedicated account manager', 'SLA guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
]

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

function AnimatedCounter({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, target, decimals])

  return <span ref={ref} suppressHydrationWarning>{count}{suffix}</span>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }, (_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-lp-accent text-lp-accent" />
      ))}
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-base font-lp-serif text-white/90 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-lp-accent shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-white/60 pb-5 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const mockupY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="landing-theme">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-lp-accent to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-lp-accent/20">
              <span className="text-white text-xs font-black">R</span>
            </div>
            <span className="text-lg font-lp-serif text-white tracking-tight">Restoloop</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href.slice(1))}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/signup"
              className="btn-accent px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Start Free
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="px-6 py-4 space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href.slice(1))}
                    className="block w-full text-left text-sm text-white/50 hover:text-white py-2 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Link
                  href="/signup"
                  className="btn-accent block text-center px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Start Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <NebulaCanvas />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(223,118,86,0.15) 0%, transparent 60%)',
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative z-10"
            >
              <motion.div variants={fadeInUp} className="mb-4">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-lp-accent bg-lp-accent/10 px-4 py-1.5 rounded-full border border-lp-accent/20">
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp-First Loyalty for Restaurants
                </span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-lp-serif leading-tight mb-6">
                Bring Every <span className="shimmer">Customer</span> Back
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-white/60 max-w-lg leading-relaxed mb-8">
                Automated WhatsApp campaigns that win back lapsed guests, celebrate birthdays, and keep your tables full — without lifting a finger.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="btn-accent px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
                >
                  Start Free — 1,000 Credits
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="glass px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ y: mockupY }}
              className="relative hidden lg:block"
            >
              <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-lp-accent/5">
                <img
                  src="/landing/step2.jpg"
                  alt="Restaurant table with QR code"
                  className="w-full h-[420px] object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -left-6 glass-card rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/90">Coupon Sent</p>
                    <p className="text-[10px] text-white/40">W50-ABC123 → +91****4321</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 glass-card rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lp-accent/20 rounded-full flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-lp-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/90">Winback Sent</p>
                    <p className="text-[10px] text-white/40">3 customers today</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── StatBar ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
        className="relative py-16 border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Restaurants Onboarded' },
              { value: 250000, suffix: '+', label: 'Messages Sent' },
              { value: 87, suffix: '%', label: 'Retention Rate' },
              { value: 40, suffix: '%', label: 'Avg Revenue Lift' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-lp-serif text-lp-accent mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-white/40 uppercase tracking-wider font-bold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features / HowItWorks ── */}
      <section id="features" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              Everything You Need
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-lp-serif mb-4">
              Three Campaigns. Zero Effort.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              Automated workflows that run while you focus on what matters — your food and your guests.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Gift className="w-6 h-6" />,
                title: 'Welcome Offers',
                desc: 'New customers get a coupon on WhatsApp instantly after scanning your QR. Sets the hook on day one.',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Winback Campaigns',
                desc: 'Auto-send a special offer when a customer hasn\'t visited in 40 days. Bring them back before they forget you.',
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: 'Birthday Rewards',
                desc: 'Celebrate their day with a personalized WhatsApp message and a coupon. Creates loyal regulars.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="glass-card rounded-2xl p-8 hover:border-lp-accent/20 transition-colors"
              >
                <div className="w-12 h-12 bg-lp-accent/10 rounded-xl flex items-center justify-center text-lp-accent mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-lp-serif mb-3">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              How It Works
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-lp-serif mb-4">
              3 Steps. Zero Hassle.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              Set it up once. It runs while you cook.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                number: '01',
                icon: <QrCode className="w-6 h-6" />,
                title: 'Print Your QR',
                desc: 'Generate a QR code from your dashboard. Print it on tables, receipts, or the entrance wall.',
                img: '/landing/qr-code.png',
              },
              {
                number: '02',
                icon: <Smartphone className="w-6 h-6" />,
                title: 'Customers Join',
                desc: 'They scan, enter their name and phone, and get a welcome coupon on WhatsApp instantly.',
                img: '/landing/whatsapp-icon.png',
              },
              {
                number: '03',
                icon: <Repeat className="w-6 h-6" />,
                title: 'They Come Back',
                desc: 'Automated reminders, birthday rewards, and winback offers bring them back month after month.',
                img: '/landing/step2.jpg',
              },
            ].map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center text-lp-accent">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-lp-accent text-white rounded-full flex items-center justify-center text-[11px] font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-lp-serif mb-3">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative py-24"
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              Old vs New
            </span>
            <h2 className="text-3xl md:text-4xl font-lp-serif mb-4">
              Loyalty Without the Headaches
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              Stop chasing customers with spreadsheets and manual texts. Restoloop does it all on autopilot.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-0 md:gap-8">
            <div className="glass-card rounded-2xl p-8 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 mb-4">
                <X className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white/40 mb-4">Old Way</h3>
              <ul className="space-y-3">
                {[
                  'Manual SMS to every customer',
                  'Spreadsheet tracking',
                  'No automated follow-ups',
                  'Customers forget you exist',
                  'Hours wasted on outreach',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/40">
                    <X className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-8 border-lp-accent/10 relative">
              <div className="absolute top-0 right-0 bg-lp-accent text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-xl">
                Recommended
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Restoloop Way</h3>
              <ul className="space-y-3">
                {[
                  'Auto WhatsApp campaigns',
                  'Live dashboard analytics',
                  'Birthday + winback automations',
                  'Customers return on autopilot',
                  'Zero daily effort',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── ROI Block ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative py-24 border-y border-white/5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lp-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              Real Results
            </span>
            <h2 className="text-3xl md:text-4xl font-lp-serif mb-4">
              The ROI Speaks for Itself
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              Restaurants using Restoloop see measurable returns within the first month.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingUp className="w-6 h-6" />,
                value: '₹1.2L+',
                label: 'Additional Revenue',
                desc: 'Average incremental revenue from winback campaigns in the first quarter.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                value: '87%',
                label: 'Customer Retention',
                desc: 'Of customers who receive a birthday reward visit again within 30 days.',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                value: '5 min',
                label: 'Setup Time',
                desc: 'From signup to your first QR code printed and ready for scanning.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                className="glass-card rounded-2xl p-8 text-center"
              >
                <div className="w-12 h-12 bg-lp-accent/10 rounded-xl flex items-center justify-center text-lp-accent mx-auto mb-5">
                  {item.icon}
                </div>
                <p className="text-3xl font-lp-serif text-lp-accent mb-2">{item.value}</p>
                <p className="text-sm font-bold text-white/80 mb-2">{item.label}</p>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Testimonial Marquee ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center"
          >
            <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              Trusted by Restaurant Owners
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-lp-serif mb-4">
              What Our Users Say
            </motion.h2>
          </motion.div>
        </div>

        <div className="marquee-container">
          <div className="marquee-content">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 min-w-[320px] max-w-[360px] shrink-0"
              >
                <StarRating rating={t.rating} />
                <p className="text-sm text-white/70 leading-relaxed mt-4 mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-lp-accent/20 flex items-center justify-center text-lp-accent text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{t.name}</p>
                    <p className="text-[11px] text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              Pricing
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-lp-serif mb-4">
              Start Free. Scale When You Grow.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              No hidden fees. No long-term contracts. Cancel anytime.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                className={`glass-card rounded-2xl p-8 relative ${plan.popular ? 'border-lp-accent/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lp-accent text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-lp-serif text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-white/40">{plan.period}</span>}
                </div>
                <p className="text-xs text-white/40 mb-6">{plan.credits}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check className="w-4 h-4 text-lp-accent mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    plan.popular
                      ? 'btn-accent'
                      : 'glass hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-[0.2em] text-lp-accent mb-4 block">
              FAQ
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-lp-serif mb-4">
              Got Questions?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
              Everything you need to know about Restoloop.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="glass-card rounded-2xl px-6"
          >
            {faqData.map((item, i) => (
              <motion.div key={item.q} variants={fadeInUp}>
                <FaqItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-lp-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-lp-serif mb-4">
            Ready to Bring Them Back?
          </h2>
          <p className="text-white/50 mb-8 text-sm max-w-md mx-auto">
            Join restaurants using Restoloop to keep their tables full. Start free — no credit card needed.
          </p>
          <Link
            href="/signup"
            className="btn-accent inline-flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-lp-accent to-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-black">R</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Restoloop — Customer Retention for Restaurants
            </p>
          </div>
          <div className="flex gap-6">
            {[
              { href: '/about', label: 'About' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/contact', label: 'Contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] font-bold text-white/30 hover:text-lp-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
