# 🚀 Sirkula — Production Deployment Guide (Ubuntu 24.04 LTS)

Dokumentasi resmi deployment aplikasi **Sirkula** ke VPS / Cloud Server Ubuntu 24.04 LTS dengan domain **https://sirkula.tech**.

---

## 📋 Standard Architecture

```
                               ┌────────────────────────┐
                               │  Nginx Reverse Proxy   │
                               │     + SSL (443)        │
                               └───────────┬────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│ Landing Page    │               │ Backend API     │               │ Admin Dashboard │
│ Static HTML     │               │ Gunicorn (:5000)│               │ Next.js (:3000) │
└─────────────────┘               └────────┬────────┘               └─────────────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ ML Microservice │
                                  │ Gunicorn (:5001)│
                                  └─────────────────┘
```

---

## 1. Requirements

### Server Requirements
- **OS**: Ubuntu 24.04 LTS x86_64
- **RAM**: Minimum 2 GB (4 GB Direkomendasikan)
- **Disk**: Minimum 20 GB SSD
- **Network**: Port 80 (HTTP) & 443 (HTTPS) terbuka di firewall / security group

---

## 2. Initial Setup (Langkah Pertama)

1. **SSH ke VPS**:
   ```bash
   ssh root@YOUR_VPS_IP
   ```

2. **Clone & Jalankan Script Setup Otomatis**:
   ```bash
   sudo mkdir -p /opt/sirkula
   sudo chown -R $USER:$USER /opt/sirkula
   git clone https://github.com/YOUR_REPO/sirkula.git /opt/sirkula
   cd /opt/sirkula

   chmod +x deploy/setup-server.sh deploy/update.sh
   ./deploy/setup-server.sh
   ```

---

## 3. Database Setup (PostgreSQL)

```bash
sudo -u postgres psql <<EOF
CREATE USER sirkula_user WITH PASSWORD 'GANTI_PASSWORD_DATABASE_ANDA';
CREATE DATABASE sirkula OWNER sirkula_user;
GRANT ALL PRIVILEGES ON DATABASE sirkula TO sirkula_user;
EOF
```

---

## 4. Environment Variables

### A. Backend Environment (`/opt/sirkula/backend/.env`)
```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```
Isi konfigurasi berikut:
```env
FLASK_ENV=production
FLASK_DEBUG=0
DATABASE_URL=postgresql://sirkula_user:GANTI_PASSWORD_DATABASE_ANDA@localhost:5432/sirkula
JWT_SECRET_KEY=BEBAS_MINIMAL_32_KARAKTER_ACAK_SEKURITAS_TINGGI
ML_SERVICE_URL=http://127.0.0.1:5001
CORS_ORIGINS=https://sirkula.tech
UPLOAD_FOLDER=/opt/sirkula/backend/uploads
```

### B. Admin Dashboard Environment (`/opt/sirkula/admin/.env.local`)
```bash
cp admin/.env.production.example admin/.env.local
```
Isi:
```env
NEXT_PUBLIC_API_URL=https://sirkula.tech/api
```

---

## 5. Initial Build & Migrasi Database

```bash
# 1. Backend Venv & Migrasi
cd /opt/sirkula/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p uploads/ktp uploads/rewards
flask db upgrade
python init_db.py
python seed_admin.py --reset-password --password YOUR_ADMIN_PASSWORD
deactivate

# 2. ML Service Venv
cd /opt/sirkula/ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 3. Admin Dashboard Build
cd /opt/sirkula/admin
npm ci
npm run build
```

---

## 6. Systemd Services & Nginx

```bash
# Register Systemd services
sudo cp /opt/sirkula/deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sirkula-backend sirkula-ml sirkula-admin
sudo systemctl start sirkula-backend sirkula-ml sirkula-admin

# Register Nginx config
sudo cp /opt/sirkula/deploy/nginx/sirkula.conf /etc/nginx/sites-available/sirkula
sudo ln -sf /etc/nginx/sites-available/sirkula /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Domain & SSL Setup (HTTPS)

```bash
sudo certbot --nginx -d sirkula.tech -d www.sirkula.tech
```

---

## 8. Verifikasi Status Aplikasi (Health Check)

```bash
# Check Backend + DB + ML connection
curl -s https://sirkula.tech/api/health
# Response: {"database":"connected","ml_service":"connected","service":"sirkula-backend","status":"healthy"}
```

---

## 9. Deployment Update / Pemeliharaan (1-Click Update)

Setiap ada perubahan kode yang di-push ke repository `main`:

```bash
cd /opt/sirkula
./deploy/update.sh
```

---

## 10. Monitoring & Logs

```bash
# Backend Logs
sudo journalctl -u sirkula-backend -f

# ML Service Logs
sudo journalctl -u sirkula-ml -f

# Admin Dashboard Logs
sudo journalctl -u sirkula-admin -f

# Nginx Error Logs
sudo tail -f /var/log/nginx/error.log
```
