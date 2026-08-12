"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Sparkles, Loader2, RefreshCw, UserX, UserCheck, Activity } from "lucide-react";
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
import type { ChurnTrendItem, MemberDetail, ChurnUser } from "@/types";

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

  const [distribution, setDistribution] = useState({ churn: 0, not_churn: 0 });
  const [users, setUsers] = useState<ChurnUser[]>([]);
  const [allUsers, setAllUsers] = useState<ChurnUser[]>([]);
  const [trendData, setTrendData] = useState<ChurnTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingUserId, setAnalyzingUserId] = useState<number | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [filter, setFilter] = useState("all"); // "all" | "churn" | "not_churn"
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
        api.get("/ml/churn-summary"),
        api.get("/ml/churn-trend"),
      ]);

      const summary = summaryRes.data;
      setDistribution(summary.distribution || { churn: 0, not_churn: 0 });
      setAllUsers(summary.users || []);
      setUsers(summary.users || []);
      if (summary.last_analyzed_at) setLastAnalyzed(summary.last_analyzed_at);
      setTrendData(trendRes.data.data || []);
    } catch {
      toast.error("Gagal memuat data analisis churn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = allUsers;
    if (filter === "churn") {
      filtered = filtered.filter((u) => u.will_churn === true || u.risk_level === "high");
    } else if (filter === "not_churn") {
      filtered = filtered.filter((u) => u.will_churn === false || u.risk_level === "low" || u.risk_level === "medium");
    }

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.account_number.toLowerCase().includes(search.toLowerCase())
      );
    }
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
      toast.success(`Analisis churn selesai: ${analyzed}/${requested} anggota diproses${errors ? `, error ${errors}` : ""}`);
      setProgressOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menjalankan analisis churn");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalyzeUser = async (userId: number) => {
    setAnalyzingUserId(userId);
    try {
      await api.post(`/ml/analyze/${userId}`);
      toast.success("Analisis churn selesai");
      fetchData();
    } catch {
      toast.error("Gagal menganalisis user (minimal butuh 2 setoran tervalidasi)");
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

  const activeProfile = detail?.churn_profile || detail?.risk_profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analisis Prediksi Churn</h1>
          <p className="text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">Powered by Random Forest ML Model (60-Day Churn Prediction)</span>
            {" · "}Memprediksi potensi henti setor berdasarkan 8 fitur perilaku
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
            Jalankan Analisis Churn
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200 border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-green-700">{distribution.not_churn}</p>
                <p className="font-semibold text-green-700 mt-1">Aktif (Tidak Churn)</p>
              </div>
              <UserCheck className="h-10 w-10 text-green-600 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Anggota yang diprediksi akan tetap aktif berpartisipasi menyetor sampah dalam 60 hari ke depan.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-red-700">{distribution.churn}</p>
                <p className="font-semibold text-red-700 mt-1">Potensi Churn</p>
              </div>
              <UserX className="h-10 w-10 text-red-600 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Anggota yang diprediksi berpotensi berhenti menyetor sampah dalam 60 hari ke depan.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200 border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-blue-700">{allUsers.length}</p>
                <p className="font-semibold text-blue-700 mt-1">Total Teranalisis</p>
              </div>
              <Activity className="h-10 w-10 text-blue-600 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total anggota aktif yang memenuhi syarat analisis (minimal 2 setoran tervalidasi).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Churn Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tren Prediksi Churn 6 Bulan Terakhir</CardTitle>
          <CardDescription>Distribusi riwayat hasil analisis prediksi churn partisipasi anggota</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              Belum ada data tren analisis churn.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="not_churn" name="Aktif (Tidak Churn)" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="churn" name="Potensi Churn" fill="#dc2626" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="churn">Potensi Churn ({distribution.churn})</TabsTrigger>
            <TabsTrigger value="not_churn">Aktif ({distribution.not_churn})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Filter berdasarkan nama / no rekening..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Risk Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nama Anggota</TableHead>
                <TableHead>Setoran Terakhir</TableHead>
                <TableHead>Frekuensi</TableHead>
                <TableHead>Rata-rata Interval</TableHead>
                <TableHead>Probabilitas Churn</TableHead>
                <TableHead>Status Prediksi</TableHead>
                <TableHead>Dianalisis</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Tidak ada data analisis churn.
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.map((u) => {
                const isChurn = u.will_churn === true || u.risk_level === "high";
                const prob = u.churn_probability !== undefined && u.churn_probability !== null
                  ? Math.round(u.churn_probability * 100)
                  : null;

                return (
                  <TableRow key={u.user_id} className={isChurn ? "bg-red-50/50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={isChurn ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
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
                      <span className={`font-semibold ${getRecencyColor(u.recency_days)}`}>
                        {formatRecencyLabel(u.recency_days)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{u.frequency}x setoran</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{u.avg_interval ? `${u.avg_interval} hari` : "-"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isChurn ? "text-red-600" : "text-green-600"}`}>
                          {prob !== null ? `${prob}%` : "-"}
                        </span>
                        {prob !== null && (
                          <Progress
                            value={prob}
                            className={`h-2 w-16 ${isChurn ? "[&>div]:bg-red-600" : "[&>div]:bg-green-600"}`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isChurn ? "danger" : "success"} className="uppercase text-xs font-bold">
                        {isChurn ? "Potensi Churn" : "Aktif"}
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
                          Detail
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
                          Ulang
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <DialogTitle>Menjalankan Analisis Churn</DialogTitle>
            <DialogDescription>
              Model Random Forest 60-hari sedang menganalisis seluruh anggota.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
            <p className="text-muted-foreground">Memproses fitur perilaku & interval setoran...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Profil & Prediksi Churn</SheetTitle>
            <SheetDescription>8 Fitur analisis perilaku dan riwayat setoran</SheetDescription>
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
                  No Rek: {detail.member.account_number || "-"} · Level: {detail.member.level}
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

              {activeProfile && (
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Hasil Prediksi Model ML (60 Hari)</p>
                    <Badge variant={activeProfile.will_churn ? "danger" : "success"} className="uppercase text-xs font-bold">
                      {activeProfile.will_churn ? "Potensi Churn" : "Aktif"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Probabilitas Churn:</span>
                      <span className={`font-bold ${activeProfile.will_churn ? "text-red-600" : "text-green-600"}`}>
                        {activeProfile.churn_probability !== undefined && activeProfile.churn_probability !== null
                          ? `${Math.round(activeProfile.churn_probability * 100)}%`
                          : "-"}
                      </span>
                    </div>
                    <Progress
                      value={(activeProfile.churn_probability || 0) * 100}
                      className={`h-2 ${activeProfile.will_churn ? "[&>div]:bg-red-600" : "[&>div]:bg-green-600"}`}
                    />
                  </div>

                  <div className="border-t pt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Recency (Hari Terakhir):</span>
                      <span className="font-semibold">{formatRecencyLabel(activeProfile.recency_days)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Frequency (Setoran):</span>
                      <span className="font-semibold">{activeProfile.frequency} kali</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Rata-rata Interval:</span>
                      <span className="font-semibold">{activeProfile.avg_interval ? `${activeProfile.avg_interval} hari` : "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Variabilitas Interval:</span>
                      <span className="font-semibold">{activeProfile.std_interval ? `${activeProfile.std_interval} hari` : "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Rata-rata Berat:</span>
                      <span className="font-semibold">{activeProfile.avg_berat ? `${activeProfile.avg_berat} kg` : "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Tren Berat:</span>
                      <span className="font-semibold">{activeProfile.trend_berat !== undefined && activeProfile.trend_berat !== null ? activeProfile.trend_berat.toFixed(3) : "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Masa Aktif:</span>
                      <span className="font-semibold">{activeProfile.days_active ? `${activeProfile.days_active} hari` : "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Konsistensi:</span>
                      <span className="font-semibold">{Math.round((activeProfile.consistency_score || 0) * 100)}%</span>
                    </div>
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
