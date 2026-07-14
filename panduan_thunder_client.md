# Panduan Pengujian API - Thunder Client

## Cara Import Koleksi

1. Buka VS Code → Thunder Client (ikon petir di sidebar)
2. Klik **Collections** → **Menu (≡)** → **Import**
3. Pilih file dari folder `thunder-client/`:
   - [thunder-collection.json](file:///d:/kulyeah/Sems%208/TA/thunder-client/thunder-collection.json) — Definisi koleksi
   - [thunder-requests.json](file:///d:/kulyeah/Sems%208/TA/thunder-client/thunder-requests.json) — Semua request
4. Klik **Env** → **Import** → pilih [thunder-environment.json](file:///d:/kulyeah/Sems%208/TA/thunder-client/thunder-environment.json)

> [!IMPORTANT]
> Pastikan backend sudah running di `http://localhost:5000` sebelum menguji (`python run.py`).

---

## Environment Variables

| Variable | Keterangan | Cara Isi |
|----------|-----------|----------|
| `BASE_URL` | Base URL API | Sudah diisi: `http://localhost:5000/api` |
| `ACCESS_TOKEN` | JWT token member | Otomatis terisi setelah login |
| `ADMIN_TOKEN` | JWT token admin | Otomatis terisi dari request "Setup: Login Admin" |
| `USER_ID` | ID user target untuk ML | Isi manual (cek dari response register/login) |
| `DEPOSIT_ID` | ID setoran untuk validasi | Otomatis terisi dari request "3a. Setoran Valid" |
| `REWARD_ID` | ID reward untuk penukaran | Isi manual (cek dari response "6a. Katalog Reward") |
| `REDEMPTION_ID` | ID penukaran | Otomatis terisi dari request "6b. Tukar Reward" |

---

## Urutan Pengujian yang Disarankan

```
1. Jalankan "Setup: Login Admin" → dapat ADMIN_TOKEN
2. Jalankan test Registrasi (1a, 1b, 1c)
3. Jalankan test Login (2a, 2b, 2c)
4. Jalankan test Setoran (3a → catat DEPOSIT_ID, 3b, 3c, 3d)
5. Jalankan "4a. Validasi Setoran" (pakai ADMIN_TOKEN)
6. Jalankan test Gamifikasi (5a, 5b, 5c, 5d)
7. Isi REWARD_ID → Jalankan test Reward (6a-6f)
8. Isi USER_ID → Jalankan test ML (7a-7e)
```

---

## 4.2.1.1 Pengujian Fitur Authentikasi

### 1. Registrasi

#### a. Registrasi dengan Data Valid

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/register` |
| **Header** | `Content-Type: application/json` |
| **Body** | `{"name": "Test User Baru", "email": "testuser@example.com", "password": "password123"}` |
| **Expected** | `201` — `"Registrasi berhasil"` + `access_token`, `refresh_token`, `user` |

#### b. Registrasi dengan Email Sudah Terdaftar

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/register` |
| **Body** | `{"name": "Test Duplikat", "email": "testuser@example.com", "password": "password123"}` |
| **Expected** | `409` — `"Email sudah terdaftar"` |

#### c. Registrasi dengan Field Kosong

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/register` |
| **Body** | `{"name": "", "email": "", "password": ""}` |
| **Expected** | `400` — `"Nama, email, dan password wajib diisi"` |

---

### 2. Login

#### a. Login dengan Kredensial Valid

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/login` |
| **Body** | `{"email": "testuser@example.com", "password": "password123"}` |
| **Expected** | `200` — `"Login berhasil"` + `access_token`, `refresh_token`, `user` |

#### b. Login dengan Password Salah

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/login` |
| **Body** | `{"email": "testuser@example.com", "password": "wrongpassword"}` |
| **Expected** | `401` — `"Email atau password salah"` |

#### c. Login dengan Email Tidak Terdaftar

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/auth/login` |
| **Body** | `{"email": "tidakada@example.com", "password": "password123"}` |
| **Expected** | `401` — `"Email atau password salah"` |

---

## 4.2.1.2 Pengujian Fitur Setoran Sampah

### 1. Pencatatan Setoran

#### a. Membuat Setoran dengan Data Valid

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/deposits` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Body** | `{"weight_kg": 2.5, "waste_type": "p1"}` |
| **Expected** | `201` — `"Setoran berhasil dibuat, menunggu validasi admin"` + `deposit`, `estimated_points` |

> [!TIP]
> Kode waste_type yang valid: `p1`–`p9` (Plastik), `k1`–`k6` (Kertas), `b1`–`b3` (Logam), `l1` (Kaleng Lunak), `mj` (Minyak Jelantah). Gunakan huruf kecil.

#### b. Membuat Setoran dengan Jenis Sampah Tidak Valid

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/deposits` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Body** | `{"weight_kg": 2.5, "waste_type": "karet"}` |
| **Expected** | `400` — `"Jenis sampah tidak valid atau belum aktif"` |

#### c. Membuat Setoran dengan Berat Negatif

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/deposits` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Body** | `{"weight_kg": -5, "waste_type": "p1"}` |
| **Expected** | `400` — `"Berat harus lebih dari 0"` |

#### d. Melihat Riwayat Setoran

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/deposits/my?page=1&per_page=10` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `deposits[]`, `total`, `page`, `pages` |

---

### 2. Validasi Setoran (Admin)

#### a. Validasi Setoran Pending

| Item | Detail |
|------|--------|
| **Request** | `PUT {{BASE_URL}}/deposits/{{DEPOSIT_ID}}/validate` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Body** | `{}` |
| **Expected** | `200` — `"Setoran berhasil divalidasi"` + `points_earned` |

#### b. Validasi dengan Override Berat

| Item | Detail |
|------|--------|
| **Request** | `PUT {{BASE_URL}}/deposits/{{DEPOSIT_ID}}/validate` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Body** | `{"actual_weight_kg": 3.0}` |
| **Expected** | `200` — berat berubah ke 3.0, poin dihitung berdasarkan berat baru |

---

## 4.2.1.3 Pengujian Fitur Gamifikasi

#### a. Melihat Daftar Misi Aktif

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/gamification/missions` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `missions[]` dengan `user_progress`, `is_completed` per misi |

#### b. Melihat Leaderboard

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/gamification/leaderboard` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `leaderboard[]` (top 10) + `current_user_rank` |

#### c. Melihat Badge yang Dimiliki

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/gamification/badges/my` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `earned_badges[]`, `available_badges[]`, `total_earned`, `total_available` |

#### d. Penyelesaian Misi Otomatis

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/gamification/summary` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `total_points`, `level`, `missions_completed`, `badges_earned` |
| **Catatan** | Misi selesai otomatis saat admin validasi setoran. Cek `missions_completed` bertambah setelah validasi. |

---

## 4.2.1.4 Pengujian Fitur Reward

#### a. Melihat Katalog Reward

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/rewards` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Expected** | `200` — `rewards[]` (yang aktif, urut points_cost ASC) |

#### b. Menukar Point dengan Reward (Point Cukup)

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/rewards/redeem` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Body** | `{"reward_id": <REWARD_ID>}` |
| **Expected** | `201` — `"Penukaran berhasil diajukan..."` + `redemption`, `remaining_points` |

#### c. Menukar Point dengan Reward (Point Tidak Cukup)

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/rewards/redeem` |
| **Header** | `Authorization: Bearer {{ACCESS_TOKEN}}` |
| **Body** | `{"reward_id": <REWARD_ID>}` (reward mahal, user poin sedikit) |
| **Expected** | `400` — `"Poin tidak mencukupi"` + `required`, `available` |

#### d. Menukar Reward dengan Stok Habis

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/rewards/redeem` |
| **Body** | `{"reward_id": <REWARD_ID>}` (reward dengan stock=0) |
| **Expected** | `400` — `"Stok reward habis"` |

#### e. Admin Menyetujui Penukaran

| Item | Detail |
|------|--------|
| **Request** | `PUT {{BASE_URL}}/rewards/redemptions/{{REDEMPTION_ID}}/approve` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `"Penukaran berhasil disetujui"` |

#### f. Admin Menolak Penukaran

| Item | Detail |
|------|--------|
| **Request** | `PUT {{BASE_URL}}/rewards/redemptions/{{REDEMPTION_ID}}/reject` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `"Penukaran berhasil ditolak"` + `refunded_points` (poin dikembalikan, stok +1) |

---

## 4.2.1.5 Pengujian Fitur Machine Learning

#### a. Analisis Risiko per Nasabah

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/ml/analyze/{{USER_ID}}` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `"Analisis risiko berhasil"` + `risk_profile` (risk_level, confidence_score, recency_days, frequency, consistency_score) |

#### b. Analisis Risiko Seluruh Nasabah

| Item | Detail |
|------|--------|
| **Request** | `POST {{BASE_URL}}/ml/analyze/all` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `total_requested`, `total_analyzed`, `total_errors`, `results[]` |

#### c. Melihat Ringkasan Distribusi Risiko

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/ml/risk-summary` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `distribution` (low/medium/high counts), `high_risk_users[]`, `total_analyzed` |

#### d. Menukar Reward dengan Stok Habis

> [!NOTE]
> Skenario ini sama dengan **4.2.1.4.d** — lihat bagian Reward di atas.

#### e. Melihat Tren Risiko Bulanan

| Item | Detail |
|------|--------|
| **Request** | `GET {{BASE_URL}}/ml/risk-trend` |
| **Header** | `Authorization: Bearer {{ADMIN_TOKEN}}` |
| **Expected** | `200` — `data[]` berisi distribusi per bulan (6 bulan terakhir: month, low, medium, high) |

---

## Ringkasan Seluruh Endpoint

| No | Skenario | Method | Endpoint | Auth |
|----|----------|--------|----------|------|
| 1a | Registrasi Valid | `POST` | `/api/auth/register` | — |
| 1b | Registrasi Email Duplikat | `POST` | `/api/auth/register` | — |
| 1c | Registrasi Field Kosong | `POST` | `/api/auth/register` | — |
| 2a | Login Valid | `POST` | `/api/auth/login` | — |
| 2b | Login Password Salah | `POST` | `/api/auth/login` | — |
| 2c | Login Email Tidak Terdaftar | `POST` | `/api/auth/login` | — |
| 3a | Setoran Data Valid | `POST` | `/api/deposits` | Member |
| 3b | Setoran Waste Type Invalid | `POST` | `/api/deposits` | Member |
| 3c | Setoran Berat Negatif | `POST` | `/api/deposits` | Member |
| 3d | Riwayat Setoran | `GET` | `/api/deposits/my` | Member |
| 4a | Validasi Setoran | `PUT` | `/api/deposits/{id}/validate` | Admin |
| 4b | Validasi Override Berat | `PUT` | `/api/deposits/{id}/validate` | Admin |
| 5a | Daftar Misi Aktif | `GET` | `/api/gamification/missions` | Member |
| 5b | Leaderboard | `GET` | `/api/gamification/leaderboard` | Member |
| 5c | Badge Saya | `GET` | `/api/gamification/badges/my` | Member |
| 5d | Summary Gamifikasi | `GET` | `/api/gamification/summary` | Member |
| 6a | Katalog Reward | `GET` | `/api/rewards` | Member |
| 6b | Tukar Reward (Cukup) | `POST` | `/api/rewards/redeem` | Member |
| 6c | Tukar Reward (Kurang) | `POST` | `/api/rewards/redeem` | Member |
| 6d | Tukar Reward (Stok Habis) | `POST` | `/api/rewards/redeem` | Member |
| 6e | Approve Penukaran | `PUT` | `/api/rewards/redemptions/{id}/approve` | Admin |
| 6f | Reject Penukaran | `PUT` | `/api/rewards/redemptions/{id}/reject` | Admin |
| 7a | ML Analisis Single | `POST` | `/api/ml/analyze/{user_id}` | Admin |
| 7b | ML Analisis Batch | `POST` | `/api/ml/analyze/all` | Admin |
| 7c | ML Risk Summary | `GET` | `/api/ml/risk-summary` | Admin |
| 7e | ML Risk Trend | `GET` | `/api/ml/risk-trend` | Admin |
