import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return formatDate(d);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getWasteTypeLabel(type: string): string {
  const normalized = (type || "").toLowerCase();
  const labels: Record<string, string> = {
    plastik: "Plastik PET",
    kertas: "Kertas/Kardus",
    logam: "Logam/Kaleng",
    kaca: "Kaca",
    organik: "Organik",
    elektronik: "Elektronik",
    p1: "P1 - Gelas Air Mineral Bersih",
    p2: "P2 - Gelas Air",
    p3: "P3 - 600mL & 1 L Bersih",
    p4: "P4 - 600mL & 1 L Kotor",
    p5: "P5 - Pet Berwarna",
    p6: "P6 - Monte",
    p7: "P7 - Botol",
    p8: "P8 - Ember/Karah",
    p9: "P9 - Mix",
    k1: "K1 - Kardus",
    k2: "K2 - HVS Berlem",
    k3: "K3 - HVS Tidak Berlem",
    k4: "K4 - Koran",
    k5: "K5 - Mix",
    k6: "K6 - Karton Telur",
    b1: "B1 - Kaleng Keras",
    b2: "B2 - Besi Kropos",
    b3: "B3 - Seng",
    l1: "L1 - Kaleng Lunak",
    mj: "MJ - Minyak Jelantah",
  };
  return labels[normalized] || type;
}

export function getWasteCategory(type: string): "organik" | "anorganik" | "b3" {
  const normalized = (type || "").toLowerCase();
  if (normalized === "organik") return "organik";
  if (normalized === "elektronik") return "b3";
  if (normalized.startsWith("p") || normalized.startsWith("k") || normalized.startsWith("b") || normalized.startsWith("l") || normalized === "mj") {
    return "anorganik";
  }
  return "anorganik";
}
