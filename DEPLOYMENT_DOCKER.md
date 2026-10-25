# 🐳 Sirkula — Panduan Lengkap Deployment VPS dengan Docker

Dokumentasi resmi deployment seluruh ekosistem **Sirkula** (PostgreSQL, Flask Backend, ML Service, Next.js Admin Dashboard, dan Static Landing Page) ke Cloud VPS (Ubuntu 22.04 / 24.04 LTS) berbasis **Docker & Docker Compose**.

---

## 🎯 Saran & Mengapa Menggunakan Docker?

Dibandingkan dengan install manual (bare-metal) atau aaPanel:
1. **Bebas Masalah Versi & Dependency**: Ubuntu 24.04 menerapkan *externally managed environment* (PEP 668) pada Python, dan Next.js memerlukan Node.js 20 LTS. Dengan Docker, semua dependensi terisolasi rapi di dalam container tanpa bentrok dengan sistem operasi VPS.
2. **Otomatisasi Penuh**: Script `init_db.py` sudah terintegrasi ke *container startup* backend. Tabel database, rate poin sampah, dan akun admin default akan otomatis terbuat saat pertama kali dijalankan.
3. **Keamanan Port**: Port internal PostgreSQL (`5432`) dan ML Service (`5001`) hanya di-bind ke `127.0.0.1` (localhost), sehingga tidak terbuka ke publik dan aman dari serangan *brute force*.
4. **Satu Perintah untuk Semua**: Deploy atau update seluruh sistem cukup dengan `./deploy/docker-deploy.sh`.

---

## 🏗️ Arsitektur Sistem di VPS

```
                               ┌────────────────────────────────┐
                               │       Internet / Klien         │
                               │  (Browser & Mobile Flutter)    │
                               └───────────────┬────────────────┘
                                               │ Port 80 & 443 (HTTPS)
                                               ▼
                              ┌──────────────────────────────────┐
                              │     Nginx Host + Let's Encrypt   │
                              └──────┬────────────┬────────────┬─┘
                                     │            │            │
            ┌────────────────────────┘            │            └────────────────────────┐
            │ / (Landing Page)                    │ /api/ (REST API)                    │ /admin/ & /_next/
            ▼                                     ▼                                     ▼
 ┌──────────────────────┐              ┌──────────────────────┐              ┌──────────────────────┐
 │   /opt/sirkula/      │              │ Container:           │              │ Container:           │
 │   landing/           │              │ sirkula-backend      │              │ sirkula-admin        │
 │   (Static HTML)      │              │ (Port 5000)          │              │ (Port 3000)          │
 └──────────────────────┘              └──────────┬───────────┘              └──────────────────────┘
                                                  │
                                 ┌────────────────┴────────────────┐
                                 ▼                                 ▼
                      ┌──────────────────────┐          ┌──────────────────────┐
                      │ Container:           │          │ Container:           │
                      │ sirkula-db           │          │ sirkula-ml           │
                      │ (PostgreSQL 16)      │          │ (Port 5001)          │
                      └──────────────────────┘          └──────────────────────┘
```

---

## 📋 Kebutuhan Minimal VPS

- **OS**: Ubuntu 22.04 LTS atau 24.04 LTS (64-bit)
- **RAM**: Minimal 2 GB (Disarankan 4 GB, atau aktifkan 2 GB Swap jika RAM 2 GB agar lancar saat build Next.js)
- **Storage**: Minimal 20 GB SSD
- **Port Terbuka**: 80 (HTTP) dan 443 (HTTPS)

---

## 🚀 Langkah demi Langkah Deployment

### Langkah 1: Hubungkan DNS Domain ke IP VPS
Buka dashboard penyedia domain Anda (Cloudflare, Niagahoster, Namecheap, dll), lalu buat **A Record**:
- `A` | `@` | `IP_VPS_ANDA`
- `A` | `www` | `IP_VPS_ANDA`

---

### Langkah 2: Login ke VPS & Buat Swap (Rekomendasi untuk VPS RAM 2GB)
Buka terminal dan SSH ke VPS:
```bash
ssh root@IP_VPS_ANDA
```

Jika VPS Anda berkapasitas RAM 2 GB, jalankan perintah ini untuk membuat 2 GB Swap agar proses build Next.js tidak terkena error *Out of Memory*:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Langkah 3: Install Docker & Nginx di VPS
Jalankan perintah berikut untuk menginstal Docker, Docker Compose, Nginx, dan Certbot:

```bash
# Update paket sistem
sudo apt update && sudo apt upgrade -y

# Install Docker Engine & Plugin Docker Compose resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable --now docker

# Install Nginx & Certbot SSL
sudo apt install -y nginx certbot python3-certbot-nginx git curl
```

Periksa apakah Docker sudah aktif:
```bash
docker --version
docker compose version
```

---

### Langkah 4: Clone Repository & Setup Folder
```bash
sudo mkdir -p /opt/sirkula
sudo chown -R $USER:$USER /opt/sirkula
git clone https://github.com/USERNAME/REPO_ANDA.git /opt/sirkula
cd /opt/sirkula

# Beri izin eksekusi script deploy
chmod +x deploy/*.sh
```

---

### Langkah 5: Konfigurasi Environment Variable
Salin file template environment Docker:
```bash
cp .env.docker.example .env
nano .env
```
Sesuaikan konfigurasi berikut:
```env
# PostgreSQL
POSTGRES_DB=sirkula
POSTGRES_USER=sirkula_user
POSTGRES_PASSWORD=GantiDenganPasswordKuat123!

# Keamanan JWT (acak minimal 32 karakter)
JWT_SECRET_KEY=sirkula_super_secret_jwt_key_ubah_disini_ya_32_char

# Domain Publik
NEXT_PUBLIC_API_URL=https://sirkula.tech/api
CORS_ORIGINS=https://sirkula.tech,https://www.sirkula.tech
```
*Simpan file dengan menekan `Ctrl + O` -> `Enter`, lalu keluar dengan `Ctrl + X`.*

---

### Langkah 6: Jalankan Seluruh Container Docker
Jalankan perintah build dan start semua service:

```bash
docker compose up -d --build
```

Docker akan mengunduh image PostgreSQL, mem-build container Backend (Flask), ML Service, dan Next.js Admin Dashboard.

Cek status container:
```bash
docker compose ps
```
Semua container (`sirkula-db`, `sirkula-backend`, `sirkula-ml`, `sirkula-admin`) harus berstatus **Up / healthy**.

---

### Langkah 7: Konfigurasi Nginx & Pasang SSL (HTTPS)

1. Pasang konfigurasi Nginx Sirkula:
```bash
sudo cp /opt/sirkula/deploy/nginx/sirkula.conf /etc/nginx/sites-available/sirkula
sudo ln -sf /etc/nginx/sites-available/sirkula /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

2. Tes konfigurasi dan reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

3. Pasang sertifikat SSL gratis (Let's Encrypt):
```bash
sudo certbot --nginx -d sirkula.tech -d www.sirkula.tech
```
*Ikuti petunjuk di layar (masukkan email dan setujui Terms of Service).*

---

### Langkah 8: Verifikasi & Uji Coba

1. **Backend Health Check**:
   ```bash
   curl -s https://sirkula.tech/api/health
   ```
   Output yang diharapkan:
   ```json
   {"database":"connected","ml_service":"connected","service":"sirkula-backend","status":"healthy"}
   ```

2. **Landing Page**: Akses `https://sirkula.tech` di browser.
3. **Web Admin Dashboard**: Akses `https://sirkula.tech/admin/` di browser.
   - Login default:
     - **Email**: `admin@dlh.padang.go.id`
     - **Password**: `admin123`
   - *Catatan: Untuk mengganti password admin via docker:*
     ```bash
     docker compose exec backend-api python seed_admin.py --reset-password --password PasswordBaruAnda123!
     ```

4. **Koneksi Flutter Mobile**:
   Di file `mobile/lib/core/constants.dart`, pastikan:
   ```dart
   static const String apiBaseUrl = 'https://sirkula.tech/api';
   ```

---

## 🔄 Pemeliharaan & 1-Click Update

Setiap kali Anda selesai melakukan push kode baru dari lokal ke repository GitHub:
```bash
cd /opt/sirkula
./deploy/docker-deploy.sh
```
Script tersebut akan otomatis melakukan:
1. `git pull origin main`
2. Re-build container yang ada perubahan kode
3. Menjalankan ulang container tanpa mematikan database
4. Membersihkan image sampah (*dangling*)
5. Melakukan health check otomatis

---

## 🛠️ Docker Cheatsheet Penting

| Perintah | Deskripsi |
| :--- | :--- |
| `docker compose ps` | Melihat daftar & status container yang sedang berjalan |
| `docker compose logs -f backend-api` | Memantau log backend Flask secara *real-time* |
| `docker compose logs -f admin-web` | Memantau log Next.js |
| `docker compose logs -f ml-service` | Memantau log service Machine Learning |
| `docker compose restart backend-api` | Restart container backend saja |
| `docker compose exec backend-api bash` | Masuk ke terminal shell container backend |
| `docker compose down` | Menghentikan seluruh container (data DB tetap aman di volume) |
