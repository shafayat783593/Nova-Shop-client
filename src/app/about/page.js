"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Store, ShoppingBag, CalendarDays,
    Target, Eye, Rocket,
    Zap, ShieldCheck, RefreshCw, Truck,
    Users, Mail, Phone, MapPin,
    ArrowRight, Star, Package, Heart,
    CheckCircle, TrendingUp, Award,
    ChevronRight, Leaf,
} from "lucide-react";

// ── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 1800, started = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!started) return;
        let t0 = null;
        const tick = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [started, target, duration]);
    return count;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, suffix, label, Icon, delay, started }) {
    const n = useCounter(value, 1800, started);
    return (
        <div
            className="bg-card rounded-2xl p-6 border border-accent-10 flex flex-col items-center text-center gap-3"
            style={{ animation: `fadeUp .6s ease both`, animationDelay: delay }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-opacity)" }}
            >
                <Icon size={22} style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="text-heading font-black text-3xl md:text-4xl leading-none">
                {n.toLocaleString()}{suffix}
            </p>
            <p className="text-body text-sm font-semibold">{label}</p>
        </div>
    );
}

// ── Value card ───────────────────────────────────────────────────────────────
function ValueCard({ Icon, title, desc, delay }) {
    return (
        <div
            className="group bg-card rounded-2xl border border-accent-10 p-6
                       hover:border-[var(--color-primary)]/30 hover:shadow-lg hover:-translate-y-1
                       transition-all duration-300"
            style={{ animation: `fadeUp .6s ease both`, animationDelay: delay }}
        >
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4
                           group-hover:scale-110 transition-transform duration-300"
                style={{ background: "var(--accent-opacity)" }}
            >
                <Icon size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <h3 className="text-heading font-bold text-sm mb-1.5">{title}</h3>
            <p className="text-body text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

// ── Team card ────────────────────────────────────────────────────────────────
function TeamCard({ name, role, initials, delay }) {
    return (
        <div
            className="group bg-card rounded-2xl border border-accent-10 overflow-hidden text-center
                       hover:-translate-y-1 hover:shadow-xl hover:border-[var(--color-primary)]/25
                       transition-all duration-300"
            style={{ animation: `fadeUp .6s ease both`, animationDelay: delay }}
        >
            <div
                className="h-28 flex items-center justify-center relative overflow-hidden"
                style={{ background: "var(--accent-opacity)" }}
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg, rgba(45,106,79,0.1), rgba(149,213,178,0.1))" }}
                />
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl text-white relative z-10
                               group-hover:scale-110 transition-transform duration-300"
                    style={{ background: "var(--color-primary)" }}
                >
                    {initials}
                </div>
            </div>
            <div className="p-4">
                <p className="text-heading font-bold text-sm">{name}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-secondary)" }}>{role}</p>
            </div>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
    const statsRef = useRef(null);
    const [statsStarted, setStatsStarted] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setStatsStarted(true); },
            { threshold: 0.25 }
        );
        if (statsRef.current) obs.observe(statsRef.current);
        return () => obs.disconnect();
    }, []);

    const OFFERS = [
        { Icon: Truck,       title: "Fast Delivery",        desc: "Same-day dispatch within Dhaka. Nationwide delivery in 24–48 hours, tracked at every step." },
        { Icon: ShieldCheck, title: "100% Authentic",       desc: "Every product we list is sourced from verified suppliers. No replicas, no hidden surprises." },
        { Icon: RefreshCw,   title: "Easy Returns",         desc: "Not satisfied? Return within 7 days, no questions asked. Your peace of mind comes first." },
        { Icon: Zap,         title: "Best Prices",          desc: "We work directly with suppliers to cut unnecessary costs and pass the savings on to you." },
    ];

    const TEAM = [
        { name: "MD Shafayat Hosan",    role: "Founder & CEO",       initials: "SH", delay: "0ms"   },
        // { name: "Nadia Islam",    role: "Head of Design",      initials: "NI", delay: "80ms"  },
        // { name: "Tanvir Hossain", role: "Tech Lead",           initials: "TH", delay: "160ms" },
        // { name: "Sadia Akter",    role: "Customer Success",    initials: "SA", delay: "240ms" },
    ];

    return (
        <main className="min-h-screen bg-bg">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ════════════════════════════════════════════════════════════════
                1. HERO — Company Introduction
            ════════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden py-24 md:py-32 px-4">
                {/* Subtle bg blobs */}
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.05]"
                    style={{ background: "var(--color-primary)" }} />
                <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full pointer-events-none opacity-[0.04]"
                    style={{ background: "var(--color-accent)" }} />

                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                    {/* Left — text */}
                    <div>
                        {/* Eyebrow */}
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
                            style={{
                                background: "var(--accent-opacity)",
                                color: "var(--color-secondary)",
                                border: "1px solid rgba(45,106,79,0.15)",
                                animation: "fadeUp .5s ease both",
                            }}
                        >
                            <Store size={13} />
                            About NovaShop
                        </div>

                        <h1
                            className="text-4xl md:text-6xl font-black text-heading leading-[1.1] mb-5"
                            style={{ animation: "fadeUp .6s ease .05s both" }}
                        >
                            Bangladesh's most
                            <br />
                            <span style={{ color: "var(--color-primary)" }}>trusted shop.</span>
                        </h1>

                        <p
                            className="text-body text-base md:text-lg leading-relaxed mb-8 max-w-lg"
                            style={{ animation: "fadeUp .6s ease .1s both" }}
                        >
                            We started in <strong className="text-heading font-bold">2026</strong> with one mission —
                            to give Bangladeshi shoppers a place they can genuinely trust.
                            Affordable prices, authentic products, delivered fast. That's NovaShop.
                        </p>

                        {/* Quick facts */}
                        <div
                            className="flex flex-col gap-3 mb-8"
                            style={{ animation: "fadeUp .6s ease .15s both" }}
                        >
                            {[
                                { Icon: CalendarDays, text: "Founded in 2026, Dhaka, Bangladesh" },
                                { Icon: ShoppingBag,  text: "3,500+ products across 20+ categories" },
                                { Icon: Users,        text: "4,000+ happy customers and growing" },
                            ].map(({ Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: "var(--accent-opacity)" }}
                                    >
                                        <Icon size={15} style={{ color: "var(--color-primary)" }} />
                                    </div>
                                    <span className="text-body text-sm font-medium">{text}</span>
                                </div>
                            ))}
                        </div>

                        <div
                            className="flex flex-wrap gap-3"
                            style={{ animation: "fadeUp .6s ease .2s both" }}
                        >
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white
                                           transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                                style={{ background: "var(--color-primary)" }}
                            >
                                Shop Now <ArrowRight size={15} />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border
                                           transition-all duration-200 hover:-translate-y-0.5"
                                style={{
                                    borderColor: "rgba(45,106,79,0.25)",
                                    color: "var(--color-primary)",
                                    background: "var(--accent-opacity)",
                                }}
                            >
                                Contact Us <ChevronRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* Right — stacked card visual */}
                    <div
                        className="relative h-72 md:h-[400px]"
                        style={{ animation: "fadeUp .7s ease .25s both" }}
                    >
                        <div
                            className="absolute inset-0 rounded-3xl border border-accent-10"
                            style={{ background: "var(--accent-opacity)", transform: "rotate(5deg) translateY(8px)" }}
                        />
                        <div
                            className="absolute inset-0 rounded-3xl border border-accent-10"
                            style={{ background: "var(--card-bg)", transform: "rotate(2deg) translateY(4px)" }}
                        />
                        <div
                            className="absolute inset-0 rounded-3xl border border-accent-10 flex flex-col items-center justify-center gap-5 p-8"
                            style={{ background: "var(--card-bg)" }}
                        >
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                                style={{ background: "var(--accent-opacity)" }}
                            >
                                <Store size={42} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <div className="text-center space-y-6">
                                <p className="text-heading text-2xl font-black">NovaShop</p>
                                <p className="text-body text-sm mt-1">Bangladesh's honest marketplace</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {[
                                    { Icon: Leaf,       label: "Eco packaging" },
                                    { Icon: ShieldCheck, label: "Verified sellers" },
                                    { Icon: Truck,      label: "Fast delivery" },
                                    { Icon: Heart,      label: "Customer first" },
                                ].map(({ Icon, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                        style={{ background: "var(--accent-opacity)" }}
                                    >
                                        <Icon size={14} style={{ color: "var(--color-primary)" }} />
                                        <span className="text-heading text-xs font-semibold">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                STATS BAR
            ════════════════════════════════════════════════════════════════ */}
            <section ref={statsRef} className="py-12 px-4" style={{ background: "var(--accent-opacity)" }}>
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard value={12000} suffix="+"  label="Happy Customers"   Icon={Users}      delay="0ms"   started={statsStarted} />
                    <StatCard value={3500}  suffix="+"  label="Products Listed"   Icon={Package}    delay="80ms"  started={statsStarted} />
                    <StatCard value={98}    suffix="%"  label="Satisfaction Rate" Icon={Star}       delay="160ms" started={statsStarted} />
                    <StatCard value={48}    suffix="h"  label="Avg. Delivery"     Icon={Truck}      delay="240ms" started={statsStarted} />
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                2. MISSION & VISION
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="text-center mb-12"
                        style={{ animation: "fadeUp .6s ease both" }}
                    >
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: "var(--color-secondary)" }}
                        >
                            <Target size={13} /> Mission & Vision
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-heading">
                            Why we exist
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Mission */}
                        <div
                            className="bg-card rounded-2xl border border-accent-10 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                            style={{ animation: "fadeUp .6s ease .05s both" }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                style={{ background: "var(--accent-opacity)" }}
                            >
                                <Target size={22} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <h3 className="text-heading text-xl font-black mb-3">Our Mission</h3>
                            <p className="text-body leading-relaxed mb-5">
                                To deliver quality products at the best price — making premium shopping
                                accessible to every family in Bangladesh, not just those in big cities.
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Affordable prices without compromising quality",
                                    "Verified, authentic products only",
                                    "Reliable service every single order",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5">
                                        <CheckCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                                        <span className="text-body text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Vision */}
                        <div
                            className="bg-card rounded-2xl border border-accent-10 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                            style={{ animation: "fadeUp .6s ease .1s both" }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                style={{ background: "var(--accent-opacity)" }}
                            >
                                <Eye size={22} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <h3 className="text-heading text-xl font-black mb-3">Our Vision</h3>
                            <p className="text-body leading-relaxed mb-5">
                                By 2027, we aim to become Bangladesh's go-to e-commerce platform —
                                empowering 500+ local vendors and serving 100,000+ customers nationwide.
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "Expand to all 64 districts by 2026",
                                    "Onboard 500+ verified local vendors",
                                    "Launch same-day delivery nationwide",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5">
                                        <TrendingUp size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-secondary)" }} />
                                        <span className="text-body text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                3. WHAT WE OFFER
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-16 px-4" style={{ background: "var(--accent-opacity)" }}>
                <div className="max-w-7xl mx-auto">
                    <div
                        className="text-center mb-12"
                        style={{ animation: "fadeUp .6s ease both" }}
                    >
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: "var(--color-secondary)" }}
                        >
                            <ShoppingBag size={13} /> What We Offer
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-heading">
                            Why shop with NovaShop?
                        </h2>
                        <p className="text-body mt-3 max-w-xl mx-auto text-sm md:text-base">
                            From fashion to electronics, home goods to beauty — we carry 3,500+ products
                            across 20+ categories, all with these guarantees.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {OFFERS.map((o, i) => (
                            <ValueCard key={o.title} {...o} delay={`${i * 80}ms`} />
                        ))}
                    </div>

                    {/* Category pills */}
                    <div
                        className="mt-10 flex flex-wrap justify-center gap-2"
                        style={{ animation: "fadeUp .6s ease .3s both" }}
                    >
                        {["Fashion","Electronics","Home & Living","Beauty","Sports","Books","Kids","Kitchen","Accessories","Footwear"].map((cat) => (
                            <Link
                                key={cat}
                                href={`/products?category=${cat}`}
                                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30"
                                style={{
                                    background: "var(--card-bg)",
                                    borderColor: "var(--accent-opacity)",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                4. FOUNDER & TEAM
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-20 ">
                <div className="max-w-7xl mx-auto " style={{ animation: "fadeUp .6s ease both" }}>
                    <div className="grid md:grid-cols-2 gap-12 items-start py-10">
                        {/* Founder spotlight */}
                        <div className="mx-14" style={{ animation: "fadeUp .6s ease both" }}>
                            <span
                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4"
                                style={{ color: "var(--color-secondary)" }}
                            >
                                <Award size={13} /> Founder
                            </span>
                            <div className="bg-card rounded-2xl border border-accent-10 py-10 px-10 my-10 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4 mb-5">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white flex-shrink-0"
                                        style={{ background: "var(--color-primary)" }}
                                    >
                                        SH
                                    </div>
                                    <div>
                                        <p className="text-heading font-black text-base">MD Shafayat Hosan</p>
                                        <p className="text-sm font-semibold" style={{ color: "var(--color-secondary)" }}>Founder & CEO</p>
                                        <p className="text-body text-xs mt-0.5">Dhaka, Bangladesh</p>
                                    </div>
                                </div>
                                <p className="text-body text-sm leading-relaxed mb-4">
                                    "I built NovaShop because I was tired of getting substandard products with no accountability.
                                    Every order we ship, I want the customer to feel like they made the right choice."
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["E-commerce", "Product Design", "Logistics"].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                            style={{ background: "var(--accent-opacity)", color: "var(--color-secondary)" }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Team intro text */}
                        <div className="mx-14" style={{ animation: "fadeUp .6s ease .1s both" }}>
                            <span
                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4"
                                style={{ color: "var(--color-secondary)" }}
                            >
                                <Users size={13} /> Our Team
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-heading mb-4">
                                Small team, big heart.
                            </h2>
                            <p className="text-body text-sm leading-relaxed mb-6">
                                We're a tight team of 12 people in Dhaka who care deeply about every order.
                                From design and tech to logistics and customer support — everyone here is
                                obsessed with getting your experience right.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { Icon: Rocket,      text: "Shipped 45,000+ orders since launch" },
                                    { Icon: ShieldCheck, text: "4.9/5 avg. customer satisfaction" },
                                    { Icon: Heart,       text: "1% of revenue donated to local NGOs" },
                                ].map(({ Icon, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: "var(--accent-opacity)" }}
                                        >
                                            <Icon size={14} style={{ color: "var(--color-primary)" }} />
                                        </div>
                                        <span className="text-body text-sm">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Team grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 my-12" style={{ animation: "fadeUp .6s ease .15s both" }}>
                        {TEAM.map((m) => <TeamCard key={m.name} {...m} />)}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                5. CONTACT INFO + CTA
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-16 px-4" style={{ background: "var(--accent-opacity)" }}>
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
                    {/* Contact info */}
                    <div style={{ animation: "fadeUp .6s ease both" }}>
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ color: "var(--color-secondary)" }}
                        >
                            <Mail size={13} /> Get In Touch
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-heading mb-2">
                            We'd love to hear from you.
                        </h2>
                        <p className="text-body text-sm mb-7">
                            Have a question, complaint, or just want to say hi? Our team responds within 2 hours.
                        </p>
                        <div className="space-y-4">
                            {[
                                { Icon: Mail,    label: "Email",   value: "shafayat783@gmail.com",  href: "mailto:shafayat783@gmail.com" },
                                { Icon: Phone,   label: "Phone",   value: "+880 1610665069",          href: "tel:+8801610665069" },
                                { Icon: MapPin,  label: "Address", value: "Chittagong, Bangladesh", href: "#" },
                            ].map(({ Icon, label, value, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-card border border-accent-10
                                               hover:border-[var(--color-primary)]/25 hover:shadow-md hover:-translate-y-0.5
                                               transition-all duration-200 group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                                   group-hover:scale-110 transition-transform duration-200"
                                        style={{ background: "var(--accent-opacity)" }}
                                    >
                                        <Icon size={17} style={{ color: "var(--color-primary)" }} />
                                    </div>
                                    <div>
                                        <p className="text-body text-xs font-bold uppercase tracking-wide">{label}</p>
                                        <p className="text-heading text-sm font-semibold mt-0.5">{value}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* CTA card */}
                    <div
                        className="relative rounded-3xl overflow-hidden px-10 flex flex-col justify-center"
                        style={{
                            background: "var(--color-primary)",
                            animation: "fadeUp .6s ease .1s both",
                        }}
                    >
                        {/* Decorative rings */}
                        <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full border-[28px] border-white/5 pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full border-[20px] border-white/5 pointer-events-none" />

                        <div className="relative z-10">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                style={{ background: "rgba(255,255,255,0.12)" }}
                            >
                                <Rocket size={22} className="text-white" />
                            </div>
                            <h3 className="text-white text-2xl md:text-3xl font-black mb-3 leading-tight">
                                Ready to shop smarter?
                            </h3>
                            <p className="text-white/70 text-sm mb-7 leading-relaxed">
                                Join 12,000+ happy customers. Quality products, honest prices,
                                delivered to your door across Bangladesh.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                                               transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                                    style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}
                                >
                                    Browse Products <ArrowRight size={15} />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                                               border border-white/25 text-white transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}