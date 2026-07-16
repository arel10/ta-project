"use client";
// Force Dev Reload
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import sirkulaLogo from "@/../assets/img/Sirkula.png";
import "./landing.css";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!started || target === 0 || !mounted) return;
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
  }, [target, duration, started, mounted]);

  return mounted ? count : 0;
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
      <div className="lp-stat-num" style={{ color }} suppressHydrationWarning>
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!mounted) return;
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
  }, [loading, mounted]);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
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
            <span className="lp-nav-sub-eyebrow">Sistem Informasi</span>
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

          <div className="lp-hero-visual lp-reveal-right">
            <div className="lp-dual-device-container" ref={tiltRef}>

              {/* Web Admin Mockup (Background) */}
              <div className="lp-web-mockup">
                <div className="lp-web-header">
                  <div className="lp-web-dots"><span /><span /><span /></div>
                  <div className="lp-web-title">Sirkula Dinas Lingkungan Hidup Kota Padang</div>
                </div>
                <div className="lp-web-body">
                  <div className="lp-web-sidebar">
                    <span className="active" />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="lp-web-content">
                    <div className="lp-web-kpi-grid">
                      <div className="lp-web-kpi">
                        <span className="label">Total Sampah</span>
                        <span className="val">8,540 kg</span>
                      </div>
                      <div className="lp-web-kpi">
                        <span className="label">Pengguna Aktif</span>
                        <span className="val">1,240 Nasabah</span>
                      </div>
                    </div>
                    <div className="lp-web-chart-card">
                      <div className="lp-web-chart-title">Grafik Setoran Sampah</div>
                      <svg className="lp-web-svg-chart" viewBox="0 0 200 60">
                        <path d="M10,50 Q40,20 70,35 T130,15 T190,10" fill="none" stroke="#1B6A28" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10,50 Q40,20 70,35 T130,15 T190,10 L190,55 L10,55 Z" fill="url(#chartGradWeb)" opacity="0.15" />
                        <defs>
                          <linearGradient id="chartGradWeb" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1B6A28" />
                            <stop offset="100%" stopColor="#1B6A28" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Mockup (Foreground) */}
              <div className="lp-phone-wrapper">
                <div className="lp-phone-glow" />
                <svg className="lp-phone-mockup" viewBox="0 0 320 640" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="headerGrad" x1="0" y1="0" x2="300" y2="130" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1B6A28" />
                      <stop offset="100%" stopColor="#13421A" />
                    </linearGradient>
                    <clipPath id="screenClip">
                      <rect x="20" y="20" width="280" height="600" rx="33" />
                    </clipPath>
                  </defs>

                  <rect x="10" y="10" width="300" height="620" rx="40" fill="#1A1A1A" stroke="#E5E7EB" strokeWidth="2" />
                  <rect x="18" y="18" width="284" height="604" rx="35" fill="#E2E8F0" />
                  <rect x="20" y="20" width="280" height="600" rx="33" fill="#F5F9F3" />

                  {/* Clipped Screen Content */}
                  <g clipPath="url(#screenClip)">
                    <text x="35" y="40" fill="#6B7280" fontSize="9" fontFamily="Poppins">9:41</text>
                    <text x="255" y="40" fill="#6B7280" fontSize="8" fontFamily="Poppins">●●●</text>
                    <rect x="20" y="55" width="280" height="130" rx="0" fill="url(#headerGrad)" />
                    <text x="45" y="85" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Poppins">Selamat datang, Budi 👋</text>
                    <text x="45" y="108" fill="white" fontSize="20" fontWeight="bold" fontFamily="Poppins">2,450 pts</text>
                    <rect x="45" y="118" width="120" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
                    <rect x="45" y="118" width="80" height="6" rx="3" fill="#86EFAC" />
                    <text x="45" y="143" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="Poppins">80% menuju level berikutnya</text>
                    <ellipse cx="265" cy="90" rx="35" ry="35" fill="rgba(255,255,255,0.05)" />
                    <ellipse cx="275" cy="100" rx="25" ry="25" fill="rgba(255,255,255,0.05)" />
                    <text x="35" y="210" fill="#13421A" fontSize="10" fontFamily="Poppins" fontWeight="600">AKSI CEPAT</text>

                    <rect x="30" y="218" width="58" height="60" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="59" y="254" fill="#4CAF50" fontSize="22" textAnchor="middle">♻</text>
                    <text x="59" y="272" fill="#6B7280" fontSize="7" fontFamily="Poppins" textAnchor="middle">Setor</text>

                    <rect x="98" y="218" width="58" height="60" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="127" y="254" fill="#FFD700" fontSize="22" textAnchor="middle">🎁</text>
                    <text x="127" y="272" fill="#6B7280" fontSize="7" fontFamily="Poppins" textAnchor="middle">Reward</text>

                    <rect x="166" y="218" width="58" height="60" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="195" y="254" fill="#3A9BD5" fontSize="22" textAnchor="middle">🏆</text>
                    <text x="195" y="272" fill="#6B7280" fontSize="7" fontFamily="Poppins" textAnchor="middle">Misi</text>

                    <rect x="234" y="218" width="58" height="60" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="263" y="254" fill="#EF9A9A" fontSize="22" textAnchor="middle">📊</text>
                    <text x="263" y="272" fill="#6B7280" fontSize="7" fontFamily="Poppins" textAnchor="middle">Riwayat</text>

                    <text x="35" y="308" fill="#13421A" fontSize="10" fontFamily="Poppins" fontWeight="600">MISI AKTIF</text>

                    <rect x="30" y="316" width="260" height="55" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="50" y="336" fill="#1A1A1A" fontSize="9" fontFamily="Poppins" fontWeight="600">Setor Plastik 5 kg</text>
                    <text x="50" y="350" fill="#6B7280" fontSize="8" fontFamily="Poppins">3.2 / 5 kg tercapai</text>
                    <rect x="50" y="356" width="160" height="5" rx="3" fill="#F3F4F6" />
                    <rect x="50" y="356" width="102" height="5" rx="3" fill="#1B6A28" />
                    <text x="260" y="347" fill="#F59E0B" fontSize="8" fontFamily="Poppins" textAnchor="end">+500 pts</text>

                    <rect x="30" y="378" width="260" height="55" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="50" y="398" fill="#1A1A1A" fontSize="9" fontFamily="Poppins" fontWeight="600">Setor 3 Hari Berturut</text>
                    <text x="50" y="412" fill="#6B7280" fontSize="8" fontFamily="Poppins">2 / 3 hari selesai</text>
                    <rect x="50" y="418" width="160" height="5" rx="3" fill="#F3F4F6" />
                    <rect x="50" y="418" width="107" height="5" rx="3" fill="#3A9BD5" />
                    <text x="260" y="409" fill="#F59E0B" fontSize="8" fontFamily="Poppins" text-anchor="end">+300 pts</text>

                    <text x="35" y="460" fill="#13421A" fontSize="10" fontFamily="Poppins" fontWeight="600">LEADERBOARD</text>

                    <rect x="30" y="468" width="260" height="75" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="50" y="487" fill="#D97706" fontSize="12" fontWeight="bold">1st</text>
                    <text x="75" y="487" fill="#1A1A1A" fontSize="9" fontFamily="Poppins">Andi Pratama</text>
                    <text x="260" y="487" fill="#1B6A28" fontSize="9" fontFamily="Poppins" textAnchor="end">12,800 pts</text>

                    <text x="50" y="504" fill="#64748B" fontSize="12" fontWeight="bold">2nd</text>
                    <text x="75" y="504" fill="#1A1A1A" fontSize="9" fontFamily="Poppins">Budi Santoso</text>
                    <text x="260" y="504" fill="#1B6A28" fontSize="9" fontFamily="Poppins" textAnchor="end">11,200 pts</text>

                    <text x="50" y="521" fill="#B45309" fontSize="12" fontWeight="bold">3rd</text>
                    <text x="75" y="521" fill="#1A1A1A" fontSize="9" fontFamily="Poppins">Citra Dewi</text>
                    <text x="260" y="521" fill="#1B6A28" fontSize="9" fontFamily="Poppins" textAnchor="end">9,500 pts</text>

                    <rect x="20" y="575" width="280" height="45" rx="0" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <text x="70" y="603" fill="#1B6A28" fontSize="18" textAnchor="middle" fontWeight="bold">Beranda</text>
                    <text x="127" y="603" fill="#9CA3AF" fontSize="18" textAnchor="middle">Setor</text>
                    <text x="195" y="603" fill="#9CA3AF" fontSize="18" textAnchor="middle">Reward</text>
                    <text x="253" y="603" fill="#9CA3AF" fontSize="18" textAnchor="middle">Profil</text>
                  </g>

                  <rect x="110" y="22" width="100" height="24" rx="12" fill="#1A1A1A" />
                </svg>
              </div>

              {/* Floating Cards */}
              <div className="lp-float-card lp-float-card-1">
                <span className="lp-float-icon">♻️</span>
                <div>
                  <div className="lp-float-title">Plastik Disetor</div>
                  <div className="lp-float-val">+2.5 kg · +125 pts</div>
                </div>
              </div>
              <div className="lp-float-card lp-float-card-2">
                <span className="lp-float-icon">🏅</span>
                <div>
                  <div className="lp-float-title">Badge Diraih!</div>
                  <div className="lp-float-val">Bronze</div>
                </div>
              </div>
              <div className="lp-float-card lp-float-card-3">
                <span className="lp-float-icon">🤖</span>
                <div>
                  <div className="lp-float-title">AI Analisis</div>
                  <div className="lp-float-val">Risiko Rendah ✓</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══ STATISTIK ══════════════════════════════════ */}
      <section className="lp-section lp-section-alt" id="statistik">
        <div className="lp-container">
          <div className="lp-section-header">
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
                wide: false, color: "#e0f2fe", textColor: "#0369a1",
                letter: "M",
                title: "Misi & Gamifikasi",
                desc: "Tingkatkan partisipasi dengan misi mingguan interaktif. Dapatkan poin tambahan dan naikkan level keanggotaan Anda.",
                tags: ["Misi Interaktif", "Sistem Level"],
                delay: 160,
              },
              {
                wide: true, color: "#f3e8ff", textColor: "#6b21a8",
                letter: "A",
                title: "Panel Admin Dinas Lingkungan Hidup",
                desc: "Dashboard komprehensif untuk pengelola: validasi setoran, manajemen anggota, konfigurasi reward & misi, monitoring risiko partisipasi, laporan statistik, dan ekspor data.",
                tags: ["Dashboard KPI", "Validasi Setoran", "Manajemen Anggota", "Laporan & Export", "Risk Monitoring"],
                delay: 240,
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`lp-feat lp-reveal${f.wide ? " lp-feat-wide" : ""}`}
                style={{ transitionDelay: `${f.delay}ms` }}
              >
                <div className="lp-feat-accent" style={{ background: f.color, color: f.textColor }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800 }}>{f.letter}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="lp-feat-tags">
                  {f.tags.map((t) => <span className="lp-feat-tag" key={t}>{t}</span>)}
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
            <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
              Alur partisipasi masyarakat mulai dari pendaftaran hingga memperoleh poin ekonomi.
            </p>
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
                      <div className="lp-waste-row-kg" suppressHydrationWarning>
                        {w.total_weight_kg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg
                      </div>
                      <div className="lp-waste-row-count" suppressHydrationWarning>{w.deposit_count.toLocaleString("id-ID")}x</div>
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
                      <span className="lp-badge-earned" suppressHydrationWarning>
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

      {/* ══ INFORMASI OPERASIONAL & KETENTUAN ════════════ */}
      <section className="lp-section lp-section-alt" id="informasi">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-tag lp-reveal">Informasi Layanan</div>
            <h2 className="lp-section-title lp-reveal" style={{ transitionDelay: "80ms" }}>
              Lokasi, Operasional &<br />
              <span className="lp-accent">Ketentuan Penyetoran</span>
            </h2>
            <p className="lp-section-desc lp-reveal" style={{ transitionDelay: "160ms" }}>
              Panduan resmi bagi warga Kota Padang untuk menyetorkan sampah dan layanan kontak dinas.
            </p>
          </div>

          <div className="lp-features-bento">
            <div className="lp-feat lp-reveal" style={{ transitionDelay: "0ms" }}>
              <div className="lp-feat-accent bg-blue-50 text-blue-600">
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>L</span>
              </div>
              <h3>Lokasi & Kontak</h3>
              <p>
                <strong>Dinas Lingkungan Hidup Kota Padang</strong><br />
                Jl. Bypass Km. 12, Sungai Sapih, Kec. Kuranji, Kota Padang, Sumatera Barat.
              </p>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-slate-100">
                <p>📞 Telpon: (0751) 461315</p>
                <p>✉️ Email: dlh@padang.go.id</p>
              </div>
            </div>

            <div className="lp-feat lp-reveal" style={{ transitionDelay: "100ms" }}>
              <div className="lp-feat-accent bg-amber-50 text-amber-600">
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>O</span>
              </div>
              <h3>Jam Operasional</h3>
              <p>
                Jadwal pelayanan penimbangan dan serah-terima sampah di Bank Sampah DLH Kota Padang:
              </p>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-slate-100">
                <p>🗓️ Senin - Jumat: 08:00 - 15:00 WIB</p>
                <p>🗓️ Sabtu: 08:00 - 12:00 WIB</p>
                <p>❌ Minggu & Libur Nasional: Tutup</p>
              </div>
            </div>

            <div className="lp-feat lp-reveal" style={{ transitionDelay: "200ms" }}>
              <div className="lp-feat-accent bg-green-50 text-green-600">
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>K</span>
              </div>
              <h3>Ketentuan Penyetoran</h3>
              <p>
                Syarat agar setoran sampah disetujui dan memperoleh poin maksimal:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 pt-2 border-t border-slate-100">
                <li>Sampah sudah dipilah sesuai kategori (Plastik, Kertas, dll).</li>
                <li>Kondisi sampah dalam keadaan bersih dan kering.</li>
                <li>Berat minimum setoran langsung adalah 1 kg.</li>
              </ul>
            </div>
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
  );
}
