"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ClipboardCheck, Gift, Loader2, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/components/providers/auth-provider";
import api from "@/lib/axios";
import { getInitials, formatRelativeTime, cn } from "@/lib/utils";
import type { User } from "@/types";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/deposits": "Validasi Setoran",
  "/dashboard/members": "Anggota",
  "/dashboard/risk": "Analisis Risiko",
  "/dashboard/missions": "Misi & Gamifikasi",
  "/dashboard/rewards": "Katalog Reward",
  "/dashboard/settings": "Pengaturan",
  "/dashboard/settings/waste": "Pengaturan Sampah",
  "/dashboard/settings/points": "Pengaturan Poin",
  "/dashboard/profile": "Profil Saya",
};

interface HeaderProps {
  user: User | null;
}

interface NotificationItem {
  id: string;
  type: "deposit" | "redemption";
  title: string;
  message: string;
  created_at: string;
  status: string;
  link: string;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthContext();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load read status from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_read_notifications");
      if (stored) {
        try {
          setReadNotificationIds(JSON.parse(stored));
        } catch (e) {
          console.error("Gagal memuat status baca notifikasi:", e);
        }
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/admin/notification");
      const list: NotificationItem[] = res.data.data || [];
      setNotifications(list);

      // Calculate unread count using currently loaded read IDs
      const stored = typeof window !== "undefined" ? localStorage.getItem("admin_read_notifications") : null;
      const readIds: string[] = stored ? JSON.parse(stored) : [];
      const unread = list.filter((n) => !readIds.includes(n.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30 seconds
    return () => clearInterval(interval);
  }, [readNotificationIds]);

  const markAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    localStorage.setItem("admin_read_notifications", JSON.stringify(allIds));
    setUnreadCount(0);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // Add clicked notification to read list
    if (!readNotificationIds.includes(n.id)) {
      const updated = [...readNotificationIds, n.id];
      setReadNotificationIds(updated);
      localStorage.setItem("admin_read_notifications", JSON.stringify(updated));
      const unread = notifications.filter((item) => !updated.includes(item.id)).length;
      setUnreadCount(unread);
    }

    // Redirect to target link
    if (typeof window !== "undefined") {
      window.location.href = n.link;
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari data, anggota, atau laporan..."
            className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 h-10"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notification dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[450px] overflow-y-auto p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} pending
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-xs text-muted-foreground">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-gray-50 p-3 rounded-full mb-3">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">Semua tugas beres!</p>
                <p className="text-xs text-muted-foreground mt-1">Tidak ada setoran atau penukaran yang perlu divalidasi saat ini.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[350px] overflow-y-auto">
                {notifications.map((n) => {
                  const isUnread = !readNotificationIds.includes(n.id);
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn(
                        "p-4 focus:bg-gray-50 cursor-pointer flex gap-3 items-start outline-none transition-colors relative",
                        isUnread ? "bg-green-50/10 hover:bg-green-50/20" : "opacity-80"
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      {/* Unread indicator dot */}
                      {isUnread && (
                        <span className="absolute top-4 right-4 w-2 h-2 bg-green-600 rounded-full" />
                      )}
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 mt-0.5",
                        n.type === "deposit" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {n.type === "deposit" ? (
                          <ClipboardCheck className="h-4 w-4" />
                        ) : (
                          <Gift className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 pr-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-xs text-gray-900",
                            isUnread ? "font-bold" : "font-medium text-gray-700"
                          )}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {n.created_at ? formatRelativeTime(n.created_at) : ""}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs leading-normal line-clamp-2",
                          isUnread ? "text-gray-800 font-medium" : "text-gray-500"
                        )}>
                          {n.message}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
            <div className="p-3 border-t text-center bg-gray-50/50">
              <span className="text-[10px] text-muted-foreground">
                Notifikasi terupdate otomatis saat tugas diselesaikan
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-green-600 text-white text-sm font-semibold">
                {user ? getInitials(user.name) : "AD"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-red-600">
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
