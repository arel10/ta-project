"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Download, Sparkles, Loader2, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend,
} from "recharts";

import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials, formatNumber, formatDate, getWasteTypeLabel } from "@/lib/utils";
import type { RiskTrendItem, MemberDetail } from "@/types";

const riskBadgeMap: Record<string, { label: string; variant: "success" | "warning" | "danger"; color: string }> = {
  low: { label: "Rendah", variant: "success", color: "bg-green-50" },
  medium: { label: "Sedang", variant: "warning", color: "bg-yellow-50" },
  high: { label: "Tinggi", variant: "danger", color: "bg-red-50" },
};

interface RiskUser {
  user_id: number;
  name: string;
  account_number: string;
  recency_days: number;
  frequency: number;
  consistency_score: number;
  risk_level: string;
  predicted_at: string;
}

function getSafeRecency(days?: number | null): number {
  return Math.max(0, days ?? 0);
}

function formatRecencyLabel(days?: number | null): string {
  const safeDays = getSafeRecency(days);
  if (safeDays === 0) {
    return "Hari ini";
  }
  return `${safeDays} hari lalu`;
}

export default function RiskPage() {
  const PAGE_SIZE = 10;

  const [distribution, setDistribution] = useState({ low: 0, medium: 0, high: 0 });
  const [users, setUsers] = useState<RiskUser[]>([]);
  const [allUsers, setAllUsers] = useState<RiskUser[]>([]);
  const [trendData, setTrendData] = useState<RiskTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingUserId, setAnalyzingUserId] = useState<number | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [progressOpen, setProgressOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        api.get("/ml/risk-summary"),
        api.get("/ml/risk-trend"),
      ]);

      const summary = summaryRes.data;
      setDistribution(summary.distribution || { low: 0, medium: 0, high: 0 });
      setAllUsers(summary.users || []);
      setUsers(summary.users || []);
      if (summary.last_analyzed_at) setLastAnalyzed(summary.last_analyzed_at);
      setTrendData(trendRes.data.data || []);
    } catch {
      toast.error("Gagal memuat data risiko");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = allUsers;
    if (filter !== "all") filtered = filtered.filter((u) => u.risk_level === filter);
    if (search) filtered = filtered.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));
    setUsers(filtered);
    setCurrentPage(1);
  }, [filter, search, allUsers]);

  const totalUsers = users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = users.slice(pageStart, pageStart + PAGE_SIZE);
  const startItem = totalUsers === 0 ? 0 : pageStart + 1;
  const endItem = Math.min(pageStart + PAGE_SIZE, totalUsers);
  const pageWindowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const visiblePageCount = Math.min(5, totalPages);

  const runAnalyzeAll = async () => {
    setAnalyzing(true);
    setProgressOpen(true);
    try {
      const res = await api.post("/ml/analyze/all");
      const analyzed = res.data?.total_analyzed ?? 0;
      const requested = res.data?.total_requested ?? analyzed;
      const errors = res.data?.total_errors ?? 0;
      toast.success(`Analisis selesai: ${analyzed}/${requested} anggota diproses${errors ? `, error ${errors}` : ""}`);
      setProgressOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menjalankan analisis");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalyzeUser = async (userId: number) => {
    setAnalyzingUserId(userId);
    try {
      await api.post(`/ml/analyze/${userId}`);
      toast.success("Analisis selesai");
      fetchData();
    } catch {
      toast.error("Gagal menganalisis user");
    } finally {
      setAnalyzingUserId(null);
    }
  };

  const openDetail = async (memberId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/members/${memberId}`);
      setDetail(res.data);
    } catch {
      toast.error("Gagal memuat detail anggota");
    } finally {
      setDetailLoading(false);
    }
  };

  const getRecencyColor = (days: number) => {
    const safeDays = getSafeRecency(days);
    if (safeDays < 30) return "text-green-600";
    if (safeDays <= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analisis Risiko</h1>
          <p className="text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">Powered by Random Forest ML Model</span>
            {" · "}Mendeteksi anomali partisipasi secara otomatis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastAnalyzed && (
            <span className="text-xs text-muted-foreground">
              Terakhir dianalisis: {formatRelativeTime(lastAnalyzed)}
            </span>
          )}
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={runAnalyzeAll} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Jalankan Analisis
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Risiko Rendah", value: distribution.low, color: "bg-green-50 border-green-200", iconColor: "text-green-600", desc: "Anggota dengan partisipasi stabil dan konsisten dalam 3 bulan terakhir." },
          { label: "Risiko Sedang", value: distribution.medium, color: "bg-yellow-50 border-yellow-200", iconColor: "text-yellow-600", desc: "Terdapat fluktuasi dalam volume setoran atau keterlambatan minor." },
          { label: "Risiko Tinggi", value: distribution.high, color: "bg-red-50 border-red-200", iconColor: "text-red-600", desc: "Anggota yang tidak aktif lebih dari 30 hari atau volume setoran turun drastis." },
        ].map((card) => (
          <Card key={card.label} className={`${card.color} border`}>
            <CardContent className="p-6">
              <p className="text-4xl font-bold">{card.value}</p>
              <p className={`font-semibold ${card.iconColor} mt-1`}>{card.label}</p>
              <p className="text-xs text-muted-foreground mt-2">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tren Risiko 6 Bulan Terakhir</CardTitle>
          <CardDescription>Distribusi profil risiko partisipasi</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              Belum ada data tren analisis risiko.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="low" name="Rendah" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="medium" name="Sedang" fill="#eab308" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="high" name="Tinggi" fill="#dc2626" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="low">Rendah</TabsTrigger>
            <TabsTrigger value="medium">Sedang</TabsTrigger>
            <TabsTrigger value="high">Tinggi</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Filter berdasarkan nama..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Risk Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Jarak Sejak Setoran Terakhir</TableHead>
                <TableHead>Frekuensi</TableHead>
                <TableHead>Konsistensi</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Dianalisis</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Tidak ada data analisis risiko.
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.map((u) => (
                <TableRow key={u.user_id} className={u.risk_level === "high" ? "bg-red-50/50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={
                          u.risk_level === "high" ? "bg-red-100 text-red-700" :
                          u.risk_level === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                        }>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <button
                          type="button"
                          onClick={() => openDetail(u.user_id)}
                          className="font-medium text-left hover:text-green-700"
                        >
                          {u.name}
                        </button>
                        <p className="text-xs text-muted-foreground">{u.account_number}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${getRecencyColor(u.recency_days)}`}>{formatRecencyLabel(u.recency_days)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.frequency}x</span>
                      <span className="text-xs text-muted-foreground">total setoran tervalidasi</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600">{Math.round(u.consistency_score * 100)}%</span>
                      <Progress value={u.consistency_score * 100} className="h-2 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={riskBadgeMap[u.risk_level]?.variant || "secondary"} className="uppercase text-xs font-bold">
                      {riskBadgeMap[u.risk_level]?.label || u.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.predicted_at ? formatRelativeTime(u.predicted_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => openDetail(u.user_id)}
                      >
                        Lihat Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runAnalyzeUser(u.user_id)}
                        disabled={analyzingUserId === u.user_id}
                      >
                        {analyzingUserId === u.user_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Analisis Ulang
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Menampilkan {startItem}-{endItem} dari {totalUsers} anggota teranalisis</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            ‹
          </Button>
          {[...Array(visiblePageCount)].map((_, i) => {
            const pageNumber = pageWindowStart + i;
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNumber)}
                className={currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {pageNumber}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            ›
          </Button>
        </div>
      </div>

      {/* Progress Dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Menjalankan Analisis</DialogTitle>
            <DialogDescription>
              Sistem sedang menjalankan prediksi risiko untuk seluruh anggota.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
            <p className="text-muted-foreground">Model sedang memproses semua anggota...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Anggota Teranalisis</SheetTitle>
            <SheetDescription>Ringkasan profil, risiko, dan riwayat setoran</SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-6 mt-6">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto">
                  <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                    {getInitials(detail.member.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold mt-3">{detail.member.name}</h3>
                <p className="text-sm text-muted-foreground">{detail.member.email}</p>
                <p className="text-xs text-green-600 font-semibold mt-1 uppercase">
                  Gabung: {formatDate(detail.member.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Poin</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(detail.member.total_points)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Total Setoran</p>
                  <p className="text-2xl font-bold">{detail.stats.total_weight_kg} <span className="text-base font-normal">kg</span></p>
                </div>
              </div>

              {detail.risk_profile && (
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold">Profil Risiko Terakhir</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>Jarak sejak setoran terakhir: <span className="font-semibold">{formatRecencyLabel(detail.risk_profile.recency_days)}</span></p>
                    <p>Frekuensi: <span className="font-semibold">{detail.risk_profile.frequency}x</span></p>
                    <p className="col-span-2 text-xs text-muted-foreground">Frekuensi dihitung dari total setoran tervalidasi yang dipakai model ML.</p>
                  </div>
                  <div className="text-sm flex items-center justify-between">
                    <span>Konsistensi</span>
                    <span className="font-semibold text-green-700">{Math.round((detail.risk_profile.consistency_score || 0) * 100)}%</span>
                  </div>
                  <Progress value={(detail.risk_profile.consistency_score || 0) * 100} className="h-2" />
                  <div>
                    <Badge variant={riskBadgeMap[detail.risk_profile.risk_level]?.variant || "secondary"} className="uppercase text-xs font-bold">
                      {riskBadgeMap[detail.risk_profile.risk_level]?.label || detail.risk_profile.risk_level}
                    </Badge>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">5 Setoran Terakhir</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Berat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detail.recent_deposits || []).slice(0, 5).map((dep) => (
                      <TableRow key={dep.id}>
                        <TableCell className="text-xs">{dep.created_at ? formatDate(dep.created_at) : "-"}</TableCell>
                        <TableCell className="text-xs">{getWasteTypeLabel(dep.waste_type)}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{dep.weight_kg} kg</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-6">Belum ada data detail.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
