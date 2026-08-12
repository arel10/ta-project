"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, Users, AlertTriangle,
  Trophy, Gift, Settings, ChevronLeft, ChevronRight,
  BookOpen, X, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuideStep {
  icon: React.ElementType;
  title: string;
  description: string;
  details: { text: string; tip?: string }[];
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
}

const guideSteps: GuideStep[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Halaman utama yang menampilkan ringkasan data pengelolaan Bank Sampah secara real-time. Semua informasi penting tersaji dalam satu pandangan.",
    details: [
      { text: "Lihat total anggota, setoran hari ini, dan anggota potensi churn", tip: "Data ter-update otomatis setiap 5 menit" },
      { text: "Grafik tren berat setoran tervalidasi 6 bulan terakhir" },
      { text: "Distribusi prediksi churn dalam bentuk pie chart" },
      { text: "Tabel setoran pending yang perlu segera divalidasi" },
      { text: "Daftar anggota potensi churn yang butuh intervensi" },
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    accentColor: "bg-blue-600",
  },
  {
    icon: CheckSquare,
    title: "Validasi Setoran",
    description: "Kelola dan validasi setoran sampah dari anggota. Setiap setoran yang masuk perlu diverifikasi sebelum poin diberikan kepada anggota.",
    details: [
      { text: "Lihat daftar setoran yang masuk beserta bukti foto" },
      { text: "Approve atau reject setoran dengan komentar", tip: "Berikan alasan yang jelas jika menolak setoran" },
      { text: "Filter setoran berdasarkan status: pending, approved, atau rejected" },
      { text: "Poin dihitung otomatis berdasarkan berat dan jenis sampah" },
      { text: "Riwayat semua setoran yang sudah diproses tersimpan lengkap" },
    ],
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    accentColor: "bg-emerald-600",
  },
  {
    icon: Users,
    title: "Anggota",
    description: "Kelola data seluruh anggota Bank Sampah yang terdaftar. Monitor aktivitas dan perkembangan setiap anggota.",
    details: [
      { text: "Lihat daftar semua anggota beserta data profil lengkap" },
      { text: "Cari anggota berdasarkan nama atau nomor rekening" },
      { text: "Lihat detail saldo poin dan riwayat setoran per anggota" },
      { text: "Monitor aktivitas dan tingkat keaktifan anggota" },
    ],
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    accentColor: "bg-violet-600",
  },
  {
    icon: AlertTriangle,
    title: "Analisis Churn",
    description: "Monitor potensi churn anggota dalam 60 hari ke depan menggunakan model Random Forest ML. Identifikasi anggota yang berpotensi berhenti menabung lebih awal.",
    details: [
      { text: "Prediksi otomatis status: Potensi Churn & Aktif (Tidak Churn)" },
      { text: "Prediksi ML berbasis 8 fitur perilaku & interval setoran", tip: "Model dilatih ulang secara berkala untuk akurasi terbaik" },
      { text: "Filter dan sortir anggota berdasarkan status churn" },
      { text: "Identifikasi dini anggota yang berpotensi berhenti menabung dalam 60 hari" },
      { text: "Rekomendasi tindakan pencegahan & intervensi khusus anggota churn" },
    ],
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accentColor: "bg-rose-600",
  },
  {
    icon: Trophy,
    title: "Misi & Gamifikasi",
    description: "Buat dan kelola misi tantangan untuk meningkatkan partisipasi dan motivasi anggota dalam pengelolaan sampah.",
    details: [
      { text: "Buat misi baru dengan target jumlah setoran atau berat sampah" },
      { text: "Atur periode misi: harian atau mingguan" },
      { text: "Targetkan misi ke kelompok risiko tertentu", tip: "Contoh: misi khusus untuk mendorong anggota High Risk" },
      { text: "Filter misi berdasarkan jenis sampah tertentu" },
      { text: "Atur deadline dan poin reward untuk setiap misi" },
      { text: "Aktifkan atau nonaktifkan misi kapan saja" },
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    accentColor: "bg-amber-600",
  },
  {
    icon: Gift,
    title: "Katalog Reward",
    description: "Kelola hadiah yang bisa ditukar anggota dengan poin mereka. Proses penukaran langsung dari panel admin.",
    details: [
      { text: "Tambah reward baru lengkap dengan gambar, harga poin, dan stok" },
      { text: "Edit atau nonaktifkan reward yang sudah ada" },
      { text: "Proses penukaran: setujui atau tolak dengan kode verifikasi", tip: "Minta anggota menunjukkan kode saat mengambil reward" },
      { text: "Peringatan otomatis saat stok reward menipis (di bawah 5 unit)" },
      { text: "Lihat riwayat lengkap semua penukaran reward" },
    ],
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    accentColor: "bg-pink-600",
  },
  {
    icon: Settings,
    title: "Pengaturan",
    description: "Konfigurasi seluruh aspek sistem Bank Sampah sesuai kebutuhan operasional.",
    details: [
      { text: "Pengaturan Umum — informasi dasar bank sampah" },
      { text: "Pengaturan Sampah — kelola jenis sampah yang diterima" },
      { text: "Pengaturan Poin — atur rate konversi berat ke poin per jenis sampah", tip: "Pastikan rate poin selalu ter-update agar perhitungan akurat" },
      { text: "Pengaturan Data — kelola dan sinkronisasi data sistem" },
    ],
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    accentColor: "bg-slate-600",
  },
];

interface AdminGuideProps {
  open: boolean;
  onClose: () => void;
}

export function AdminGuide({ open, onClose }: AdminGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const step = guideSteps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === guideSteps.length - 1;

  const goToStep = useCallback((target: number) => {
    if (target === currentStep || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(target);
      setAnimating(false);
    }, 120);
  }, [currentStep, animating]);

  const handlePrev = () => goToStep(Math.max(0, currentStep - 1));
  const handleNext = () => goToStep(Math.min(guideSteps.length - 1, currentStep + 1));
  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStep, animating]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-[680px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
          style={{ maxHeight: "min(90vh, 660px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-green-700 to-green-600 px-5 sm:px-6 py-4 text-white">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/15 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <BookOpen className="h-4 w-4 opacity-80 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold leading-tight">Panduan Admin</h2>
                <p className="text-green-200 text-xs">Bank Sampah Management System</p>
              </div>
            </div>

            {/* Progress segments */}
            <div className="flex gap-1">
              {guideSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300 cursor-pointer",
                    i === currentStep
                      ? "bg-white flex-[2]"
                      : i < currentStep
                        ? "bg-white/50 flex-1 hover:bg-white/70"
                        : "bg-white/20 flex-1 hover:bg-white/35"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tab bar — icon only on mobile, icon + label on desktop */}
          <div
            className="shrink-0 border-b bg-gray-50 px-2 sm:px-3 py-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex gap-0.5 sm:gap-1 min-w-max">
              {guideSteps.map((s, i) => {
                const TabIcon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap",
                      i === currentStep
                        ? `${s.bgColor} ${s.color} ${s.borderColor} border`
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <TabIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
            <div
              className={cn(
                "transition-all duration-120 ease-out",
                animating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
              )}
            >
              {/* Step label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                  {currentStep + 1} / {guideSteps.length}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded border",
                  step.bgColor, step.color, step.borderColor
                )}>
                  {step.title}
                </span>
              </div>

              {/* Icon + Title + Description */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn("p-2 rounded-lg border shrink-0", step.bgColor, step.borderColor)}>
                  <Icon className={cn("h-5 w-5", step.color)} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Section label */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Fitur yang tersedia
              </p>

              {/* Detail items */}
              <div className="space-y-1">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className={cn(
                      "mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 text-white text-[9px] font-bold",
                      step.accentColor
                    )}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">{detail.text}</p>
                      {detail.tip && (
                        <div className="flex items-start gap-1 mt-0.5">
                          <Info className="h-2.5 w-2.5 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-gray-400 leading-relaxed">{detail.tip}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t bg-gray-50/60 px-5 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirst}
                className="h-8 px-3 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </Button>

              {/* Keyboard hint — desktop only */}
              <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-white rounded border text-[9px] font-mono">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border text-[9px] font-mono">→</kbd>
                <span className="ml-0.5">navigasi</span>
                <span className="mx-1.5 text-gray-200">|</span>
                <kbd className="px-1.5 py-0.5 bg-white rounded border text-[9px] font-mono">Esc</kbd>
                <span className="ml-0.5">tutup</span>
              </div>

              {/* Dots — mobile/tablet */}
              <div className="flex md:hidden gap-1 items-center">
                {guideSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === currentStep
                        ? "w-4 h-1.5 bg-green-600"
                        : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>

              {isLast ? (
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  Selesai
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                >
                  Selanjutnya
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
