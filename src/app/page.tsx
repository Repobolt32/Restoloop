import Link from 'next/link'
import {
  MessageSquare,
  QrCode,
  BarChart3,
  ArrowRight,
  Gift,
  Smartphone,
  Repeat,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[--color-background] text-[--color-foreground]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-amber-500/5" />
        <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[--color-primary]">
            Restoloop
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs font-bold text-[--color-grey-600] hover:text-[--color-grey-800] transition-colors cursor-pointer">
              Log In
            </Link>
            <Link href="/signup" className="bg-[--color-accent] hover:bg-[--color-accent-dark] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer">
              Sign Up Free
            </Link>
          </div>
        </nav>
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-4">
                WhatsApp-First Loyalty for Restaurants
              </p>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[--color-foreground] mb-6 leading-tight uppercase font-display">
                Bring Every Customer Back
              </h1>
              <p className="text-lg text-[--color-grey-800] mb-8 max-w-lg leading-relaxed">
                Automated WhatsApp campaigns that win back lapsed guests, celebrate birthdays, and keep your tables full — without lifting a finger.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  Start Free — 1000 Credits
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="border border-[--color-border] px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[--color-grey-600] hover:bg-[--color-grey-50] transition-colors cursor-pointer"
                >
                  Log In
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop"
                alt="Warm restaurant interior with ambient lighting"
                className="rounded-2xl shadow-xl object-cover w-full h-[400px] border border-[--color-border]"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 border border-[--color-border]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[--color-foreground]">Coupon Sent</p>
                    <p className="text-[10px] text-[--color-grey-500]">W50-ABC123 → +91****4321</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-[--color-border]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-[--color-accent]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[--color-foreground]">Winback Sent</p>
                    <p className="text-[10px] text-[--color-grey-500]">3 customers today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features / Menu Preview ── */}
      <section className="py-20 bg-white border-y border-[--color-border]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-2 text-center">
            What You Get
          </p>
          <h2 className="text-2xl font-black tracking-tight text-center mb-4 uppercase font-display text-[--color-foreground]">
            Everything to Keep Tables Full
          </h2>
          <p className="text-sm text-[--color-grey-600] text-center mb-12 max-w-lg mx-auto">
            Three automated campaigns, a smart dashboard, and WhatsApp delivery — all included free.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Automated Campaigns"
              description="Welcome reminders at 25 days, birthday wishes, and winback messages at 40 days — all on autopilot."
              badge="3 Campaigns"
            />
            <FeatureCard
              icon={<QrCode className="w-5 h-5" />}
              title="QR Enrollment"
              description="Customers scan a QR code, fill a 30-second form, and join your loyalty club via WhatsApp."
              badge="Instant"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Live Dashboard"
              description="See every guest, coupon, and campaign at a glance. Track redemption rates and active customers."
              badge="Real-Time"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works / Reservation Flow ── */}
      <section className="py-20 bg-[--color-grey-50]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-primary] mb-2 text-center">
            How It Works
          </p>
          <h2 className="text-2xl font-black tracking-tight text-center mb-4 uppercase font-display text-[--color-foreground]">
            3 Steps. Zero Hassle.
          </h2>
          <p className="text-sm text-[--color-grey-600] text-center mb-12 max-w-lg mx-auto">
            Set it up once. It runs while you cook.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<QrCode className="w-6 h-6" />}
              title="Print Your QR"
              description="Generate a QR code from your dashboard. Print it on tables, receipts, or the entrance wall."
            />
            <StepCard
              number="2"
              icon={<Smartphone className="w-6 h-6" />}
              title="Customers Join"
              description="They scan, enter their name and phone, and get a welcome coupon on WhatsApp instantly."
            />
            <StepCard
              number="3"
              icon={<Repeat className="w-6 h-6" />}
              title="They Come Back"
              description="Automated reminders, birthday rewards, and winback offers bring them back month after month."
            />
          </div>
        </div>
      </section>

      {/* ── About / Chef Story ── */}
      <section className="py-20 bg-white border-y border-[--color-border]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"
              alt="Beautifully plated food"
              className="rounded-2xl shadow-xl object-cover w-full h-[400px] border border-[--color-border]"
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[--color-accent] mb-4">
                Why Restoloop
              </p>
              <h2 className="text-2xl font-black tracking-tight mb-6 uppercase font-display text-[--color-foreground]">
                Built for the Owner Who Does It All
              </h2>
              <p className="text-[--color-grey-800] mb-4 leading-relaxed">
                You cook, you manage, you serve. You don&apos;t have time to chase customers with spreadsheets and manual texts.
              </p>
              <p className="text-[--color-grey-800] mb-8 leading-relaxed">
                Restoloop runs your loyalty on WhatsApp — the app your customers already use. No app to download, no POS to integrate. Set it up in 5 minutes and it works while you work.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <StatBlock value="1000+" label="Free Credits" />
                <StatBlock value="3" label="Auto Campaigns" />
                <StatBlock value="₹0" label="Setup Fees" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[--color-grey-900]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white mb-4 uppercase font-display">
            Ready to Bring Them Back?
          </h2>
          <p className="text-[--color-grey-200] mb-8 text-sm">
            Join restaurants using Restoloop to keep their tables full. Start free — no credit card needed.
          </p>
          <Link
            href="/signup"
            className="bg-[--color-primary] hover:bg-[--color-primary-dark] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 bg-[--color-grey-900] border-t border-[--color-grey-800]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--color-grey-300]">
            Restoloop — Customer Retention for Restaurants
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-[10px] font-bold text-[--color-grey-300] hover:text-white transition-colors cursor-pointer">
              Log In
            </Link>
            <Link href="/signup" className="text-[10px] font-bold text-[--color-grey-300] hover:text-white transition-colors cursor-pointer">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="bg-[--color-surface] rounded-2xl p-6 border border-[--color-border] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-[--color-primary]/10 text-[--color-primary] rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-[--color-accent] bg-[--color-grey-50] px-2.5 py-1 rounded-full border border-[--color-border]">
          {badge}
        </span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-wider mb-2 font-display text-[--color-foreground]">{title}</h3>
      <p className="text-sm text-[--color-grey-600] leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 bg-[--color-surface] rounded-2xl shadow-md border border-[--color-border] flex items-center justify-center text-[--color-primary]">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-[--color-accent] text-white rounded-full flex items-center justify-center text-[10px] font-black">
          {number}
        </span>
      </div>
      <h3 className="text-sm font-black uppercase tracking-wider mb-2 font-display text-[--color-foreground]">{title}</h3>
      <p className="text-sm text-[--color-grey-600] leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-[--color-primary] font-display">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-[--color-grey-600]">{label}</p>
    </div>
  )
}
