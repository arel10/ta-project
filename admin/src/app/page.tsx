"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import sirkulaLogo from "@/../assets/img/Sirkula.png";

// ─── Types ────────────────────────────────────────────────────────────
interface PublicStats {
  total_members: number;
  total_weight_kg: number;
  total_deposits: number;
  total_points_distributed: number;
  total_redemptions: number;
  active_missions: number;
  total_badges_earned: number;
}

interface WasteBreakdown {
  waste_type: string;
  label: string;
  total_weight_kg: number;
  deposit_count: number;
}

interface BadgeData {
  id: number;
  name: string;
  description: string;
  condition_type: string;
  condition_value: number;
  earned_count: number;
  icon_url: string | null;
}

const WASTE_COLORS: Record<string, string> = {
  plastic: "#16a34a",
  paper: "#d97706",
  metal: "#64748b",
  glass: "#0891b2",
  organic: "#65a30d",
  electronic: "#7c3aed",
  default: "#94a3b8",
};

// ─── Counter Hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target === 0) return;
    let raf: number;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return count;
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  suffix,
  color,
  started,
  delay,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  started: boolean;
  delay: number;
}) {
  const count = useCountUp(value, 2000, started);
  return (
    <div className="lp-stat-card lp-reveal" style={{ transitionDelay: `${delay}ms` }}>
      <div className="lp-stat-accent" style={{ background: color }} />
      <div className="lp-stat-num" style={{ color }}>
        {count.toLocaleString("id-ID")}
        {suffix && <span className="lp-stat-suffix">{suffix}</span>}
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function LandingPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [waste, setWaste] = useState<WasteBreakdown[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsStarted, setStatsStarted] = useState(false);
  const [wasteBarsStarted, setWasteBarsStarted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // ─── Fetch Data ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, badgesRes] = await Promise.all([
          fetch(`${API_BASE}/admin/public/stats`),
          fetch(`${API_BASE}/admin/public/badges`),
        ]);
        if (statsRes.ok) {
          const d = await statsRes.json();
          setStats(d.stats);
          setWaste(d.waste_breakdown || []);
        }
        if (badgesRes.ok) {
          const d = await badgesRes.json();
          setBadges(d.badges || []);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE]);

  // ─── Scroll Effects ───────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Parallax Orbs on Mouse Move ─────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const orbs = document.querySelectorAll<HTMLElement>(".lp-orb");
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 14;
        orb.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ─── Reveal on Scroll (AOS-like) ─────────────────────────────────
  useEffect(() => {
    const elements = document.querySelectorAll(".lp-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseFloat(el.style.transitionDelay || "0");
            setTimeout(() => el.classList.add("lp-revealed"), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  // ─── Stats Counter Trigger ────────────────────────────────────────
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsStarted(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [loading]);

  // ─── Waste Bars Trigger ───────────────────────────────────────────
  const wasteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!wasteRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setWasteBarsStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(wasteRef.current);
    return () => obs.disconnect();
  }, [loading, waste]);

  // ─── Card Tilt Effect ─────────────────────────────────────────────
  const tiltRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -5;
      const rotY = ((x - cx) / cx) * 5;
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    };
    const onLeave = () => { el.style.transform = ""; };
    el.addEventListener("mousemove", onMove as EventListener);
    el.addEventListener("mouseleave", onLeave);
  }, []);

  const totalWasteWeight = waste.reduce((s, w) => s + w.total_weight_kg, 0);
  const sortedWaste = [...waste].sort((a, b) => b.total_weight_kg - a.total_weight_kg);

  return (
    <>
      {/* ══════════════════════ STYLES ══════════════════════ */}
      <style>{`
        /* ── Reset & Base ─────────────────────────────── */
        .lp-root {
          font-family: var(--font-poppins), 'Poppins', sans-serif;
          background: #f8fafc;
          color: #1e293b;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── Reveal Animation ─────────────────────────── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-reveal.lp-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-reveal-left {
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-reveal-left.lp-revealed {
          opacity: 1;
          transform: translateX(0);
        }
        .lp-reveal-right {
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
                      transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-reveal-right.lp-revealed {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Keyframes ─────────────────────────────────── */
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes lp-float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes lp-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
        @keyframes lp-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes lp-bar-grow {
          from { width: 0; }
        }
        @keyframes lp-counter-pop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lp-fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Navbar ─────────────────────────────────────── */
        .lp-navbar {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8f0;
          transition: box-shadow 0.3s, background 0.3s;
        }
        .lp-navbar.lp-scrolled {
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.98);
        }
        .lp-nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .lp-nav-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .lp-logo-img {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          transition: transform 0.3s;
        }
        .lp-nav-logo:hover .lp-logo-img {
          transform: rotate(-8deg) scale(1.08);
        }
        .lp-nav-brand {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .lp-nav-eyebrow {
          font-size: 0.58rem;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .lp-nav-name {
          font-size: 1rem;
          font-weight: 800;
          color: #166534;
          letter-spacing: -0.3px;
        }
        .lp-nav-divider {
          width: 1px;
          height: 30px;
          background: #e2e8f0;
          flex-shrink: 0;
        }
        .lp-nav-sub {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .lp-nav-sub-eyebrow {
          font-size: 0.58rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .lp-nav-sub-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #15803d;
        }
        .lp-nav-links {
          display: flex;
          gap: 6px;
          list-style: none;
          margin: 0 0 0 auto;
          padding: 0;
        }
        .lp-nav-links a {
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .lp-nav-links a:hover {
          color: #15803d;
          background: #f0fdf4;
        }
        .lp-nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #16a34a;
          color: white !important;
          text-decoration: none;
          padding: 9px 20px;
          border-radius: 9px;
          font-size: 0.85rem;
          font-weight: 700;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(22,163,74,0.3);
          flex-shrink: 0;
        }
        .lp-nav-cta:hover {
          background: #15803d;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(22,163,74,0.35);
        }
        /* Mobile hamburger */
        .lp-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          margin-left: auto;
          border: none;
          background: none;
        }
        .lp-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #334155;
          border-radius: 2px;
          transition: transform 0.3s, opacity 0.3s;
        }
        .lp-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .lp-hamburger.open span:nth-child(2) { opacity: 0; }
        .lp-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        .lp-mobile-menu {
          display: none;
          flex-direction: column;
          gap: 2px;
          padding: 12px 16px 16px;
          border-top: 1px solid #f1f5f9;
          background: white;
        }
        .lp-mobile-menu.open { display: flex; }
        .lp-mobile-menu a {
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          color: #475569;
          padding: 10px 12px;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .lp-mobile-menu a:hover { background: #f0fdf4; color: #15803d; }
        .lp-mobile-menu .lp-mobile-cta {
          margin-top: 8px;
          background: #16a34a;
          color: white !important;
          text-align: center;
          border-radius: 9px;
          font-weight: 700;
        }

        /* ── Hero ──────────────────────────────────────── */
        .lp-hero {
          position: relative;
          padding: 80px 0 90px;
          overflow: hidden;
          background: linear-gradient(150deg, #f0fdf4 0%, #f8fafc 50%, #eff6ff 100%);
        }
        /* Animated background orbs */
        .lp-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          transition: transform 0.1s ease-out;
          will-change: transform;
        }
        .lp-orb-1 {
          width: 400px; height: 400px;
          top: -80px; right: -60px;
          background: radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 70%);
          animation: lp-float-slow 10s ease-in-out infinite;
        }
        .lp-orb-2 {
          width: 320px; height: 320px;
          bottom: -60px; left: -40px;
          background: radial-gradient(circle, rgba(147,197,253,0.28) 0%, transparent 70%);
          animation: lp-float-slow 14s ease-in-out infinite reverse;
        }
        .lp-orb-3 {
          width: 200px; height: 200px;
          top: 30%; left: 50%;
          background: radial-gradient(circle, rgba(167,243,208,0.2) 0%, transparent 70%);
          animation: lp-float 8s ease-in-out infinite;
        }
        .lp-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .lp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.85);
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.74rem;
          font-weight: 600;
          margin-bottom: 20px;
          box-shadow: 0 1px 6px rgba(22,163,74,0.12);
          animation: lp-fade-in-up 0.7s both;
        }
        .lp-pulse-dot {
          width: 7px; height: 7px;
          background: #16a34a;
          border-radius: 50%;
          animation: lp-pulse-dot 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .lp-hero-title {
          font-size: clamp(2rem, 3.5vw, 3.2rem);
          font-weight: 800;
          line-height: 1.12;
          color: #0f172a;
          margin-bottom: 18px;
          animation: lp-fade-in-up 0.7s 0.1s both;
        }
        .lp-accent { color: #16a34a; }
        .lp-hero-desc {
          font-size: 1rem;
          color: #64748b;
          line-height: 1.78;
          max-width: 480px;
          margin-bottom: 36px;
          animation: lp-fade-in-up 0.7s 0.2s both;
        }
        .lp-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 48px;
          animation: lp-fade-in-up 0.7s 0.3s both;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #16a34a;
          color: white;
          text-decoration: none;
          padding: 13px 26px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.25s;
          box-shadow: 0 4px 14px rgba(22,163,74,0.3);
        }
        .lp-btn-primary:hover {
          background: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22,163,74,0.38);
        }
        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 2px solid #cbd5e1;
          color: #475569;
          text-decoration: none;
          padding: 11px 22px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.25s;
          background: white;
        }
        .lp-btn-secondary:hover {
          border-color: #86efac;
          color: #15803d;
          background: #f0fdf4;
          transform: translateY(-2px);
        }
        .lp-hero-meta {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
          animation: lp-fade-in-up 0.7s 0.4s both;
        }
        .lp-hero-meta-item {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-meta-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        /* Hero Visual Card */
        .lp-hero-visual {
          animation: lp-fade-in-up 0.8s 0.2s both;
        }
        .lp-hero-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
          animation: lp-float 7s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .lp-hero-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #16a34a, #22c55e, #84cc16);
        }
        .lp-hero-card-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-hero-card-label::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: lp-pulse-dot 2s ease-in-out infinite;
        }
        .lp-app-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .lp-feature-chip {
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
          transition: all 0.2s;
          cursor: default;
        }
        .lp-feature-chip:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
          transform: translateX(3px);
        }
        .lp-hero-card-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 10px;
        }
        .lp-stack-chip {
          flex: 1;
          padding: 8px;
          background: #f8fafc;
          border-radius: 8px;
          text-align: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          border: 1px solid #f1f5f9;
        }

        /* ── Section Base ──────────────────────────────── */
        .lp-section {
          padding: 88px 0;
        }
        .lp-section-alt {
          background: white;
        }
        .lp-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .lp-section-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .lp-tag {
          display: inline-block;
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #15803d;
          padding: 4px 14px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }
        .lp-section-title {
          font-size: clamp(1.6rem, 2.8vw, 2.25rem);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.18;
          margin-bottom: 14px;
        }
        .lp-section-desc {
          font-size: 0.95rem;
          color: #64748b;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.75;
        }

        /* ── Stats Grid ────────────────────────────────── */
        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .lp-stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px 22px 22px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .lp-stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.09);
        }
        .lp-stat-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          border-radius: 16px 16px 0 0;
        }
        .lp-stat-num {
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }
        .lp-stat-suffix {
          font-size: 1.1rem;
          font-weight: 600;
          opacity: 0.7;
          margin-left: 2px;
        }
        .lp-stat-label {
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 500;
        }

        /* ── Skeleton ──────────────────────────────────── */
        .lp-skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e8f0f8 50%, #f1f5f9 75%);
          background-size: 400% 100%;
          animation: lp-shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }

        /* ── Features Grid ─────────────────────────────── */
        .lp-features-bento {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 18px;
        }
        .lp-feat {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px 26px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s;
        }
        .lp-feat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 0;
          background: linear-gradient(0deg, rgba(240,253,244,0.8) 0%, transparent 100%);
          transition: height 0.3s;
        }
        .lp-feat:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: #bbf7d0;
        }
        .lp-feat:hover::after { height: 60px; }
        .lp-feat-wide {
          grid-column: span 2;
        }
        .lp-feat-accent {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .lp-feat h3 {
          font-size: 1.02rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .lp-feat p {
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.68;
          margin-bottom: 16px;
        }
        .lp-feat-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .lp-feat-tag {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 3px 10px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* ── Steps ─────────────────────────────────────── */
        .lp-steps-wrap {
          position: relative;
        }
        .lp-steps-line {
          position: absolute;
          top: 32px;
          left: calc(12.5% + 32px);
          right: calc(12.5% + 32px);
          height: 2px;
          background: linear-gradient(90deg, #bbf7d0, #86efac, #bbf7d0);
          z-index: 0;
        }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
          z-index: 1;
        }
        .lp-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 8px;
          transition: transform 0.25s;
        }
        .lp-step:hover { transform: translateY(-4px); }
        .lp-step-circle {
          width: 64px; height: 64px;
          background: white;
          border: 2px solid #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
          color: #16a34a;
          margin-bottom: 18px;
          box-shadow: 0 0 0 8px #f0fdf4, 0 4px 12px rgba(22,163,74,0.15);
          transition: background 0.25s, color 0.25s, box-shadow 0.25s;
        }
        .lp-step:hover .lp-step-circle {
          background: #16a34a;
          color: white;
          box-shadow: 0 0 0 8px #dcfce7, 0 6px 20px rgba(22,163,74,0.3);
        }
        .lp-step h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .lp-step p {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.65;
        }

        /* ── Waste Breakdown ────────────────────────────── */
        .lp-waste-layout {
          display: grid;
          grid-template-columns: 5fr 4fr;
          gap: 40px;
          align-items: start;
        }
        .lp-waste-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
        }
        .lp-waste-bars { display: flex; flex-direction: column; gap: 16px; }
        .lp-waste-bar-row {
          display: grid;
          grid-template-columns: 100px 1fr 56px;
          align-items: center;
          gap: 12px;
        }
        .lp-waste-bar-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .lp-waste-bar-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lp-waste-track {
          height: 10px;
          background: #f1f5f9;
          border-radius: 5px;
          overflow: hidden;
        }
        .lp-waste-fill {
          height: 100%;
          border-radius: 5px;
          width: 0;
          transition: width 1.6s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-waste-pct {
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
          text-align: right;
        }
        .lp-waste-table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .lp-waste-table-head {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 20px;
          display: grid;
          grid-template-columns: 1fr 72px 56px;
          gap: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .lp-waste-table-row {
          padding: 12px 20px;
          display: grid;
          grid-template-columns: 1fr 72px 56px;
          gap: 8px;
          align-items: center;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
        }
        .lp-waste-table-row:last-child { border-bottom: none; }
        .lp-waste-table-row:hover { background: #f8fafc; }
        .lp-waste-row-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #0f172a;
        }
        .lp-waste-row-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lp-waste-row-kg {
          font-size: 0.82rem;
          font-weight: 700;
          color: #16a34a;
          text-align: right;
        }
        .lp-waste-row-count {
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: right;
        }

        /* ── Badges ─────────────────────────────────────── */
        .lp-badges-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .lp-badge-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px 18px;
          text-align: center;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s;
          position: relative;
          overflow: hidden;
        }
        .lp-badge-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(240,253,244,0.6) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-badge-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 36px rgba(22,163,74,0.12);
          border-color: #86efac;
        }
        .lp-badge-card:hover::before { opacity: 1; }
        .lp-badge-icon-wrap {
          width: 60px; height: 60px;
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          font-size: 1.6rem;
          transition: transform 0.3s;
          position: relative;
          z-index: 1;
        }
        .lp-badge-card:hover .lp-badge-icon-wrap {
          transform: rotate(-5deg) scale(1.1);
        }
        .lp-badge-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 5px;
          position: relative;
          z-index: 1;
        }
        .lp-badge-desc {
          font-size: 0.73rem;
          color: #64748b;
          line-height: 1.55;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .lp-badge-earned {
          display: inline-block;
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #15803d;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 50px;
          position: relative;
          z-index: 1;
        }

        /* ── Tech Section ───────────────────────────────── */
        .lp-tech-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        .lp-tech-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 26px 20px;
          text-align: center;
          transition: transform 0.25s, box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }
        .lp-tech-card::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          transform: scaleX(0);
          transition: transform 0.3s;
          transform-origin: center;
        }
        .lp-tech-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .lp-tech-card:hover::before { transform: scaleX(1); }
        .lp-tech-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          font-size: 1.4rem;
          transition: transform 0.3s;
        }
        .lp-tech-card:hover .lp-tech-icon { transform: scale(1.12) rotate(-5deg); }
        .lp-tech-card h3 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .lp-tech-card p {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.65;
          margin-bottom: 14px;
        }
        .lp-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .lp-chip {
          padding: 2px 9px;
          border-radius: 50px;
          font-size: 0.64rem;
          font-weight: 700;
          border: 1px solid;
          transition: transform 0.2s;
        }
        .lp-chip:hover { transform: scale(1.06); }

        /* ── CTA ────────────────────────────────────────── */
        .lp-cta {
          background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%);
          padding: 88px 0;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-orb1 {
          position: absolute;
          width: 400px; height: 400px;
          top: -100px; right: -80px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-cta-orb2 {
          position: absolute;
          width: 300px; height: 300px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-cta-inner {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 24px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .lp-cta-tag {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.9);
          padding: 4px 14px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }
        .lp-cta h2 {
          font-size: clamp(1.7rem, 2.8vw, 2.3rem);
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
          line-height: 1.15;
        }
        .lp-cta p {
          color: rgba(255,255,255,0.75);
          font-size: 0.95rem;
          line-height: 1.75;
          margin-bottom: 36px;
        }
        .lp-cta-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .lp-cta-btn-white {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #15803d;
          text-decoration: none;
          padding: 13px 28px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .lp-cta-btn-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.2);
        }
        .lp-cta-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 2px solid rgba(255,255,255,0.45);
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.25s;
        }
        .lp-cta-btn-ghost:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.7);
          transform: translateY(-2px);
        }

        /* ── Footer ─────────────────────────────────────── */
        .lp-footer {
          background: #0f172a;
          padding: 60px 0 28px;
        }
        .lp-footer-grid {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }
        .lp-footer-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .lp-footer-brand-name {
          font-size: 1rem;
          font-weight: 800;
          color: #f1f5f9;
        }
        .lp-footer-gov-label {
          font-size: 0.68rem;
          color: #4ade80;
          font-weight: 500;
          letter-spacing: 0.4px;
          margin-bottom: 12px;
        }
        .lp-footer-brand-desc {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.72;
        }
        .lp-footer-col h4 {
          font-size: 0.74rem;
          font-weight: 700;
          color: #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
        }
        .lp-footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .lp-footer-col li {
          font-size: 0.82rem;
          color: #64748b;
        }
        .lp-footer-col a {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-footer-col a:hover { color: #4ade80; }
        .lp-footer-bottom {
          border-top: 1px solid #1e293b;
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .lp-footer-copy {
          font-size: 0.78rem;
          color: #475569;
        }
        .lp-footer-stack {
          background: #1e293b;
          border: 1px solid #334155;
          color: #4ade80;
          padding: 4px 14px;
          border-radius: 50px;
          font-size: 0.68rem;
          font-weight: 600;
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 1024px) {
          .lp-hero-inner { grid-template-columns: 1fr; gap: 44px; }
          .lp-hero-desc { max-width: 100%; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-features-bento { grid-template-columns: repeat(2, 1fr); }
          .lp-feat-wide { grid-column: span 1; }
          .lp-badges-grid { grid-template-columns: repeat(3, 1fr); }
          .lp-tech-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-waste-layout { grid-template-columns: 1fr; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
          .lp-steps-line { display: none; }
        }
        @media (max-width: 768px) {
          .lp-section { padding: 60px 0; }
          .lp-hero { padding: 56px 0; }
          .lp-nav-links, .lp-nav-sub, .lp-nav-divider { display: none !important; }
          .lp-hamburger { display: flex; }
          .lp-nav-cta { display: none; }
          .lp-steps { grid-template-columns: repeat(2, 1fr); }
          .lp-badges-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-tech-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
          .lp-footer-bottom { flex-direction: column; text-align: center; }
          .lp-hero-actions { gap: 10px; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .lp-waste-bar-row { grid-template-columns: 82px 1fr 48px; }
        }
        @media (max-width: 480px) {
          .lp-container { padding: 0 16px; }
          .lp-nav-inner { padding: 0 16px; }
          .lp-hero-inner { padding: 0 16px; }
          .lp-features-bento { grid-template-columns: 1fr; }
          .lp-steps { grid-template-columns: 1fr 1fr; gap: 16px; }
          .lp-badges-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .lp-tech-grid { grid-template-columns: 1fr; }
          .lp-footer-grid { grid-template-columns: 1fr; gap: 28px; }
          .lp-cta { padding: 60px 0; }
          .lp-stat-num { font-size: 1.8rem; }
          .lp-waste-bar-row { grid-template-columns: 72px 1fr 42px; gap: 8px; }
        }
        @media (max-width: 360px) {
          .lp-hero-title { font-size: 1.7rem; }
          .lp-badges-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="lp-root">

        {/* ══ NAVBAR ══════════════════════════════════════ */}
        <nav className={`lp-navbar${scrolled ? " lp-scrolled" : ""}`}>
          <div className="lp-nav-inner">
            <a href="#" className="lp-nav-logo">
              <Image src={sirkulaLogo} alt="Sirkula" width={36} height={36} className="lp-logo-img" />
              <div className="lp-nav-brand">
                <span className="lp-nav-eyebrow">Dinas Lingkungan Hidup</span>
                <span className="lp-nav-name">Sirkula</span>
              </div>
            </a>
            <div className="lp-nav-divider" />
            <div className="lp-nav-sub">
              <span className="lp-nav-sub-eyebrow">Kota Padang</span>
              <span className="lp-nav-sub-title">Bank Sampah Digital</span>
            </div>
            <ul className="lp-nav-links">
              <li><a href="#fitur">Fitur</a></li>
              <li><a href="#cara-kerja">Cara Kerja</a></li>
              <li><a href="#statistik">Statistik</a></li>
              <li><a href="#badge">Penghargaan</a></li>
              <li><a href="#teknologi">Teknologi</a></li>
            </ul>
            <Link href="/login" className="lp-nav-cta">
              Login Admin
            </Link>
            <button
              className={`lp-hamburger${mobileOpen ? " open" : ""}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
          <div className={`lp-mobile-menu${mobileOpen ? " open" : ""}`}>
            <a href="#fitur" onClick={() => setMobileOpen(false)}>Fitur</a>
            <a href="#cara-kerja" onClick={() => setMobileOpen(false)}>Cara Kerja</a>
            <a href="#statistik" onClick={() => setMobileOpen(false)}>Statistik</a>
            <a href="#badge" onClick={() => setMobileOpen(false)}>Penghargaan</a>
            <a href="#teknologi" onClick={() => setMobileOpen(false)}>Teknologi</a>
            <Link href="/login" className="lp-mobile-cta" onClick={() => setMobileOpen(false)}>
              Login Admin
            </Link>
          </div>
        </nav>

        {/* ══ HERO ════════════════════════════════════════ */}
        <section className="lp-hero" id="hero">
          <div className="lp-orbs">
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-orb lp-orb-3" />
          </div>
          <div className="lp-hero-inner">
            <div>
              <div className="lp-hero-badge">
                <span className="lp-pulse-dot" />
                Sistem Resmi Dinas Lingkungan Hidup Kota Padang
              </div>
              <h1 className="lp-hero-title">
                Platform Digital<br />
                <span className="lp-accent">Bank Sampah</span><br />
                Kota Padang
              </h1>
              <p className="lp-hero-desc">
                <strong>Sirkula</strong> adalah sistem informasi pengelolaan bank sampah digital
                yang dikembangkan untuk mendukung program Dinas Lingkungan Hidup Kota Padang —
                mengubah sampah menjadi nilai ekonomi nyata bagi masyarakat.
              </p>
              <div className="lp-hero-actions">
                <Link href="/login" className="lp-btn-primary">
                  Login Panel Admin
                </Link>
                <a href="#fitur" className="lp-btn-secondary">
                  Pelajari Sistem
                </a>
              </div>
              <div className="lp-hero-meta">
                <span className="lp-hero-meta-item">
                  <span className="lp-meta-dot" />
                  Dinas Lingkungan Hidup Kota Padang
                </span>
                <span className="lp-hero-meta-item">
                  <span className="lp-meta-dot" />
                  Mobile App & Web Admin
                </span>
                <span className="lp-hero-meta-item">
                  <span className="lp-meta-dot" />
                  Machine Learning
                </span>
              </div>
            </div>

            <div className="lp-hero-visual">
              <div className="lp-hero-card" ref={tiltRef}>
                <div className="lp-hero-card-label">Fitur Aplikasi Mobile</div>
                <div className="lp-app-features">
                  {[
                    "Setor Sampah Digital",
                    "Sistem Poin & Level",
                    "Misi & Gamifikasi",
                    "Tukar Reward",
                    "Riwayat Setoran",
                    "Koleksi Badge",
                    "Leaderboard",
                    "Notifikasi Real-time",
                  ].map((f) => (
                    <div className="lp-feature-chip" key={f}>{f}</div>
                  ))}
                </div>
                <div className="lp-hero-card-footer">
                  {["Flutter", "Next.js", "Python Flask", "ML Service"].map((s) => (
                    <div className="lp-stack-chip" key={s}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATISTIK ══════════════════════════════════ */}
        <section className="lp-section lp-section-alt" id="statistik">
          <div className="lp-container">
            <div className="lp-section-header">
              <div className="lp-tag lp-reveal">Data Real-time</div>
              <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                Statistik Pengelolaan Sampah<br />
                <span className="lp-accent">Kota Padang</span>
              </h2>
              <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
                Data aktual yang diambil langsung dari sistem — mencerminkan kondisi
                pengelolaan bank sampah digital saat ini.
              </p>
            </div>
            <div className="lp-stats-grid" ref={statsRef}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="lp-stat-card">
                    <div className="lp-skeleton" style={{ height: 48, width: "60%", margin: "0 auto 10px" }} />
                    <div className="lp-skeleton" style={{ height: 18, width: "50%", margin: "0 auto" }} />
                  </div>
                ))
              ) : (
                <>
                  <StatCard label="Total Anggota" value={stats?.total_members ?? 0} color="#16a34a" started={statsStarted} delay={0} />
                  <StatCard label="Sampah Terkelola" value={Math.round(stats?.total_weight_kg ?? 0)} suffix=" kg" color="#0891b2" started={statsStarted} delay={80} />
                  <StatCard label="Poin Terdistribusi" value={stats?.total_points_distributed ?? 0} color="#d97706" started={statsStarted} delay={160} />
                  <StatCard label="Reward Ditukar" value={stats?.total_redemptions ?? 0} color="#7c3aed" started={statsStarted} delay={240} />
                </>
              )}
            </div>
          </div>
        </section>

        {/* ══ FITUR ═══════════════════════════════════════ */}
        <section className="lp-section" id="fitur">
          <div className="lp-container">
            <div className="lp-section-header">
              <div className="lp-tag lp-reveal">Fitur Sistem</div>
              <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                Ekosistem Digital Lengkap<br />
                <span className="lp-accent">Bank Sampah Kota Padang</span>
              </h2>
              <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
                Dari aplikasi mobile untuk anggota hingga dashboard admin untuk dinas,
                semua terhubung dalam satu platform.
              </p>
            </div>
            <div className="lp-features-bento">
              {[
                {
                  wide: true, color: "#dcfce7", textColor: "#16a34a",
                  letter: "S",
                  title: "Sistem Setor Sampah Digital",
                  desc: "Anggota mengajukan setoran sampah dari aplikasi mobile. Pilih kategori (Plastik, Kertas, Logam, Kaca, Organik, Elektronik), masukkan berat estimasi, dan tunggu konfirmasi petugas bank sampah secara real-time.",
                  tags: ["6 Kategori Sampah", "Konfirmasi Real-time", "Riwayat Lengkap", "Status Tracking"],
                  delay: 0,
                },
                {
                  wide: false, color: "#fef3c7", textColor: "#d97706",
                  letter: "P",
                  title: "Sistem Poin & Reward",
                  desc: "Setiap kilogram sampah dikonversi menjadi poin sesuai tarif yang dikonfigurasi admin. Poin ditukar reward dari katalog.",
                  tags: ["Konversi Otomatis", "Reward Catalog"],
                  delay: 80,
                },
                {
                  wide: false, color: "#ede9fe", textColor: "#7c3aed",
                  letter: "G",
                  title: "Gamifikasi & Misi",
                  desc: "Misi harian & mingguan dengan bonus poin. Level-up dari Eco Beginner hingga Eco Champion dengan mengumpulkan badge.",
                  tags: ["Daily Missions", "Level System", "Badge Collection"],
                  delay: 160,
                },
                {
                  wide: false, color: "#fee2e2", textColor: "#dc2626",
                  letter: "M",
                  title: "Machine Learning Analytics",
                  desc: "Layanan ML terpisah menganalisis pola setoran untuk mendeteksi anomali dan memberikan skor risiko partisipasi otomatis.",
                  tags: ["Risk Scoring", "Anomaly Detection"],
                  delay: 240,
                },
                {
                  wide: true, color: "#f0f9ff", textColor: "#0891b2",
                  letter: "A",
                  title: "Panel Admin Dinas Lingkungan Hidup",
                  desc: "Dashboard komprehensif untuk pengelola: validasi setoran, manajemen anggota, konfigurasi reward & misi, monitoring risiko partisipasi, laporan statistik, dan ekspor data.",
                  tags: ["Dashboard KPI", "Validasi Setoran", "Manajemen Anggota", "Laporan & Export", "Risk Monitoring"],
                  delay: 320,
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className={`lp-feat lp-reveal${feat.wide ? " lp-feat-wide" : ""}`}
                  style={{ transitionDelay: `${feat.delay}ms` }}
                  ref={tiltRef}
                >
                  <div className="lp-feat-accent" style={{ background: feat.color }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: feat.textColor }}>{feat.letter}</span>
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                  <div className="lp-feat-tags">
                    {feat.tags.map((t) => (
                      <span className="lp-feat-tag" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CARA KERJA ══════════════════════════════════ */}
        <section className="lp-section lp-section-alt" id="cara-kerja">
          <div className="lp-container">
            <div className="lp-section-header">
              <div className="lp-tag lp-reveal">Cara Kerja</div>
              <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                Setor Sampah dalam<br />
                <span className="lp-accent">4 Langkah Mudah</span>
              </h2>
            </div>
            <div className="lp-steps-wrap">
              <div className="lp-steps-line" />
              <div className="lp-steps">
                {[
                  { num: "01", title: "Daftar & Login", desc: "Buat akun anggota di aplikasi Sirkula. Isi profil lengkap untuk mulai menggunakan layanan bank sampah digital.", delay: 0 },
                  { num: "02", title: "Ajukan Setoran", desc: "Pilih kategori sampah, masukkan estimasi berat, dan kirim permintaan. Petugas menerima notifikasi otomatis.", delay: 100 },
                  { num: "03", title: "Konfirmasi Admin", desc: "Petugas DLH memverifikasi dan menimbang sampah. Poin otomatis dikreditkan setelah validasi selesai.", delay: 200 },
                  { num: "04", title: "Tukar Reward", desc: "Gunakan poin terkumpul untuk menukar reward menarik dari katalog yang disediakan bank sampah.", delay: 300 },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="lp-step lp-reveal"
                    style={{ transitionDelay: `${step.delay}ms` }}
                  >
                    <div className="lp-step-circle">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SAMPAH BREAKDOWN ════════════════════════════ */}
        {!loading && waste.length > 0 && (
          <section className="lp-section" id="sampah">
            <div className="lp-container">
              <div className="lp-section-header">
                <div className="lp-tag lp-reveal">Distribusi Sampah</div>
                <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                  Komposisi Sampah<br />
                  <span className="lp-accent">yang Berhasil Dikelola</span>
                </h2>
                <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
                  Data dari seluruh setoran tervalidasi dalam sistem Sirkula.
                </p>
              </div>
              <div className="lp-waste-layout" ref={wasteRef}>
                <div>
                  <p className="lp-waste-heading">Distribusi Berat per Kategori</p>
                  <div className="lp-waste-bars">
                    {sortedWaste.map((w, i) => {
                      const pct = totalWasteWeight > 0 ? (w.total_weight_kg / totalWasteWeight) * 100 : 0;
                      const color = WASTE_COLORS[w.waste_type] ?? WASTE_COLORS.default;
                      return (
                        <div className="lp-waste-bar-row lp-reveal" key={w.waste_type} style={{ transitionDelay: `${i * 80}ms` }}>
                          <div className="lp-waste-bar-label">
                            <span className="lp-waste-bar-dot" style={{ background: color }} />
                            {w.label}
                          </div>
                          <div className="lp-waste-track">
                            <div
                              className="lp-waste-fill"
                              style={{
                                width: wasteBarsStarted ? `${pct}%` : "0%",
                                background: color,
                                transitionDelay: `${i * 120}ms`,
                              }}
                            />
                          </div>
                          <span className="lp-waste-pct">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lp-waste-table-card lp-reveal" style={{ transitionDelay: "200ms" }}>
                  <div className="lp-waste-table-head">
                    <span>Kategori</span>
                    <span style={{ textAlign: "right" }}>Berat</span>
                    <span style={{ textAlign: "right" }}>Setor</span>
                  </div>
                  {sortedWaste.map((w) => {
                    const color = WASTE_COLORS[w.waste_type] ?? WASTE_COLORS.default;
                    return (
                      <div className="lp-waste-table-row" key={w.waste_type}>
                        <div className="lp-waste-row-name">
                          <span className="lp-waste-row-dot" style={{ background: color }} />
                          {w.label}
                        </div>
                        <div className="lp-waste-row-kg">
                          {w.total_weight_kg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg
                        </div>
                        <div className="lp-waste-row-count">{w.deposit_count.toLocaleString("id-ID")}x</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ BADGE ═══════════════════════════════════════ */}
        {!loading && badges.length > 0 && (
          <section className="lp-section lp-section-alt" id="badge">
            <div className="lp-container">
              <div className="lp-section-header">
                <div className="lp-tag lp-reveal">Sistem Penghargaan</div>
                <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                  Badge untuk<br />
                  <span className="lp-accent">Anggota Berprestasi</span>
                </h2>
                <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
                  Badge diberikan otomatis sebagai apresiasi atas kontribusi nyata anggota
                  dalam pengelolaan sampah Kota Padang.
                </p>
              </div>
              <div className="lp-badges-grid">
                {badges.map((badge, i) => {
                  const condLabel =
                    badge.condition_type === "deposit_count"
                      ? `${badge.condition_value} setoran`
                      : badge.condition_type === "total_weight"
                      ? `${badge.condition_value} kg sampah`
                      : `${badge.condition_value.toLocaleString("id-ID")} poin`;
                  return (
                    <div
                      key={badge.id}
                      className="lp-badge-card lp-reveal"
                      style={{ transitionDelay: `${i * 60}ms` }}
                    >
                      <div className="lp-badge-icon-wrap">
                        {badge.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={badge.icon_url} alt={badge.name} style={{ width: 32, height: 32, objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "1.5rem" }}>
                            {badge.condition_type === "deposit_count" ? "📦" : badge.condition_type === "total_weight" ? "⚖️" : "⭐"}
                          </span>
                        )}
                      </div>
                      <div className="lp-badge-name">{badge.name}</div>
                      <div className="lp-badge-desc">
                        {badge.description || `Raih dengan ${condLabel}`}
                      </div>
                      {badge.earned_count > 0 && (
                        <span className="lp-badge-earned">
                          {badge.earned_count.toLocaleString("id-ID")} anggota
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══ TEKNOLOGI ═══════════════════════════════════ */}
        <section className="lp-section" id="teknologi">
          <div className="lp-container">
            <div className="lp-section-header">
              <div className="lp-tag lp-reveal">Stack Teknologi</div>
              <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
                Dibangun dengan<br />
                <span className="lp-accent">Teknologi Modern</span>
              </h2>
              <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
                Sistem full-stack terintegrasi: mobile app, web admin, REST API, dan machine learning
                dalam satu platform yang terhubung.
              </p>
            </div>
            <div className="lp-tech-grid">
              {[
                {
                  bg: "#dbeafe", iconColor: "#1d4ed8", letter: "M",
                  title: "Mobile App",
                  desc: "Aplikasi Android & iOS dengan Flutter dan Material Design 3. State management Provider, navigasi GoRouter.",
                  chips: [{ label: "Flutter", color: "#0288d1" }, { label: "Dart", color: "#00B4AB" }, { label: "Provider", color: "#16a34a" }],
                  accent: "#0288d1",
                },
                {
                  bg: "#f0fdf4", iconColor: "#15803d", letter: "A",
                  title: "Admin Panel",
                  desc: "Dashboard web admin Next.js 14 App Router dengan Tailwind CSS. Responsif, real-time, TypeScript.",
                  chips: [{ label: "Next.js", color: "#111" }, { label: "TypeScript", color: "#3178C6" }, { label: "Tailwind", color: "#06B6D4" }],
                  accent: "#16a34a",
                },
                {
                  bg: "#fff7ed", iconColor: "#c2410c", letter: "B",
                  title: "REST API",
                  desc: "Backend Python Flask dengan JWT Auth, SQLAlchemy ORM, migrasi Alembic, dan Docker deployment.",
                  chips: [{ label: "Python", color: "#3776AB" }, { label: "Flask", color: "#555" }, { label: "JWT", color: "#d97706" }],
                  accent: "#ea580c",
                },
                {
                  bg: "#faf5ff", iconColor: "#6d28d9", letter: "L",
                  title: "ML Service",
                  desc: "Layanan machine learning terpisah untuk analisis pola, deteksi anomali, dan scoring risiko partisipasi.",
                  chips: [{ label: "Python ML", color: "#dc2626" }, { label: "Risk Analysis", color: "#7c3aed" }],
                  accent: "#7c3aed",
                },
              ].map((tech, i) => (
                <div
                  key={tech.title}
                  className="lp-tech-card lp-reveal"
                  style={{
                    transitionDelay: `${i * 80}ms`,
                    ["--tech-accent" as string]: tech.accent,
                  } as React.CSSProperties}
                  ref={tiltRef}
                >
                  <style>{`.lp-tech-card:nth-child(${i + 1})::before { background: ${tech.accent}; }`}</style>
                  <div className="lp-tech-icon" style={{ background: tech.bg, color: tech.iconColor }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800 }}>{tech.letter}</span>
                  </div>
                  <h3>{tech.title}</h3>
                  <p>{tech.desc}</p>
                  <div className="lp-chips">
                    {tech.chips.map((c) => (
                      <span
                        key={c.label}
                        className="lp-chip"
                        style={{ color: c.color, borderColor: c.color + "40", background: c.color + "0d" }}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ═════════════════════════════════════════ */}
        <section className="lp-cta" id="admin-login">
          <div className="lp-cta-orb1" />
          <div className="lp-cta-orb2" />
          <div className="lp-cta-inner">
            <div className="lp-cta-tag lp-reveal">Panel Administrasi</div>
            <h2 className="lp-reveal" style={{ transitionDelay: "80ms" }}>
              Kelola Bank Sampah<br />Kota Padang Lebih Efisien
            </h2>
            <p className="lp-reveal" style={{ transitionDelay: "160ms" }}>
              Akses dashboard admin untuk memantau setoran sampah, mengelola anggota,
              mengkonfigurasi reward & misi, dan melihat laporan statistik secara real-time.
            </p>
            <div className="lp-cta-actions lp-reveal" style={{ transitionDelay: "240ms" }}>
              <Link href="/login" className="lp-cta-btn-white">
                Login Panel Admin
              </Link>
              <a href="#statistik" className="lp-cta-btn-ghost">
                Lihat Statistik
              </a>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════ */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div>
                <div className="lp-footer-brand-row">
                  <Image src={sirkulaLogo} alt="Sirkula" width={28} height={28} style={{ borderRadius: 8 }} />
                  <span className="lp-footer-brand-name">Sirkula</span>
                </div>
                <p className="lp-footer-gov-label">Dinas Lingkungan Hidup Kota Padang</p>
                <p className="lp-footer-brand-desc">
                  Platform digital bank sampah resmi yang mendukung program pengelolaan
                  lingkungan hidup Kota Padang — mengubah sampah menjadi nilai ekonomi
                  bagi masyarakat melalui teknologi modern.
                </p>
              </div>
              <div className="lp-footer-col">
                <h4>Fitur</h4>
                <ul>
                  <li><a href="#fitur">Setor Sampah Digital</a></li>
                  <li><a href="#fitur">Sistem Poin & Reward</a></li>
                  <li><a href="#fitur">Misi & Gamifikasi</a></li>
                  <li><a href="#badge">Badge & Penghargaan</a></li>
                  <li><a href="#teknologi">ML Analytics</a></li>
                </ul>
              </div>
              <div className="lp-footer-col">
                <h4>Teknologi</h4>
                <ul>
                  <li>Flutter Mobile App</li>
                  <li>Next.js Admin Panel</li>
                  <li>Python Flask API</li>
                  <li>Machine Learning</li>
                  <li>Docker Deployment</li>
                </ul>
              </div>
              <div className="lp-footer-col">
                <h4>Kategori Sampah</h4>
                <ul>
                  <li>Plastik</li>
                  <li>Kertas</li>
                  <li>Logam</li>
                  <li>Kaca</li>
                  <li>Organik</li>
                  <li>Elektronik</li>
                </ul>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <p className="lp-footer-copy">
                © 2025 Sirkula — Dinas Lingkungan Hidup Kota Padang. Hak cipta dilindungi.
              </p>
              <span className="lp-footer-stack">Flutter · Next.js · Python · Machine Learning</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
