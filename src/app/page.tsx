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
        { name: 'Pricing', href: '/pricing' },
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

const QUESTIONS = [
    {
        id: 'goal',
        question: '1. What is your main goal?',
        options: [
            { label: 'Get more repeat customers', value: 'repeat' },
            { label: 'Fill tables on slow weekdays', value: 'weekdays' },
            { label: 'Cut food app commissions', value: 'commissions' }
        ]
    },
    {
        id: 'marketing',
        question: '2. How do you run marketing today?',
        options: [
            { label: "We don't do any marketing", value: 'none' },
            { label: 'We post on social media or print flyers', value: 'social' },
            { label: 'We collect numbers and message manually', value: 'manual' }
        ]
    },
    {
        id: 'capacity',
        question: '3. Seating capacity of your restaurant?',
        options: [
            { label: 'Small (Under 15 tables)', value: 'small' },
            { label: 'Medium (15 to 45 tables)', value: 'medium' },
            { label: 'Large (More than 45 tables)', value: 'large' }
        ]
    }
];

const PLAN_NAMES: Record<string, string> = {
    trial: 'Trial',
    pro: 'Pro',
    max: 'Max',
    ultra: 'Ultra'
};

const getRecommendation = (answers: { goal?: string; marketing?: string; capacity?: string }) => {
    const { goal, marketing, capacity } = answers;
    
    let plan = 'pro';
    let databaseGrowth = 150;
    let revenueCents = 900000;
    let playbook = '';

    if (capacity === 'small') {
        plan = 'pro';
        databaseGrowth = 150;
        revenueCents = 900000;
    } else if (capacity === 'medium') {
        plan = 'max';
        databaseGrowth = 450;
        revenueCents = 2700000;
    } else if (capacity === 'large') {
        plan = 'ultra';
        databaseGrowth = 1200;
        revenueCents = 7200000;
    }

    if (capacity === 'small' && marketing === 'none') {
        plan = 'trial';
    }

    if (goal === 'repeat') {
        playbook = 'Set up a 15% Welcome Coupon auto-sent 2 hours after their first dining scan.';
    } else if (goal === 'weekdays') {
        playbook = 'Automate Birthday rewards to drive tables on slow Mon-Thu evenings.';
    } else if (goal === 'commissions') {
        playbook = 'Use table QR codes to build a direct loyalty base and offer a free dessert on direct orders.';
    }

    return {
        plan,
        databaseGrowth,
        revenue: Math.round(revenueCents / 100),
        playbook
    };
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
                        <span className="shimmer">repeat customers.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base md:text-lg text-white/40 mb-10 md:mb-12 leading-relaxed">
                        70% of first-time diners never return. Restoloop automatically follows up with custom coupons on WhatsApp to bring them back to your tables.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-24">
                        <Link href="/signup" className="bg-lp-accent hover:bg-lp-accent/90 text-white px-10 py-4.5 rounded-full text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lp-accent/20 hover:shadow-lp-accent/40 hover:scale-[1.02]">
                            Start 21-Day Trial <ArrowRight className="w-5 h-5" />
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
                        <div className="flex border-b border-white/10 mb-6 pb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-white border-b-2 border-lp-accent pb-2">
                                📈 Demo Dashboard
                            </span>
                        </div>

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

type Answers = { goal?: string; marketing?: string; capacity?: string };

const QuizSection = ({ onRecommendPlan }: { onRecommendPlan: (plan: string | null) => void }) => {
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState<Answers>({});

    const handleAnswer = (questionId: string, value: string) => {
        const next = { ...answers, [questionId]: value };
        setAnswers(next);
        if (step < 3) {
            setStep(s => s + 1);
        } else {
            onRecommendPlan(getRecommendation(next).plan);
            setStep(4);
        }
    };

    const result = step === 4 ? getRecommendation(answers) : null;

    const handleScrollToPricing = (plan: string) => {
        onRecommendPlan(plan);
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="quiz-finder" className="py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-lp-accent/80 backdrop-blur-sm mb-6">
                        ⚡ PLAN FINDER · 60 SECONDS
                    </div>
                    <h2 className="text-4xl md:text-7xl font-lp-serif mb-4">Which plan is right for you?</h2>
                    <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto">
                        3 questions. We&apos;ll show you exactly where to start.
                    </p>
                </div>

                <div className="glass-card max-w-2xl mx-auto p-8 md:p-12 rounded-[32px] border border-white/10">
                    {step < 4 ? (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-lp-accent">
                                    Step {step} of 3
                                </span>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(s => (
                                        <div
                                            key={s}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                s < step
                                                    ? 'bg-lp-accent border-lp-accent'
                                                    : s === step
                                                        ? 'border-lp-accent'
                                                        : 'border-white/20'
                                            }`}
                                        >
                                            {s < step && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-lp-serif text-white mb-8">
                                {QUESTIONS[step - 1].question}
                            </h3>

                            <div className="flex flex-col gap-3">
                                {QUESTIONS[step - 1].options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(QUESTIONS[step - 1].id, option.value)}
                                        className="w-full bg-white/5 border border-white/10 hover:border-lp-accent/50 hover:bg-white/10 text-white rounded-2xl px-6 py-4 font-bold text-sm text-left transition-all cursor-pointer flex items-center justify-between group"
                                    >
                                        <span>{option.label}</span>
                                        {'hint' in option && (
                                            <span className="text-[10px] text-lp-accent/60 font-medium ml-4 shrink-0 group-hover:text-lp-accent transition-colors">
                                                {(option as { hint: string }).hint}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {step > 1 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="mt-6 text-[11px] text-white/30 hover:text-white/60 uppercase font-bold cursor-pointer transition-colors"
                                >
                                    ← Back
                                </button>
                            )}
                        </>
                    ) : result && (
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-widest text-emerald-400 mb-4">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                RECOMMENDED PLAN: {PLAN_NAMES[result.plan].toUpperCase()} PLAN
                            </div>

                            <h4 className="text-xl font-lp-serif text-white mb-6">
                                We recommend starting with the <span className="text-lp-accent font-bold">{PLAN_NAMES[result.plan]} Plan</span> based on your restaurant capacity.
                            </h4>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Est. Monthly Guests</div>
                                    <div className="text-2xl font-bold text-white">~{result.databaseGrowth}/mo</div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Est. Revenue Recovery</div>
                                    <div className="text-2xl font-bold text-emerald-400">₹{result.revenue.toLocaleString()}</div>
                                </div>
                            </div>

                            {result.playbook && (
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mb-8">
                                    <div className="text-[10px] text-lp-accent font-black uppercase tracking-widest mb-2">💡 Playbook tip</div>
                                    <p className="text-sm text-white/70 leading-relaxed">{result.playbook}</p>
                                </div>
                            )}

                            <Link
                                href="/signup"
                                className="w-full block text-center bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 text-white py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02] mb-2"
                            >
                                Start My ₹599 Trial — 21 Days, Unlimited Guests
                            </Link>
                            <p className="text-center text-[11px] text-white/30 mb-6">No auto-debit · Cancel anytime</p>

                            <button
                                onClick={() => handleScrollToPricing(result.plan)}
                                className="w-full text-center text-white/40 hover:text-white/70 text-sm transition-colors cursor-pointer"
                            >
                                Or see the {PLAN_NAMES[result.plan]} Plan →
                            </button>

                            <button
                                onClick={() => { setStep(1); setAnswers({}); onRecommendPlan(null); }}
                                className="w-full mt-4 text-center text-white/25 hover:text-white/50 text-xs uppercase tracking-widest font-bold cursor-pointer transition-colors"
                            >
                                Retake Quiz
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const StatBar = () => {
    const stats = [
        { label: 'Setup Cost', value: '₹0' },
        { label: 'Setup Time', value: '7 Mins' },
        { label: 'Open Rate', value: '98%' },
        { label: 'Average ROI', value: '5x' },
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
            title: "Diners Scan QR",
            description: "Customers scan a beautiful QR code at their table to check in and claim their welcome coupon.",
            step: "STEP 1",
        },
        {
            icon: '/landing/step2.jpg',
            title: "Grow Your List",
            description: "Restoloop automatically builds your customer database, organizing them by visits and dining habits.",
            step: "STEP 2",
        },
        {
            icon: '/landing/whatsapp-icon.png',
            title: "Bring Them Back",
            description: "Our system automatically sends personalized WhatsApp coupons on birthdays, slow weekdays, and to win back dormant guests.",
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



const ROIBlock = () => {
    return (
        <section className="py-20 md:py-32 bg-white/[0.01] overflow-hidden">
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
            author: "Ravi Kumar, Owner — Shree Rama Restaurant"
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
        <section className="py-20 bg-white/[0.01] overflow-hidden">
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

const Pricing = ({ recommendedPlan }: { recommendedPlan: string | null }) => {
    const tiers = [
        {
            id: 'trial',
            name: 'Trial',
            price: '₹599',
            period: '21 days',
            credits: 'Unlimited messages',
            note: 'Risk-Free Test',
            features: [
                'Unlimited contact capture',
                'Unlimited WhatsApp sends',
                'Table QR code included',
                'Auto-welcome coupons'
            ],
            badge: 'Perfect to try Restoloop before subscribing.',
            cta: 'Start 21-Day Trial',
            popular: false
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '₹999',
            period: 'month',
            credits: '🪙 300 credits / month',
            note: 'Essential Automation',
            features: [
                'Unlimited contact capture',
                '300 WhatsApp credits / mo',
                'Auto-welcome & Expiry alerts',
                'Customer analytics dashboard'
            ],
            badge: 'Automate your welcome greeting and save hours.',
            cta: 'Get Pro Plan',
            popular: true
        },
        {
            id: 'max',
            name: 'Max',
            price: '₹1,999',
            period: 'month',
            credits: '🪙 700 credits / month',
            note: 'Growth & Birthdays',
            features: [
                'Unlimited contact capture',
                '700 WhatsApp credits / mo',
                'Birthday automation campaigns',
                'Full customer loyalty portal'
            ],
            badge: 'Includes birthday campaigns to fill tables on slow days.',
            cta: 'Get Max Plan',
            popular: false
        },
        {
            id: 'ultra',
            name: 'Ultra',
            price: '₹2,999',
            period: 'month',
            credits: '🪙 1,500 credits / month',
            note: 'Advanced Campaigns',
            features: [
                'Unlimited contact capture',
                '1,500 WhatsApp credits / mo',
                'Win-back dormant guest triggers',
                'Priority human WhatsApp support'
            ],
            badge: 'Advanced win-back campaigns and premium support.',
            cta: 'Get Ultra Plan',
            popular: false
        }
    ];

    return (
        <section id="pricing" className="py-20 md:py-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-4xl md:text-7xl mb-4 md:mb-6 font-lp-serif">Simple, Transparent Pricing</h2>
                    <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
                        No setup fees • No auto-debit • Unused credits rollover forever
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 max-w-7xl mx-auto mb-16">
                    {tiers.map((tier, i) => {
                        const isRecommended = recommendedPlan === tier.id;
                        return (
                            <div
                                key={i}
                                className={`relative p-6 md:p-8 rounded-[24px] md:rounded-[32px] flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                                    isRecommended
                                        ? 'bg-lp-accent/20 border-2 border-lp-accent shadow-[0_0_50px_rgba(223,118,86,0.4)] scale-[1.03] ring-4 ring-lp-accent/20'
                                        : tier.popular
                                            ? 'bg-lp-accent/10 border-2 border-lp-accent shadow-[0_0_40px_rgba(223,118,86,0.2)]'
                                            : 'glass-card'
                                }`}
                            >
                                {isRecommended && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md animate-pulse">
                                        Recommended for You
                                    </div>
                                )}
                                {!isRecommended && tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                        Most Popular
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-white/50 mb-2">{tier.name}</div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl md:text-4xl font-bold font-lp-serif">{tier.price}</span>
                                        <span className="text-xs text-white/40">/ {tier.period}</span>
                                    </div>
                                    <div className="text-xs font-bold text-lp-accent mb-3">{tier.credits}</div>
                                    <p className="text-white/50 text-xs leading-relaxed mb-6 border-b border-white/10 pb-6 italic">{tier.note}</p>

                                    <div className="space-y-3 mb-6">
                                        {tier.features.map((f, j) => (
                                            <div key={j} className="flex items-start gap-2 text-xs text-white/80 font-medium">
                                                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[11px] text-white/50 italic mb-6 leading-tight">{tier.badge}</div>
                                    <Link
                                        href="/signup"
                                        className={`w-full py-3.5 rounded-full font-bold text-center text-xs uppercase tracking-widest transition-all block ${
                                            isRecommended || tier.popular
                                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02]'
                                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recharge Callout Block */}
                <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-10 border border-white/10 relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-lp-accent/10 blur-[60px] rounded-full pointer-events-none" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                        <div>
                            <span className="text-lp-accent text-xs font-black uppercase tracking-widest block mb-2">Need Extra Messages?</span>
                            <h3 className="font-display font-lp-serif text-2xl md:text-3xl text-white mb-2">Recharge packs roll over forever.</h3>
                            <p className="text-xs md:text-sm text-white/50 leading-relaxed max-w-xl">
                                Running low on credits? Buy recharge packs starting from ₹1,500 for 500 messages (🪙 500). Unused credits rollover as long as your account stays active.
                            </p>
                        </div>
                        <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 font-bold text-sm w-full md:w-auto">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-3">Available Top-ups</span>
                            <ul className="space-y-2">
                                <li className="flex justify-between md:gap-12 text-xs"><span>Starter (🪙 500)</span> <span className="text-lp-accent">₹1,500</span></li>
                                <li className="flex justify-between md:gap-12 text-xs"><span>Growth (🪙 1,000)</span> <span className="text-lp-accent">₹3,000</span></li>
                                <li className="flex justify-between md:gap-12 text-xs"><span>Power (🪙 2,000)</span> <span className="text-lp-accent">₹6,000</span></li>
                            </ul>
                        </div>
                    </div>
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
            a: "All credits you purchase via top-up packages never expire. For monthly subscription plans (Pro, Max, Ultra), your base credits roll over to the next month forever as long as your subscription remains active. Your credits are never wasted."
        },
        {
            q: "What if there's a problem with the system?",
            a: "We are available on WhatsApp. There's a support button on the dashboard that sends a message directly to our team. A real human responds, not a bot."
        },
        {
            q: "Is this only for large restaurants?",
            a: "No. Restoloop is built for food outlets of all sizes — from neighborhood cafes and local QSRs to large multi-table dine-in restaurants. If you want to build a loyal customer base and grow repeat visits, Restoloop is for you."
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
                                <span className="text-2xl font-lp-serif font-bold block leading-none">Restoloop</span>
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
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 Restoloop. All rights reserved.</span>
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
    const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <main className="landing-theme min-h-screen selection:bg-lp-accent selection:text-white">
            <Navbar />
            <Hero />
            <StatBar />
            <HowItWorks />
            <ROIBlock />
            <TestimonialMarquee />
            <QuizSection onRecommendPlan={setRecommendedPlan} />
            <Pricing recommendedPlan={recommendedPlan} />
            <FAQ />
            <Footer />
        </main>
    );
}
