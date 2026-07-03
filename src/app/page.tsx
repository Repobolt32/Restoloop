'use client'

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    MessageSquare,
    TrendingUp,
    Receipt,
    Check,
    X,
    ChevronDown,
    ArrowRight,
    Menu,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';

import { NebulaCanvas } from '@/components/landing/NebulaCanvas';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'FAQ', href: '#faq' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Receipt className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Restoloop</span>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        href="/signup"
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        Get Started
                    </Link>
                </div>

                <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 space-y-4">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="block text-gray-300 hover:text-white text-lg font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        href="/signup"
                        className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20"
                    >
                        Get Started Free
                    </Link>
                </div>
            )}
        </nav>
    );
};

const Hero = () => {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.9, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <section className="relative pt-24 md:pt-40 pb-12 md:pb-24 overflow-hidden">
            <NebulaCanvas />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[300px] md:w-[1000px] h-[300px] md:h-[800px] bg-lp-accent/5 blur-[80px] md:blur-[150px] rounded-full opacity-50" />
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[200px] md:w-[600px] h-[200px] md:h-[400px] bg-lp-accent/10 blur-[60px] md:blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full text-[10px] md:text-xs font-bold tracking-widest text-white/50 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-lp-accent rounded-full shadow-[0_0_8px_rgba(223,118,86,0.8)]" />
                            AUTOMATED LOYALTY LOOP
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[104px] leading-[1.05] md:leading-[1.05] mb-6 md:mb-10 tracking-tight font-lp-serif max-w-5xl mx-auto">
                        Turn tonight&apos;s guests <br />
                        <span className="text-white">into </span>
                        <span className="shimmer">repeated customers.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base md:text-lg text-white/40 mb-10 md:mb-12 leading-relaxed">
                        Most visitors never return. Restoloop automatically brings them back to your tables.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-24">
                        <Link href="/signup" className="bg-lp-accent hover:bg-lp-accent/90 text-white px-10 py-4.5 rounded-full text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lp-accent/20 hover:shadow-lp-accent/40 hover:scale-[1.02]">
                            Start Trial <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#how-it-works" className="bg-white/[0.03] border border-white/10 text-white px-10 py-4.5 rounded-full text-lg font-bold hover:bg-white/[0.08] transition-all hover:scale-[1.02] backdrop-blur-sm">
                            See how it works
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    style={{ y, scale, opacity }}
                    className="relative max-w-5xl mx-auto"
                >
                    <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                            {[
                                { label: 'Total Customers', value: '247', icon: MessageSquare },
                                { label: 'Coupons Sent', value: '189', icon: TrendingUp },
                                { label: 'Coupons Redeemed', value: '63', icon: Check },
                                { label: 'Revenue Attributed', value: '₹42,800', icon: Receipt },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl text-left border border-white/5">
                                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-lp-accent mb-1 md:mb-2" />
                                    <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                                    <div className="text-[8px] md:text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="h-48 md:h-64 bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col justify-end">
                            <div className="text-left mb-2 md:mb-4">
                                <div className="text-[10px] md:text-sm font-medium text-white/60">Revenue from returning customers ₹</div>
                            </div>
                            <div className="flex items-end justify-between gap-1 md:gap-2 h-full">
                                {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="flex-1 bg-lp-accent/40 rounded-t-sm md:rounded-t-lg relative group"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-lp-accent text-white text-[8px] md:text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            ₹{(h * 500).toLocaleString()}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 md:mt-4 text-[8px] md:text-[10px] text-white/30 uppercase tracking-widest">
                                <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const StatBar = () => {
    const stats = [
        { label: 'Setup cost', value: '₹0' },
        { label: 'To go live', value: '7 mins' },
        { label: 'Auto messages', value: '50/day' },
        { label: 'Avg ROI', value: '3x' },
    ];

    return (
        <div className="py-12 md:py-20 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-5xl font-lp-serif mb-1 md:mb-2">{stat.value}</div>
                            <div className="text-[10px] md:text-sm text-white/40 uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HowItWorks = () => {
    const steps = [
        {
            icon: '/landing/qr-code.png',
            title: "Capture data",
            description: "Capture customer data from your restaurant instantly via QR.",
            step: "STEP 1",
        },
        {
            icon: '/landing/step2.jpg',
            title: "Automate follow-ups",
            description: "Automate follow-ups and offers based on customer behavior.",
            step: "STEP 2",
        },
        {
            icon: '/landing/whatsapp-icon.png',
            title: "Re-engage via WhatsApp",
            description: "Re-engage customers via WhatsApp to increase repeat visits and revenue.",
            step: "STEP 3",
        }
    ];

    return (
        <section id="how-it-works" className="py-20 md:py-32 bg-black">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-4xl md:text-7xl mb-4 md:mb-6">How It Works</h2>
                    <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                        Turn one-time visitors into loyal, repeat customers with our automated engagement loop.
                    </p>
                </div>

                <div className="glass-card rounded-[32px] md:rounded-[48px] p-8 md:p-16 border border-white/5 bg-white/[0.01]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                        {steps.map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center relative group">
                                <div className="w-full h-full glass-card rounded-3xl p-8 md:p-10 border border-white/5 hover:border-lp-accent/30 transition-all duration-500 hover:bg-white/[0.03]">
                                    <div className="text-lp-accent font-bold text-[10px] md:text-xs tracking-widest mb-8 opacity-60">
                                        {step.step}
                                    </div>

                                    <div className="mb-8 flex items-center justify-center">
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center p-4 shadow-xl">
                                            <img src={step.icon} alt={step.title} className="w-full h-full object-contain rounded-2xl" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <h3 className="text-xl md:text-2xl font-lp-serif mb-4 flex items-center">{step.title}</h3>
                                        <p className="text-white/40 text-sm md:text-base leading-relaxed">{step.description}</p>
                                    </div>
                                </div>

                                {i < steps.length - 1 && (
                                    <div className="hidden md:flex absolute top-1/2 -right-6 translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/10 text-3xl font-light">
                                        <ArrowRight className="w-6 h-6 opacity-20" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Comparison = () => {
    return (
        <section className="py-20 md:py-32 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="p-6 md:p-8 rounded-[20px] border border-white/5 bg-white/[0.04] backdrop-blur-md">
                        <h3 className="text-2xl md:text-3xl font-lp-serif mb-6 md:mb-8 text-red-500/80 italic">Without Restoloop</h3>
                        <ul className="space-y-4 md:space-y-6">
                            {[
                                "Customers visit once, disappear forever",
                                "No way to reach them on WhatsApp after",
                                "Spend on Instagram ads with zero tracking",
                                "No idea which offer actually worked",
                                "Birthday moments missed every single day"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-white/40">
                                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-6 md:p-8 rounded-[20px] border border-white/5 bg-white/[0.04] backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full" />
                        <h3 className="text-2xl md:text-3xl font-lp-serif mb-6 md:mb-8 text-green-500 italic">With Restoloop</h3>
                        <ul className="space-y-4 md:space-y-6">
                            {[
                                "Own your customer WhatsApp database",
                                "Automated outreach — zero manual effort",
                                "Pay only per message, no wasted spend",
                                "Dashboard shows exact ₹ attributed to us",
                                "Birthday + win-back sent automatically"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-white/90">
                                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ROIBlock = () => {
    return (
        <section className="py-20 md:py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="glass-card rounded-[32px] md:rounded-[40px] p-8 md:p-24 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-lp-accent/5 blur-3xl -z-10" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-6xl md:text-9xl font-lp-serif mb-4 text-lp-accent">₹42,800</div>
                        <p className="text-lg md:text-2xl text-white/60 mb-12 md:mb-16 max-w-2xl mx-auto">
                            Average monthly revenue attributed by Restoloop for an active restaurant
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 md:pt-12 border-t border-white/5">
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">63</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">coupons redeemed</div>
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">247</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">customers captured</div>
                            </div>
                            <div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">₹0</div>
                                <div className="text-xs md:text-sm text-white/40 uppercase tracking-widest">ad spend</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const TestimonialMarquee = () => {
    const testimonials = [
        {
            stars: "★★★★★",
            quote: "System lagane ke baad daily 2–3 repeat customers consistently aane lage. Isse approx ₹400–₹600 extra per day add ho raha hai — month me ₹12,000+ ka clear increase dikha.",
            author: "Ravi Kumar, Owner — Shree Rama Resturant"
        },
        {
            stars: "★★★★★",
            quote: "WhatsApp follow-ups ke baad repeat rate improve hua aur overall sales me 15–20% tak jump mila within few weeks. Pehle jo customers wapas nahi aate the, ab regularly dikhne lage hain.",
            author: "Jaspal Singh, Owner — Biryani Junction"
        },
        {
            stars: "★★★★★",
            quote: "Opening ke saath hi system use kiya, toh jo customers aaye unme se kaafi log dobara visit karne lage. 20–25 din me ₹10k–₹15k ka additional revenue repeat visits se generate hua.",
            author: "Saurabh Singh, Owner — Urban Tandoor"
        }
    ];

    return (
        <section className="py-20 overflow-hidden">
            <div className="marquee-container">
                <div className="marquee-content">
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <div key={i} className="glass-card p-8 rounded-[20px] min-w-[350px] max-w-[350px]">
                            <div className="text-lp-accent mb-4">{t.stars}</div>
                            <p className="text-white/80 mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                            <div className="text-sm font-bold text-white/40">— {t.author}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    const tiers = [
        {
            name: '🟢 PLAN 1 — Starter / Trial',
            price: '₹999',
            note: 'Bring back your past customers (basic setup)',
            features: [
                '300 WhatsApp messages',
                'QR code + customer data capture',
                'Simple follow-up messages (manual + assisted)',
                'Basic coupon / offer sending',
                'Setup + support included'
            ],
            badge: '👉 Best for testing if this works for your restaurant',
            cta: 'Get started',
            popular: false
        },
        {
            name: '🔴 PLAN 2 — Growth',
            price: '₹2,499',
            note: 'Turn more first-time customers into repeat customers',
            features: [
                '800 WhatsApp messages',
                'Everything in Starter',
                'Automated follow-ups (no manual work)',
                'Birthday / offer campaigns',
                'Better tracking of returning customers',
                'Priority support + faster setup'
            ],
            badge: '👉 Best for restaurants serious about growth',
            cta: 'Get started',
            popular: true
        }
    ];

    return (
        <section id="pricing" className="py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-4xl md:text-7xl mb-4 md:mb-6">Choose the Right Plan</h2>
                    <p className="text-white/60">Expand your schema as per your requirements</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
                    {tiers.map((tier, i) => (
                        <div
                            key={i}
                            className={`relative p-6 md:p-8 rounded-[24px] md:rounded-[32px] flex flex-col ${tier.popular
                                ? 'bg-lp-accent/10 border-2 border-lp-accent shadow-[0_0_40px_rgba(223,118,86,0.2)]'
                                : 'glass-card'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lp-accent text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6 md:mb-8">
                                <div className="text-sm font-bold mb-3 text-white/80">{tier.name}</div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl md:text-5xl font-bold">{tier.price}</span>
                                </div>
                                <div className="text-white/40 text-xs md:text-sm italic mt-1">{tier.note}</div>
                            </div>

                            <div className="space-y-3 md:space-y-4 mb-6 flex-grow">
                                {tier.features.map((f, j) => (
                                    <div key={j} className="flex items-center gap-3 text-xs md:text-sm text-white/70">
                                        <Check className="w-3 h-3 md:w-4 md:h-4 text-lp-accent shrink-0" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-xs text-white/40 italic mb-6">{tier.badge}</div>

                            <Link
                                href="/signup"
                                className={`w-full py-3 md:py-4 rounded-full font-bold text-center transition-all ${tier.popular
                                    ? 'bg-lp-accent text-white hover:scale-[1.02]'
                                    : 'glass hover:bg-white/10'
                                    }`}
                            >
                                {tier.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const faqs = [
        {
            q: "Do I need technical knowledge to set this up?",
            a: "Not at all. Create an account, enter your restaurant name, print the QR code, and place it on your tables. Ready in 7 minutes. The system handles everything after that."
        },
        {
            q: "Will my existing WhatsApp number be used?",
            a: "No. We use the official Meta WhatsApp Business API — messages are sent from a dedicated verified number. Your personal number stays safe, and delivery rates are much better."
        },
        {
            q: "What if the customer doesn't use the coupon?",
            a: "No problem. The coupon expires automatically. Your credits are only deducted when a message is successfully delivered — not on redemption. You lose nothing."
        },
        {
            q: "When do credits expire?",
            a: "Never. Buy 1000 credits and use them over 2 years — they stay as they are. No monthly subscription, no expiry. Your money won't be wasted."
        },
        {
            q: "What if there's a problem with the system?",
            a: "We are available on WhatsApp. There's a button on the dashboard — it sends a message directly to our WhatsApp. A real human responds, not a bot."
        },
        {
            q: "Is this only for large restaurants?",
            a: "No. Whether it's a small dhaba or a large restaurant — as long as you have customers and want to bring them back, Restoloop works. You can start with even 50 customers."
        }
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-32">
            <div className="max-w-3xl mx-auto px-6">
                <h2 className="text-5xl md:text-7xl text-center mb-16 italic font-lp-serif">FAQ</h2>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="glass-card rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-lg">{faq.q}</span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-6 pb-6 text-white/60 leading-relaxed"
                                    >
                                        {faq.a}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="py-12 md:py-20 border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-lp-accent rounded-xl flex items-center justify-center shadow-lg shadow-lp-accent/20">
                                <Receipt className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-2xl font-lp-serif font-bold block leading-none">Resto Loop</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">by Bluetideapp</span>
                            </div>
                        </div>
                        <p className="text-white/40 max-w-sm text-sm leading-relaxed">
                            Customer retention platform for restaurants. Turn one-time visitors into loyal, repeat customers.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-white/40 hover:text-white transition-colors">
                                <Mail className="w-4 h-4 text-lp-accent" />
                                <a href="mailto:ankit@bluetideapp.com" className="text-sm">ankit@bluetideapp.com</a>
                            </div>
                            <div className="flex items-center gap-3 text-white/40 hover:text-white transition-colors">
                                <Phone className="w-4 h-4 text-lp-accent" />
                                <a href="tel:+917542011085" className="text-sm">+91 7542011085</a>
                            </div>
                            <div className="flex items-center gap-3 text-white/40">
                                <MapPin className="w-4 h-4 text-lp-accent" />
                                <span className="text-sm">Bihar, India</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 lg:justify-items-end">
                        <div className="space-y-4">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest">Platform</h4>
                            <nav className="flex flex-col gap-3">
                                <a href="#how-it-works" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">How it Works</a>
                                <a href="#pricing" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Pricing</a>
                                <a href="#faq" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">FAQ</a>
                            </nav>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-white text-xs font-bold uppercase tracking-widest">Connect</h4>
                            <nav className="flex flex-col gap-3">
                                <Link href="/about" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">About</Link>
                                <Link href="/privacy" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Privacy Policy</Link>
                                <Link href="/terms" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Terms of Service</Link>
                                <Link href="/contact" className="text-sm text-white/30 hover:text-lp-accent transition-colors w-fit">Contact</Link>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 Resto Loop. All rights reserved.</span>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-lp-pulse" />
                            <span className="text-[10px] text-white/40 font-medium">We only communicate with users who have provided consent to receive messages.</span>
                        </div>
                    </div>
                    <div className="text-sm text-white/20 italic">
                        Made with ❤️ by <span className="text-white/40 not-italic font-bold">ANKIT</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default function LandingPage() {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <main className="landing-theme min-h-screen selection:bg-lp-accent selection:text-white">
            <Navbar />
            <Hero />
            <StatBar />
            <HowItWorks />
            <Comparison />
            <ROIBlock />
            <TestimonialMarquee />
            <Pricing />
            <FAQ />
            <Footer />
        </main>
    );
}
