# Panduan Lengkap Install Package dan Migration Database (Windows)

Dokumen ini dibuat untuk proyek di folder:
D:\kulyeah\Sems 8\TA

Tujuan panduan ini:
1. Menyiapkan environment Python dengan benar.
2. Install semua package backend.
3. Menjalankan migration database dengan aman.
4. Menjalankan aplikasi setelah migration.
5. Menangani error umum yang sering bikin bingung.

---

## 1) Persiapan yang Harus Ada

Pastikan hal berikut sudah terpasang di Windows:
1. Python 3.11+ (disarankan 3.12 atau mendekati versi tim).
2. PostgreSQL (server database).
3. Git.
4. PowerShell.

Cek cepat versi (jalankan di PowerShell):

python --version
pip --version

Jika perintah python tidak dikenali, install Python dulu dan centang opsi Add Python to PATH.

---

## 2) Struktur Folder yang Dipakai

Kita fokus ke backend di folder:
D:\kulyeah\Sems 8\TA\api

File penting:
1. api\requirements.txt -> daftar package Python.
2. api\.env -> konfigurasi environment (database URL, secret, dll).
3. api\run.py -> entrypoint Flask.
4. api\migrations\ -> file migration Alembic (sudah dibuat).

---

## 3) Cara Setup Environment Python (Virtual Env)

Langkah dari root project:

1. Buka PowerShell.
2. Pindah ke root project:

cd "D:\kulyeah\Sems 8\TA"

3. Buat virtual env (sekali saja, jika belum ada):

python -m venv .venv

4. Aktifkan virtual env:

.\.venv\Scripts\Activate.ps1

Jika sukses, biasanya prompt terminal akan diawali (.venv).

Catatan jika kena error execution policy:
Jalankan PowerShell as Administrator lalu:

Set-ExecutionPolicy RemoteSigned

Pilih Y, lalu aktifkan venv lagi.

---

## 4) Install Package Backend

Setelah venv aktif:

1. Masuk ke folder API:

cd "D:\kulyeah\Sems 8\TA\api"

2. Install dependencies:

pip install -r requirements.txt

Tunggu sampai selesai.

Tips verifikasi:

pip list

Pastikan package seperti Flask, Flask-Migrate, SQLAlchemy, psycopg, python-dotenv ada.

---

## 5) Konfigurasi File .env

Di folder api, pastikan ada file .env.

Contoh nilai penting:

JWT_SECRET_KEY=isi_secret_kamu
DATABASE_URL=postgresql://postgres:password@localhost:5432/nama_db
FLASK_ENV=production
ML_SERVICE_URL=http://localhost:5001

Catatan penting:
1. Untuk SQLAlchemy modern, kode proyek sudah otomatis mengubah postgresql:// ke postgresql+psycopg://.
2. Pastikan database nama_db sudah dibuat di PostgreSQL.

---

## 6) Inisialisasi Migration (Sudah Pernah Dilakukan)

Folder migrations sudah ada di proyek ini.
Jadi normalnya kamu tidak perlu menjalankan init lagi.

Perintah init hanya dipakai sekali di awal proyek:

flask db init

Kalau dijalankan lagi saat folder migrations sudah ada, bisa error. Itu normal.

---

## 7) Alur Migration yang Benar (Sehari-hari)

Gunakan urutan ini setiap ada perubahan model database.

1. Aktifkan venv.
2. Masuk folder api.
3. Set FLASK_APP.
4. Generate migration.
5. Review file migration.
6. Apply migration ke database.

Perintah lengkap:

cd "D:\kulyeah\Sems 8\TA\api"
$env:FLASK_APP='run.py'
python -m flask db migrate -m "deskripsi perubahan"
python -m flask db upgrade

Contoh real:

python -m flask db migrate -m "add performance indexes"
python -m flask db upgrade

---

## 8) Cek Status Migration

Untuk lihat revision aktif saat ini:

python -m flask db current

Untuk lihat histori migration:

python -m flask db history

Untuk lihat head terbaru:

python -m flask db heads

Jika current sama dengan head, artinya database sudah up to date.

---

## 9) Kalau Mau Rollback Migration

Rollback 1 langkah:

python -m flask db downgrade -1

Rollback ke revision tertentu:

python -m flask db downgrade <revision_id>

Hati-hati downgrade pada production, karena bisa menghapus struktur/kolom/index tertentu.

---

## 10) Menjalankan Backend Setelah Migration

Masih di folder api dan venv aktif:

python run.py

Backend akan jalan di port default 5000 sesuai run.py.

Health check bisa dites via browser:

http://localhost:5000/api/health

---

## 11) Troubleshooting Error Umum

### A. ModuleNotFoundError
Penyebab:
1. Venv belum aktif.
2. Package belum terinstall.

Solusi:
1. Aktifkan venv lagi.
2. Ulang pip install -r requirements.txt.

### B. flask command tidak dikenali
Gunakan format ini (lebih aman):

python -m flask db current

Jangan bergantung pada executable global flask.

### C. Connection refused ke PostgreSQL
Penyebab:
1. Service PostgreSQL belum hidup.
2. Credential .env salah.
3. Port salah.

Solusi:
1. Start service PostgreSQL.
2. Cek DATABASE_URL.
3. Tes koneksi pakai tool DB (pgAdmin/DBeaver/psql).

### D. Target database is not up to date
Biasanya terjadi saat autogenerate migration tapi revision sebelumnya belum di-upgrade.

Solusi:

python -m flask db upgrade

baru setelah itu:

python -m flask db migrate -m "..."

### E. Multiple heads
Artinya ada percabangan migration.

Solusi umum:

python -m flask db merge -m "merge heads" <head1> <head2>
python -m flask db upgrade

Lakukan ini hati-hati, sebaiknya saat koordinasi tim.

---

## 12) Prosedur Standar yang Direkomendasikan Tim

Setiap mau coding backend:
1. Pull kode terbaru.
2. Aktifkan venv.
3. Pip install jika ada perubahan requirements.
4. Jalankan upgrade migration dulu.
5. Baru jalankan aplikasi.

Rangkaian singkat harian:

cd "D:\kulyeah\Sems 8\TA"
.\.venv\Scripts\Activate.ps1
cd api
pip install -r requirements.txt
$env:FLASK_APP='run.py'
python -m flask db upgrade
python run.py

---

## 13) Khusus Proyek Ini (Status Saat Dokumen Dibuat)

1. Folder migrations sudah tersedia.
2. Migration index performa sudah dibuat dan berhasil di-upgrade.
3. Revision saat ini sudah berada di head.

Cek ulang kapan saja dengan:

python -m flask db current

---

## 14) Checklist Cepat Jika Bingung

Kalau ada error, cek urut ini:
1. Sudah aktif .venv?
2. Sudah di folder api?
3. FLASK_APP sudah run.py?
4. DATABASE_URL di .env benar?
5. PostgreSQL service hidup?
6. Sudah jalankan db upgrade?

Kalau keenam poin ini benar, biasanya backend dan migration sudah aman.
