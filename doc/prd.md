# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Sirkula — Platform Digital Bank Sampah

**Versi:** 1.0
**Tahun:** 2025
**Penulis:** Afcha Arel Pratama (2211082035)
**Program Studi:** TRPL — Politeknik Negeri Padang

---

# 1. RINGKASAN EKSEKUTIF

## 1.1 Deskripsi Produk

Sirkula adalah platform digital bank sampah berbasis Android yang mengintegrasikan gamifikasi dan Machine Learning untuk meningkatkan partisipasi masyarakat dalam pengelolaan sampah di Kota Padang.

## 1.2 Masalah yang Dipecahkan

* Penurunan partisipasi member
* Pengelolaan masih semi-manual
* Tidak ada deteksi dini churn
* Data historis belum dimanfaatkan optimal

## 1.3 Solusi yang Diusulkan

1. Aplikasi Android dengan gamifikasi (poin, badge, misi, leaderboard)
2. Dashboard Admin dengan Machine Learning (Random Forest)

---

# 2. TUJUAN PRODUK & SASARAN BISNIS

## 2.1 Tujuan Utama

| No | Tujuan                         | Indikator             |
| -- | ------------------------------ | --------------------- |
| 1  | Meningkatkan frekuensi setoran | ≥20% dalam 3 bulan    |
| 2  | Deteksi churn                  | Recall High Risk ≥80% |
| 3  | Digitalisasi sistem            | 0% manual             |
| 4  | Dukungan DLH                   | Data real-time        |
| 5  | Engagement admin               | ≥3x/minggu            |

## 2.2 Sasaran Bisnis

* Mendukung RIPS Kota Padang
* Meningkatkan pasokan sampah
* Data-driven decision untuk DLH

---

# 3. PENGGUNA & STAKEHOLDER

## 3.1 Persona

### 👤 member

* Usia: 20–60 tahun
* Kebutuhan: Setoran mudah, poin, reward
* Pain point: Kurang motivasi

### 👨‍💼 Admin DLH

* Kebutuhan: Monitoring & validasi
* Pain point: Rekap manual

## 3.2 Stakeholder

* DLH Kota Padang
* member
* Politeknik Negeri Padang
* Developer

---

# 4. RUANG LINGKUP

## 4.1 In Scope

| Komponen   | Teknologi     |
| ---------- | ------------- |
| Mobile App | Flutter       |
| Web Admin  | Next.js       |
| Backend    | Flask         |
| Database   | PostgreSQL    |
| ML         | Random Forest |

## 4.2 Out of Scope

* GPS / Maps
* Mode offline
* FCM
* E-wallet
* Multi kota

---

# 5. FITUR & REQUIREMENTS

## 5.1 Mobile App

### FR-01: Auth

* Register
* Login
* Logout

### FR-02: Setoran

* Input setoran
* Status validasi
* Riwayat

### FR-03: Gamifikasi

* Poin
* Badge
* Leaderboard
* Reward

### FR-04: Misi

* Harian & mingguan
* Progress otomatis

---

## 5.2 Web Admin

### FR-05: Validasi

* Validasi setoran
* Input berat aktual

### FR-06: Reward

* Validasi penukaran
* Kelola katalog

### FR-07: Dashboard

* KPI
* Grafik tren
* Risk table

### FR-08: Gamifikasi

* Kelola misi
* Setting poin

---

# 6. MACHINE LEARNING

## 6.1 Model

* Algoritma: Random Forest
* Output: Low / Medium / High Risk

## 6.2 Feature

* **Recency** → terakhir setor
* **Frequency** → jumlah transaksi
* **Consistency** → tren aktivitas

## 6.3 Labeling

| Label  | Kondisi     |
| ------ | ----------- |
| High   | Tidak aktif |
| Medium | Mulai turun |
| Low    | Aktif       |

## 6.4 Flow

1. Data → Backend
2. Feature Engineering
3. Kirim ke ML Service
4. Prediksi → DB
5. Tampilkan di dashboard

---

# 7. NON-FUNCTIONAL REQUIREMENTS

| Kategori     | Target          |
| ------------ | --------------- |
| API Response | < 2 detik       |
| ML Response  | < 5 detik       |
| Uptime       | ≥ 99%           |
| Security     | JWT + HTTPS     |
| Usability    | Easy onboarding |
| Android      | ≥ 8.0           |

---

# 8. ARSITEKTUR

## 8.1 Komponen

* Flutter App
* Next.js Dashboard
* Flask API
* PostgreSQL
* ML Service

## 8.2 Alur Data

1. User → Backend
2. Admin validasi
3. ML prediksi
4. Dashboard update

## 8.3 Use Case

* Login
* Setoran
* Reward
* Dashboard
* Analisis risiko

---

# 9. DATA

## 9.1 Sumber

* DLH Padang
* 32.469 transaksi

## 9.2 Entitas

* User
* Transaction
* Mission
* Reward
* Redemption
* Risk Profile

---

# 10. TIMELINE

| Fase        | Durasi   |
| ----------- | -------- |
| Persiapan   | 2 minggu |
| ML          | 3 minggu |
| Backend     | 3 minggu |
| Mobile      | 3 minggu |
| Web         | 2 minggu |
| Testing     | 2 minggu |
| Dokumentasi | 2 minggu |

---

# 11. RISIKO

| Risiko         | Mitigasi  |
| -------------- | --------- |
| Data kurang    | SMOTE     |
| Model jelek    | tuning    |
| Adopsi rendah  | UX bagus  |
| Waktu terbatas | prioritas |

---

# 12. ACCEPTANCE CRITERIA

## 12.1 Fungsional

* Semua fitur berjalan
* ML akurat
* JWT aktif

## 12.2 Non-Fungsional

* API cepat
* App stabil
* Secure

## 12.3 Akademik

* Laporan lengkap
* Bisa demo
* Model terdokumentasi

---

# 13. GLOSARIUM

| Istilah       | Definisi         |
| ------------- | ---------------- |
| Churn         | member berhenti |
| Gamifikasi    | Elemen game      |
| Random Forest | Algoritma ML     |
| Recency       | Jarak waktu      |
| Frequency     | Jumlah aktivitas |
| Consistency   | Pola aktivitas   |

---

**— END OF PRD —**
