"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  LayoutDashboard, CheckSquare, Users, AlertTriangle,
  Trophy, Gift, LogOut, Menu, Settings, Recycle, Medal, Database,
} from "lucide-react";
import type { User } from "@/types";
import { useState } from "react";

const navGroups = [
  {
    title: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operasional",
    items: [
      { label: "Validasi Setoran", href: "/dashboard/deposits", icon: CheckSquare },
      { label: "Anggota", href: "/dashboard/members", icon: Users },
      { label: "Analisis Risiko", href: "/dashboard/risk", icon: AlertTriangle },
    ],
  },
  {
    title: "Program",
    items: [
      { label: "Misi & Gamifikasi", href: "/dashboard/missions", icon: Trophy },
      { label: "Katalog Reward", href: "/dashboard/rewards", icon: Gift },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { label: "Pengaturan Umum", href: "/dashboard/settings", icon: Settings },
      { label: "Pengaturan Sampah", href: "/dashboard/settings/waste", icon: Recycle },
      { label: "Pengaturan Poin", href: "/dashboard/settings/points", icon: Medal },
      { label: "Pengaturan Data", href: "/dashboard/settings/data", icon: Database },
    ],
  },
];

interface SidebarProps {
  user: User | null;
}

function SidebarNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuthContext();
  const { user } = useAuthContext();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4 space-y-7">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <BrandLogo showSubtitle={false} imageClassName="h-12 w-12" textClassName="text-2xl" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-7 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">
              {group.title}
            </p>
            {group.items.map((item) => {
              // Only mark an item active on exact match, or when the
              // current pathname starts with the item's href for
              // items that are intended to be prefix-matched (e.g. missions).
              // Avoid making the parent settings hub active when a settings
              // subpage is open (so `/dashboard/settings` is only active
              // on the exact path).
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 space-y-2 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] border-r bg-white flex-col shrink-0">
        <SidebarNav />
      </aside>

      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px]">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
            <SidebarNav onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
