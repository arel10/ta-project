# Struktur Folder dan File Backend Aplikasi (Flask API)

Dokumen ini menjelaskan struktur folder, subfolder, serta fungsi dari tiap-tiap file utama yang ada di dalam aplikasi **Backend (Flask API)**.

---

## 📂 Struktur Utama Proyek

Berikut adalah gambaran umum folder dan file di root directory `/api`:

```text
api/
├── .env                  # Variabel lingkungan (Environment Variables)
├── config.py             # Konfigurasi aplikasi Flask (DB, JWT, dll)
├── requirements.txt      # Daftar dependensi Python
├── run.py                # Main Entry Point untuk menjalankan backend
├── init_db.py            # Script inisialisasi / reset database
├── seed_admin.py         # Script seeding untuk membuat akun admin default
├── import_dlh_excel.py   # Script utility untuk import data lingkungan dari Excel
├── migrations/           # Folder database migrations (Alembic / Flask-Migrate)
├── uploads/              # Tempat penyimpanan file/gambar yang diunggah
└── app/                  # Kode sumber utama Flask
    ├── __init__.py       # Inisialisasi Flask App Factory
    ├── models/           # Definisi skema database (SQLAlchemy Models)
    ├── routes/           # Endpoint API (Blueprints)
    ├── services/         # Logika bisnis tambahan (Gamification, ML Client)
    └── utils/            # Fungsi helper pendukung
```

---

## 🛠️ Detail Berkas Konfigurasi di Root

| File / Folder | Kegunaan |
| :--- | :--- |
| **`.env`** | Menyimpan rahasia aplikasi seperti database URL, JWT secret key, dan alamat port service machine learning. |
| **`config.py`** | Memuat variabel dari `.env` dan menerjemahkannya ke dalam class objek konfigurasi Flask (`DevelopmentConfig`, `ProductionConfig`, dll). |
| **`requirements.txt`** | Menyimpan daftar pustaka Python yang wajib diinstal (seperti `Flask`, `Flask-SQLAlchemy`, `Flask-JWT-Extended`, `pandas`, `requests`, dsb). |
| **`run.py`** | Berkas utama yang dieksekusi untuk menjalankan web server Flask dalam mode pengembangan/produksi. |
| **`init_db.py`** | Script baris perintah (CLI) untuk membuat ulang skema tabel database berdasarkan model SQLAlchemy yang sudah dibuat. |
| **`seed_admin.py`** | Script untuk menyisipkan data pengguna awal (Admin) ke database agar sistem admin web dapat langsung login. |
| **`import_dlh_excel.py`**| Alat bantu (utility script) untuk memproses file excel laporan data lingkungan Dinas Lingkungan Hidup (DLH) ke database. |
| **`migrations/`** | Berisi file *history tracking* perubahan database untuk mempermudah pembaruan struktur tabel (*schema migrations*) tanpa menghapus data. |

---

## 💻 Isi Folder Sumber Kode (`app/`)

### 1. File `app/__init__.py`
Fungsi utama berkas ini adalah sebagai **App Factory**. Di dalamnya, dilakukan:
*   Inisialisasi aplikasi Flask.
*   Konfigurasi CORS (Cross-Origin Resource Sharing) agar web admin/mobile dapat berinteraksi dengan API.
*   Inisialisasi database SQLAlchemy dan pustaka keamanan Flask-JWT-Extended.
*   Pendaftaran (*registration*) seluruh Blueprints (Rute API).

---

### 2. Folder `app/models/` (Skema Database)
Setiap file mendefinisikan struktur tabel database yang digunakan oleh SQLAlchemy ORM.

*   `user.py` : Skema tabel pengguna (Admin, Member) yang menampung username, password terenkripsi, poin, email, dan biodata dasar.
*   `mission.py` : Skema tabel misi (`Mission`) dan keterlibatan pengguna dalam misi (`MissionParticipation`) untuk melacak status misi yang diselesaikan.
*   `reward.py` : Skema tabel barang hadiah (`Reward`) dan transaksi penukaran hadiah (`RewardTransaction`).
*   `badge.py` : Skema tabel lencana pencapaian (`Badge`) yang bisa diperoleh pengguna.
*   `point_setting.py` : Konfigurasi global tentang pembagian poin atau rule reward dalam aplikasi.
*   `waste_deposit.py` : Mencatat riwayat transaksi penyetoran sampah oleh member (berat, jenis, total poin didapat, foto bukti).
*   `waste_point_rate.py`: Daftar harga/poin per kilogram untuk setiap kategori jenis sampah (plastik, kertas, logam, dll).
*   `participation_risk.py`: Menyimpan riwayat penilaian risiko aktivitas/transaksi pengguna yang diproses oleh AI/ML.

---

### 3. Folder `app/routes/` (Endpoints API)
Mengatur rute URL (*endpoints*) yang dipisahkan menggunakan Flask Blueprints.

*   `auth.py` : Proses registrasi, login admin/member, dan penyegaran token JWT.
*   `deposits.py` : Endpoint untuk merekam data transaksi setor sampah anggota.
*   `gamification.py`: Endpoint bagi member untuk melihat daftar lencana, papan skor (*leaderboard*), dan progres misi mereka.
*   `rewards.py` : Endpoint untuk melihat katalog hadiah dan melakukan penukaran poin.
*   `ml.py` : Rute integrasi/penerusan data ke Machine Learning service (seperti klasifikasi sampah dan deteksi risiko transaksi).
*   `admin_common.py`: Logika rute umum yang dikhususkan bagi level otorisasi Admin.
*   **`admin/` (Rute Khusus Manajemen Admin)**
    *   `dashboard.py` : Menyediakan data statistik ringkas (total deposit, jumlah member aktif, grafik bulanan) untuk halaman utama admin.
    *   `data_management.py` : Melayani aksi CRUD (*Create, Read, Update, Delete*) untuk data-data master seperti rate sampah.
    *   `members.py` : Manajemen detail status keanggotaan (blokir, aktivasi, verifikasi data).
    *   `missions.py` : Membuat baru, menyunting, atau menghapus misi tantangan ramah lingkungan.
    *   `rewards.py` : Mengelola inventori hadiah fisik/digital dan memproses persetujuan klaim hadiah dari member.

---

### 4. Folder `src/services/` (Logika Bisnis Khusus)
Memisahkan kode logika proses yang rumit agar berkas *routes* tetap bersih dan mudah dibaca.

*   `gamification_service.py` : Mengurus seluruh sistem pencapaian pengguna seperti:
    *   Menghitung kenaikan poin pengguna setelah menyetor sampah.
    *   Mengecek apakah aksi pengguna memenuhi syarat penyelesaian suatu misi.
    *   Menganugerahkan lencana (*badge*) secara otomatis bila target telah tercapai.
*   `ml_service.py` : Jembatan penghubung yang bertugas mengirimkan data dari backend Flask ke REST API server **ML Service** (`ml-service`), mengambil hasil prediksi (misal: analisis kecurangan/risiko transaksi), lalu mengembalikannya ke sistem utama.
*   `simple_cache.py` : Cache memori sederhana untuk mempercepat response data yang jarang berubah (seperti harga rate sampah).

---

### 5. Folder `app/utils/` (Fungsi Pembantu)
*   `api_response.py` : Menyediakan fungsi terstandarisasi untuk mengirimkan respons JSON yang seragam (`success_response`, `error_response`) ke client agar format data di sisi Frontend (Admin Web & Mobile) tetap konsisten.
