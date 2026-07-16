# 🔬 Reverse Engineering — Sistem Sirkula

> **Platform Digital Bank Sampah — Dinas Lingkungan Hidup Kota Padang**
> Seluruh informasi dalam dokumen ini diambil langsung dari source code.

---

## 1. Arsitektur Sistem

```
┌─────────────────────┐     ┌──────────────────────┐
│   Flutter Mobile     │     │  Next.js Admin       │
│   (Android/iOS)      │     │  Dashboard           │
│   Provider + Dio     │     │  React + Tailwind    │
└────────┬────────────┘     └────────┬─────────────┘
         │ HTTP/REST                  │ HTTP/REST (Axios)
         │ JWT Bearer                 │ JWT Bearer (Cookie)
         ▼                           ▼
┌──────────────────────────────────────────────────┐
│            Flask Backend API (:5000)              │
│  Blueprint Routes → Services → SQLAlchemy ORM    │
│  Flask-JWT-Extended · Flask-CORS · Marshmallow    │
└──────┬────────────────────────┬──────────────────┘
       │                        │ HTTP POST
       ▼                        ▼
┌──────────────┐     ┌─────────────────────────────┐
│ PostgreSQL   │     │ ML Service (Flask :5001)     │
│ 16-alpine    │     │ scikit-learn Random Forest   │
│              │     │ joblib · numpy               │
└──────────────┘     └─────────────────────────────┘
                              ▲
                              │ Loads .pkl files
                     ┌────────┴────────┐
                     │ model/           │
                     │  random_forest_  │
                     │  model.pkl       │
                     │  label_encoder   │
                     │  thresholds.pkl  │
                     └─────────────────┘
```

### Hubungan Antar Komponen

| Dari | Ke | Hubungan |
|---|---|---|
| **Flutter Mobile** | **Flask Backend** | REST API via Dio, autentikasi JWT Bearer di header |
| **Next.js Admin** | **Flask Backend** | REST API via Axios, JWT disimpan di cookie `access_token` |
| **Flask Backend** | **PostgreSQL** | SQLAlchemy ORM + psycopg driver |
| **Flask Backend** | **ML Service** | HTTP POST `/predict` dan `/predict/batch`, disimpan ke tabel `participation_risk` |
| **ML Service** | **Model files** | Load `random_forest_model.pkl`, `label_encoder.pkl`, `thresholds.pkl` via joblib |
| **Landing Page** | **Flask Backend** | Fetch stats dari `/api/admin/public/stats` |

---

## 2. Struktur Project

### 2.1 Root Project

```
TA/
├── api/                    # Flask Backend API
├── admin/                  # Next.js Admin Dashboard
├── mobile/                 # Flutter Mobile App
├── ml-service/             # ML Prediction Microservice
├── model/                  # Pre-trained ML model files (.pkl)
├── data/                   # Raw Excel data (DLH)
├── landing/                # Static HTML landing page
├── design/                 # Design assets
├── doc/                    # Documentation
├── image/                  # Image assets
├── thunder-client/         # API test collections
├── docker-compose.yml      # Docker orchestration
└── .gitignore
```

### 2.2 Backend API (`api/`)

```
api/
├── app/
│   ├── __init__.py               # Flask app factory, extensions init, blueprints
│   ├── models/
│   │   ├── __init__.py           # Model exports
│   │   ├── user.py               # User model (member/admin)
│   │   ├── waste_deposit.py      # Waste deposit transactions
│   │   ├── mission.py            # Mission + UserMission models
│   │   ├── badge.py              # Badge + UserBadge models
│   │   ├── reward.py             # Reward + RewardRedemption models
│   │   ├── participation_risk.py # ML prediction results
│   │   ├── waste_point_rate.py   # Configurable waste-to-point rates
│   │   └── point_setting.py      # Level threshold settings
│   ├── routes/
│   │   ├── __init__.py           # Routes package init
│   │   ├── auth.py               # Auth blueprint (/api/auth)
│   │   ├── deposits.py           # Deposits blueprint (/api/deposits)
│   │   ├── gamification.py       # Gamification blueprint (/api/gamification)
│   │   ├── rewards.py            # Rewards blueprint (/api/rewards)
│   │   ├── ml.py                 # ML blueprint (/api/ml)
│   │   ├── admin_common.py       # Shared admin helpers (dashboard data, file utils)
│   │   └── admin/
│   │       ├── __init__.py       # Admin blueprint factory
│   │       ├── dashboard.py      # Admin dashboard KPIs, trends
│   │       ├── data_management.py# Import/export/reset data
│   │       ├── gamification.py   # Waste rates, point settings mgmt
│   │       ├── members.py        # Member CRUD
│   │       ├── missions.py       # Mission CRUD
│   │       ├── rewards.py        # Reward + Badge CRUD, image upload
│   │       └── public.py         # Public landing stats (no auth)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gamification_service.py  # Points, levels, missions, badges
│   │   ├── ml_service.py            # Feature calc, ML predict, risk summary
│   │   └── simple_cache.py          # In-memory TTL cache
│   └── utils/
│       └── api_response.py       # Standardized error response
├── config.py                     # Config classes (Dev/Prod/Test)
├── run.py                        # Entry point
├── init_db.py                    # DB initialization & seeding
├── seed_admin.py                 # Admin user seeder
├── import_dlh_excel.py           # DLH Excel data importer
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Container build
└── migrations/                   # Alembic migrations
```

### 2.3 Mobile App (`mobile/`)

```
mobile/lib/
├── main.dart                  # App entry, router, providers, theme
├── core/
│   ├── api_client.dart        # Singleton Dio HTTP client + JWT interceptor
│   ├── constants.dart         # API URLs, routes, labels
│   ├── exceptions.dart        # Custom exception classes
│   ├── theme.dart             # Theme configuration
│   └── helpers/
│       └── token_helper.dart  # SharedPreferences token storage
├── models/
│   ├── user_model.dart        # User data model
│   ├── deposit_model.dart     # Deposit data model
│   ├── mission_model.dart     # Mission data model
│   ├── reward_model.dart      # Reward data model
│   └── waste_point_rate_model.dart  # Waste rate model
└── features/
    ├── auth/
    │   ├── auth_provider.dart     # Login/register/logout state
    │   ├── login_screen.dart      # Login UI
    │   └── register_screen.dart   # Register UI
    ├── home/
    │   ├── home_provider.dart     # Dashboard summary data
    │   └── home_screen.dart       # Home tab with bottom nav
    ├── setor/
    │   ├── setor_provider.dart    # Deposit submission logic
    │   └── setor_screen.dart      # Waste deposit form UI
    ├── reward/
    │   ├── reward_provider.dart        # Reward catalog & redemption
    │   ├── leaderboard_provider.dart   # Leaderboard data
    │   ├── reward_screen.dart          # Reward catalog UI
    │   ├── reward_detail_screen.dart   # Reward detail + redeem
    │   └── reward_leaderboard_screen.dart  # Leaderboard UI
    ├── profil/
    │   ├── profil_provider.dart    # Profile & badges data
    │   ├── profil_screen.dart      # Profile UI
    │   └── edit_profile_screen.dart# Edit profile form
    ├── riwayat/
    │   ├── riwayat_provider.dart   # Deposit history data
    │   └── riwayat_setoran_screen.dart  # History list UI
    ├── misi/
    │   └── misi_screen.dart       # Active missions UI
    ├── notification/
    │   ├── notification_provider.dart
    │   └── notification_screen.dart
    ├── splash/
    │   └── splash_screen.dart     # Splash/loading screen
    └── support/
        └── support_center_screen.dart  # Help/support page
```

### 2.4 Admin Dashboard (`admin/`)

```
admin/src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Landing page (public)
│   ├── globals.css             # Global styles
│   ├── landing.css             # Landing page styles
│   ├── (auth)/
│   │   ├── layout.tsx          # Auth layout
│   │   └── login/
│   │       └── page.tsx        # Admin login page
│   └── (dashboard)/
│       ├── layout.tsx          # Dashboard sidebar layout
│       └── dashboard/
│           ├── page.tsx        # Main dashboard (KPIs, charts)
│           ├── deposits/       # Deposit management
│           ├── members/        # Member management
│           ├── missions/       # Mission management
│           ├── rewards/        # Reward management
│           ├── risk/           # ML risk analysis
│           └── settings/       # Gamification settings
├── components/
│   ├── layout/                 # Sidebar, header
│   ├── providers/              # Auth context provider
│   └── ui/                     # Radix UI components
├── hooks/                      # Custom React hooks
├── lib/
│   ├── axios.ts                # Axios instance with interceptors
│   └── utils.ts                # Formatters, helpers
├── types/                      # TypeScript type definitions
└── middleware.ts               # Next.js route protection
```

### 2.5 ML Service (`ml-service/`)

```
ml-service/
├── app.py                  # Flask app, model loading, prediction endpoints
├── feature_calculator.py   # RFM feature calculation utilities
├── load_models.py          # Model verification script
├── requirements.txt        # Python dependencies
└── Dockerfile              # Container build
```

### 2.6 Model Files (`model/`)

```
model/
├── random_forest_model.pkl     # Trained Random Forest classifier (~1.2MB)
├── label_encoder.pkl           # Label encoder for risk classes
├── thresholds.pkl              # RFM threshold values
├── dataset_fitur_rfm.csv       # Training dataset with RFM features
├── confusion_matrix.png        # Model evaluation visualization
├── distribusi_label.png        # Label distribution chart
├── feature_importance.png      # Feature importance chart
└── Data DLH.xlsx               # Raw DLH data
```

---

## 3. Tech Stack

### Backend API

| Library | Versi | Kegunaan |
|---|---|---|
| Flask | 3.1.0 | Web framework backend |
| Flask-SQLAlchemy | 3.1.1 | ORM database PostgreSQL |
| Flask-Migrate | 4.1.0 | Database migration (Alembic) |
| Flask-JWT-Extended | 4.7.1 | JWT authentication & authorization |
| Flask-CORS | 5.0.1 | Cross-Origin Resource Sharing |
| Flask-Marshmallow | 1.2.1 | Object serialization |
| marshmallow-sqlalchemy | 1.1.0 | SQLAlchemy-Marshmallow integration |
| marshmallow | 3.23.2 | Schema validation & serialization |
| psycopg[binary] | ≥3.2.10 | PostgreSQL driver (psycopg3) |
| python-dotenv | 1.0.1 | Environment variable loading |
| requests | 2.32.3 | HTTP client (ML Service calls) |
| python-dateutil | 2.9.0 | Date parsing utilities |
| openpyxl | 3.1.5 | Excel file reading/writing |
| gunicorn | 23.0.0 | Production WSGI server |
| Werkzeug | 3.1.3 | WSGI utilities, password hashing |

### ML Service

| Library | Versi | Kegunaan |
|---|---|---|
| Flask | ≥3.1.0 | Microservice web framework |
| scikit-learn | ≥1.8.0 | Random Forest model, prediction |
| pandas | ≥3.0.0 | Data manipulation |
| numpy | ≥2.4.0 | Numerical operations, feature arrays |
| joblib | ≥1.4.0 | Model serialization/deserialization |

### Mobile App (Flutter)

| Library | Versi | Kegunaan |
|---|---|---|
| Flutter SDK | ^3.10.1 | Mobile framework |
| provider | ^6.1.2 | State management |
| dio | ^5.7.0 | HTTP client |
| shared_preferences | ^2.3.4 | Local storage (token, prefs) |
| go_router | ^14.8.1 | Navigation routing |
| google_fonts | ^6.2.1 | Typography (Poppins) |
| intl | ^0.19.0 | Internationalization, date formatting |
| cached_network_image | ^3.4.1 | Image caching |
| shimmer | ^3.0.0 | Loading skeleton UI |
| flutter_svg | ^2.0.17 | SVG rendering |

### Admin Dashboard (Next.js)

| Library | Versi | Kegunaan |
|---|---|---|
| Next.js | 14.2.35 | React framework (App Router) |
| React | ^18 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^3.4.1 | Utility-first CSS |
| axios | ^1.15.0 | HTTP client |
| js-cookie | ^3.0.5 | Cookie management (JWT token) |
| recharts | ^3.8.1 | Charts & data visualization |
| react-hook-form | ^7.72.1 | Form state management |
| zod | ^4.3.6 | Schema validation |
| sonner | ^2.0.7 | Toast notifications |
| lucide-react | ^1.14.0 | Icon library |
| @radix-ui/* | various | Headless UI components (Dialog, Select, Tabs, etc.) |
| class-variance-authority | ^0.7.1 | Component variant styling |
| clsx + tailwind-merge | latest | Conditional classname merging |

### Database & Infrastructure

| Technology | Versi | Kegunaan |
|---|---|---|
| PostgreSQL | 16-alpine | Relational database |
| Docker Compose | 3.8 | Container orchestration |

---

## 4. Flow Request

### 4.1 Flow Umum (Member → Deposit)

```
Member (Flutter App)
    │
    ▼
HTTP POST /api/deposits
  Headers: Authorization: Bearer <JWT>
  Body: { "waste_type": "p1", "weight_kg": 2.5 }
    │
    ▼
Flask Route (deposits_bp)
  @jwt_required → get_jwt_identity()
    │
    ▼
Validation:
  - Check user exists
  - Validate waste_type against active WastePointRate codes
  - Validate weight_kg > 0
    │
    ▼
Create WasteDeposit(status='pending', points_earned=0)
  db.session.add() → db.session.commit()
    │
    ▼
Response JSON { deposit, estimated_points }
    │
    ▼
Flutter UI: "Menunggu validasi admin"
```

### 4.2 Flow Validasi Admin

```
Admin (Next.js Dashboard)
    │
    ▼
HTTP PUT /api/deposits/<id>/validate
  Headers: Authorization: Bearer <JWT>
  Cookie: access_token
    │
    ▼
Flask Route (deposits_bp → validate_deposit)
  @jwt_required → _require_admin()
    │
    ▼
1. calculate_points(weight_kg, waste_type)
   → Rumus: weight_kg × points_per_kg (dari WastePointRate)
    │
    ▼
2. Update deposit: status='validated', points_earned=points
   Update user: total_points += points
   db.session.commit()
    │
    ▼
3. check_mission_progress(user_id)
   → Loop semua Mission aktif
   → Update/create UserMission
   → Jika completed: user.total_points += mission.points_reward
    │
    ▼
4. sync_user_level_and_badges(user_id)
   → Recalculate level berdasarkan total_points
   → Check semua badge eligibility
   → Add/remove UserBadge records
    │
    ▼
Response JSON { deposit, points_earned }
```

### 4.3 Flow ML Prediction

```
Admin triggers /api/ml/analyze/all
    │
    ▼
ml_service.predict_batch()
    │
    ▼
Batch aggregate query: recency, frequency, consistency per user
    │
    ▼
HTTP POST → ML Service /predict/batch
  Body: [{ user_id, recency, frequency, consistency }, ...]
    │
    ▼
ML Service:
  features = np.array([[recency, frequency, consistency]])
  prediction = model.predict(features)
  proba = model.predict_proba(features)
  risk_level = label_encoder.inverse_transform([prediction])
    │
    ▼
Response: { predictions: [{ user_id, risk_level, confidence_score }] }
    │
    ▼
Save to participation_risk table per user
    │
    ▼
Dashboard shows risk distribution
```

---

## 5. Backend Architecture

### Blueprints & Route Registration
Sumber: [__init__.py](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L46-L59)

| Blueprint | URL Prefix | File |
|---|---|---|
| `auth_bp` | `/api/auth` | [auth.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py) |
| `deposits_bp` | `/api/deposits` | [deposits.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py) |
| `gamification_bp` | `/api/gamification` | [gamification.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py) |
| `rewards_bp` | `/api/rewards` | [rewards.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py) |
| `admin_bp` | `/api/admin` | [admin/__init__.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/admin/__init__.py) |
| `ml_bp` | `/api/ml` | [ml.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py) |

### Service Layer

| Service | File | Fungsi |
|---|---|---|
| GamificationService | [gamification_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py) | Points calculation, level system, mission progress, badge eligibility |
| MLService | [ml_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py) | RFM feature calculation, ML prediction, risk summary/trend |
| SimpleCache | [simple_cache.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/simple_cache.py) | In-memory TTL caching |

### Middleware & Authentication

- **JWT**: Flask-JWT-Extended dengan token di header `Authorization: Bearer <token>`
- **Admin check**: Helper function `_require_admin(user)` digunakan di setiap admin route
- **Error handlers**: JWT expired/invalid/missing handlers di [__init__.py](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L62-L72)
- **CORS**: Configured untuk `localhost:3000`, `localhost:3001`, `localhost:59657`
- **File size limit**: `MAX_CONTENT_LENGTH = 6MB`, `MAX_REWARD_IMAGE_SIZE = 5MB`

### Error Handling Pattern

Sumber: [api_response.py](file:///d:/kulyeah/Sems%208/TA/api/app/utils/api_response.py)

```python
# Standard error response format
{
    "error": {
        "code": "validation_error",
        "message": "Nama, email, dan password wajib diisi",
        "fields": { "name": "required", "email": "required" }
    }
}
```

Global error handlers di [__init__.py](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L79-L90):
- `RequestEntityTooLarge` → 413
- `HTTPException` → HTTP error code
- `Exception` (catch-all) → 500

---

## 6. REST API — Daftar Seluruh Endpoint

### Auth (`/api/auth`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ message, user, access_token, refresh_token }` | Flutter RegisterScreen |
| POST | `/api/auth/login` | `{ email, password }` | `{ message, user, access_token, refresh_token }` | Flutter LoginScreen, Admin Login |
| POST | `/api/auth/refresh` | — (refresh token di header) | `{ access_token }` | Token refresh |
| GET | `/api/auth/me` | — | `{ user }` | Flutter ProfilScreen, AuthProvider |
| PUT | `/api/auth/me` | `{ name?, email?, account_number?, gender?, nik?, address?, department? }` | `{ message, user }` | Flutter EditProfileScreen |

### Deposits (`/api/deposits`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| POST | `/api/deposits` | `{ weight_kg, waste_type }` | `{ message, deposit, estimated_points }` | Flutter SetorScreen |
| GET | `/api/deposits/waste-point-rates` | — | `{ rates: [...] }` | Flutter SetorScreen (dropdown) |
| GET | `/api/deposits/my` | `?page=&per_page=` | `{ deposits, total, page, pages }` | Flutter RiwayatScreen, HomeScreen |
| GET | `/api/deposits/pending` | `?page=&per_page=` | `{ deposits, total, page, pages }` | Admin deposits page |
| PUT | `/api/deposits/<id>/validate` | `{ actual_weight_kg? }` | `{ message, deposit, points_earned }` | Admin deposits page |
| PUT | `/api/deposits/<id>/reject` | `{ rejection_reason }` | `{ message, deposit }` | Admin deposits page |
| GET | `/api/deposits/all` | `?page=&per_page=&status=&waste_type=` | `{ deposits, total, page, pages }` | Admin deposits page |

### Gamification (`/api/gamification`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| GET | `/api/gamification/missions` | — | `{ missions: [...] }` | Flutter MisiScreen, HomeScreen |
| GET | `/api/gamification/leaderboard` | — | `{ leaderboard, current_user_rank }` | Flutter LeaderboardScreen |
| GET | `/api/gamification/badges/my` | — | `{ earned_badges, available_badges, total_earned, total_available }` | Flutter ProfilScreen |
| GET | `/api/gamification/summary` | — | `{ user_id, name, total_points, level, level_progress, badges_earned, ... }` | Flutter HomeScreen, ProfilScreen |

### Rewards (`/api/rewards`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| GET | `/api/rewards` | — | `{ rewards: [...] }` | Flutter RewardScreen |
| POST | `/api/rewards/redeem` | `{ reward_id }` | `{ message, redemption, remaining_points, ... }` | Flutter RewardDetailScreen |
| GET | `/api/rewards/redemptions/my` | `?page=&per_page=` | `{ redemptions, total, page, pages }` | Flutter Reward history |
| PUT | `/api/rewards/redemptions/<id>/approve` | — | `{ message, redemption }` | Admin rewards page |
| PUT | `/api/rewards/redemptions/<id>/reject` | `{ rejection_reason }` | `{ message, redemption, refunded_points }` | Admin rewards page |
| GET | `/api/rewards/redemptions/pending` | `?page=&per_page=` | `{ redemptions, total, page, pages }` | Admin rewards page |
| GET | `/api/rewards/redemptions/history` | `?page=&per_page=&status=` | `{ redemptions, total, page, pages }` | Admin rewards page |

### ML (`/api/ml`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| POST | `/api/ml/analyze/<user_id>` | — | `{ message, risk_profile }` | Admin risk page |
| POST | `/api/ml/analyze/all` | — | `{ message, total_requested, total_analyzed, ... }` | Admin risk page |
| GET | `/api/ml/risk-summary` | — | `{ total_analyzed, distribution, users, high_risk_users, ... }` | Admin risk page |
| GET | `/api/ml/risk-trend` | — | `{ data: [...] }` | Admin dashboard charts |

### Admin (`/api/admin`)

| Method | URL | Body | Response | Digunakan di |
|---|---|---|---|---|
| GET | `/api/admin/dashboard` | — | `{ stats, deposit_trend, risk_distribution }` | Admin dashboard |
| GET | `/api/admin/dashboard/kpis` | — | `{ success, data: {...} }` | Admin dashboard |
| GET | `/api/admin/dashboard/trend` | `?days=30` | `{ success, data: [...] }` | Admin dashboard charts |
| GET | `/api/admin/dashboard/risk-distribution` | — | `{ success, data: {...} }` | Admin dashboard |
| GET | `/api/admin/dashboard/recent-pending` | — | `{ success, data: [...] }` | Admin dashboard |
| GET | `/api/admin/deposits` | `?page=&per_page=&status=&search=` | `{ success, data: {...} }` | Admin deposits |
| GET | `/api/admin/members` | `?page=&per_page=&search=&risk_level=&sort_by=` | `{ members, total, page, pages }` | Admin members |
| POST | `/api/admin/members` | `{ name, email, password, ... }` | `{ message, member }` | Admin members |
| GET | `/api/admin/members/<id>` | — | `{ member, stats, risk_profile, recent_deposits }` | Admin member detail |
| PUT | `/api/admin/members/<id>` | `{ name?, email?, ... }` | `{ message, member }` | Admin member edit |
| DELETE | `/api/admin/members/<id>` | — | `{ message }` | Admin member delete |
| GET | `/api/admin/missions` | — | `{ missions: [...] }` | Admin missions |
| POST | `/api/admin/missions` | `{ title, target_type, target_value, points_reward, ... }` | `{ message, mission }` | Admin missions |
| PUT | `/api/admin/missions/<id>` | `{ title?, ... }` | `{ message, mission }` | Admin missions |
| DELETE | `/api/admin/missions/<id>` | — | `{ message, mission }` | Admin missions (soft-delete: set `is_active=false`) |
| GET | `/api/admin/rewards` | — | `{ rewards: [...] }` | Admin rewards |
| POST | `/api/admin/rewards` | `{ name, points_cost, stock, ... }` | `{ message, reward }` | Admin rewards |
| PUT | `/api/admin/rewards/<id>` | `{ name?, ... }` | `{ message, reward }` | Admin rewards |
| PATCH | `/api/admin/rewards/<id>/stock` | `{ add_stock }` | `{ message, reward }` | Admin rewards |
| POST | `/api/admin/reward-images` | multipart/form-data `image` | `{ message, image_url }` | Admin reward image upload |
| GET | `/api/admin/reward-images/<filename>` | — | Binary image file | Admin reward display |
| GET | `/api/admin/badges` | — | `{ badges: [...] }` | Admin badges |
| POST | `/api/admin/badges` | `{ name, condition_type, condition_value, ... }` | `{ message, badge, sync }` | Admin badges |
| GET | `/api/admin/redemptions/summary` | — | `{ pending_count, total_points_held, ... }` | Admin rewards |
| GET | `/api/admin/waste-point-rates` | — | `{ rates: [...] }` | Admin settings |
| POST | `/api/admin/waste-point-rates` | `{ code, name, category, points_per_kg }` | `{ message, rate }` | Admin settings |
| PUT | `/api/admin/waste-point-rates` | `{ rates: [...] }` | `{ message, rates }` | Admin settings |
| GET | `/api/admin/point-settings` | — | `{ settings: [...] }` | Admin settings |
| PUT | `/api/admin/point-settings` | `{ settings: [...] }` | `{ message, settings, level_badges, sync }` | Admin settings |
| POST | `/api/admin/sync-gamification` | — | `{ message, level_badges, sync }` | Admin settings |
| POST | `/api/admin/data/import` | `{ check_duplicates?, limit? }` | `{ message, import, sync }` | Admin data mgmt |
| POST | `/api/admin/data/import/members` | multipart/form-data `file` | `{ message, sheet, stats }` | Admin data mgmt |
| POST | `/api/admin/data/import/deposits` | multipart/form-data `file` | `{ message, import, sync }` | Admin data mgmt |
| GET | `/api/admin/data/export/users` | — | CSV file | Admin data mgmt |
| GET | `/api/admin/data/export/deposits` | — | CSV file | Admin data mgmt |
| POST | `/api/admin/data/reset` | — | `{ message, deleted }` | Admin data mgmt |
| GET | `/api/admin/risk-trend` | `?months=6` | `{ success, data: [...] }` | Admin risk page |
| GET | `/api/admin/public/stats` | — (no auth) | `{ stats, waste_breakdown }` | Landing page |
| GET | `/api/admin/public/badges` | — (no auth) | `{ badges: [...] }` | Landing page |

### ML Service Endpoints (Internal, port 5001)

| Method | URL | Body | Response |
|---|---|---|---|
| GET | `/health` | — | `{ status, service, model_loaded, ... }` |
| POST | `/predict` | `{ user_id, recency, frequency, consistency }` | `{ user_id, risk_level, confidence_score }` |
| POST | `/predict/batch` | `[{ user_id, recency, frequency, consistency }, ...]` | `{ predictions, errors, total_predicted, total_errors }` |
| GET | `/model/info` | — | `{ model_type, n_estimators, feature_importances, classes, thresholds }` |

### Health Check

| Method | URL | Response |
|---|---|---|
| GET | `/api/health` | `{ status: "healthy", service: "sirkula-backend" }` |

---

## 7. Authentication

### Register
Sumber: [auth.py#L14-L75](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L14-L75)

1. Validasi: `name`, `email`, `password` wajib diisi; password min 6 karakter
2. Cek email duplikat
3. Generate `account_number`: format `SRK-XXXXXX` (random 6 digit)
4. Password di-hash dengan `werkzeug.security.generate_password_hash()`
5. Buat user dengan `role='member'`
6. Generate `access_token` dan `refresh_token`
7. Return user data + kedua token

### Login
Sumber: [auth.py#L78-L113](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L78-L113)

1. Validasi email dan password
2. Query user by email
3. Verifikasi password dengan `check_password_hash()`
4. Generate `access_token` (expire: 1 jam dev, 30 menit prod) dan `refresh_token` (expire: 30 hari)
5. Return user data + tokens

### JWT Configuration
Sumber: [config.py#L27-L30](file:///d:/kulyeah/Sems%208/TA/api/config.py#L27-L30)

| Setting | Value |
|---|---|
| `JWT_ACCESS_TOKEN_EXPIRES` | 1 hour (dev) / 30 min (prod) |
| `JWT_REFRESH_TOKEN_EXPIRES` | 30 days |
| `JWT_TOKEN_LOCATION` | `['headers']` |
| `JWT_SECRET_KEY` | From env `JWT_SECRET_KEY` |

### Refresh Token
Sumber: [auth.py#L116-L125](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L116-L125)

- Endpoint: `POST /api/auth/refresh`
- Dekorator: `@jwt_required(refresh=True)`
- Return: new `access_token`

### Role System

| Role | Deskripsi |
|---|---|
| `member` | User biasa (mobile app) |
| `admin` | Administrator (dashboard) |

Pengecekan admin: `user.is_admin` → `user.role == 'admin'`

### Mobile Auth Flow
Sumber: [auth_provider.dart](file:///d:/kulyeah/Sems%208/TA/mobile/lib/features/auth/auth_provider.dart)

1. Token disimpan di `SharedPreferences` via `TokenHelper`
2. Pada startup: `checkAuth()` → cek token → fetch `/auth/me`
3. Dio interceptor: attach `Bearer <token>` ke setiap request
4. Pada 401: clear token → panggil `onUnauthorized` callback → force logout
5. Admin role ditolak di mobile app (L69-L73)

### Admin Auth Flow
Sumber: [middleware.ts](file:///d:/kulyeah/Sems%208/TA/admin/src/middleware.ts), [axios.ts](file:///d:/kulyeah/Sems%208/TA/admin/src/lib/axios.ts)

1. Token disimpan di cookie `access_token`
2. Next.js middleware: redirect `/dashboard/*` ke `/login` jika tidak ada token
3. Axios interceptor: attach `Bearer <token>` dari cookie
4. Pada 401: hapus cookies → redirect ke `/login`

---

## 8. Database Schema

### Entity Relationship Diagram (ERD Teks)

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│    users      │──┬──│  waste_deposits  │     │   missions    │
│──────────────│  │  │─────────────────│     │──────────────│
│ PK id         │  │  │ PK id            │     │ PK id         │
│ name          │  │  │ FK user_id →users│     │ title         │
│ email (UNQ)   │  │  │ weight_kg        │     │ target_type   │
│ password_hash │  │  │ waste_type       │     │ target_value  │
│ account_number│  │  │ activity_type    │     │ points_reward │
│ gender        │  │  │ source_waste_lab.│     │ period        │
│ nik           │  │  │ source_price_kg  │     │ FK waste_type_│
│ address       │  │  │ source_total_sav.│     │    code       │
│ department    │  │  │ status           │     │ is_active     │
│ role          │  │  │ points_earned    │     │ target_label  │
│ level         │  │  │ rejection_reason │     │ deadline      │
│ total_points  │  │  │ created_at       │     │ created_at    │
│ created_at    │  │  │ validated_at     │     └───────┬──────┘
└──┬───────────┘  │  │ FK validated_by  │             │
   │              │  │   →users         │             │
   │              │  └─────────────────┘             │
   │              │                                    │
   │  ┌───────────┼──────────────────────────────────┘
   │  │           │
   │  │  ┌────────────────┐     ┌──────────────┐
   │  │  │ user_missions   │     │   badges      │
   │  │  │────────────────│     │──────────────│
   │  │  │ PK id           │     │ PK id         │
   │  └──│ FK user_id      │     │ name (UNQ)    │
   │     │ FK mission_id   │     │ description   │
   │     │ progress         │     │ icon_url      │
   │     │ is_completed     │     │ condition_type│
   │     │ completed_at     │     │ condition_value│
   │     │ UQ(user,mission) │     └───────┬──────┘
   │     └────────────────┘             │
   │                                     │
   │     ┌────────────────┐             │
   │     │  user_badges    │             │
   │     │────────────────│             │
   │     │ PK id           │             │
   ├─────│ FK user_id      │             │
   │     │ FK badge_id ────┼─────────────┘
   │     │ earned_at        │
   │     │ UQ(user,badge)   │
   │     └────────────────┘
   │
   │     ┌──────────────────┐     ┌──────────────┐
   │     │reward_redemptions │     │   rewards     │
   │     │──────────────────│     │──────────────│
   │     │ PK id             │     │ PK id         │
   ├─────│ FK user_id        │     │ name          │
   │     │ FK reward_id ─────┼─────│ description   │
   │     │ points_spent      │     │ points_cost   │
   │     │ status             │     │ stock         │
   │     │ rejection_reason   │     │ image_url     │
   │     │ redemption_code    │     │ is_active     │
   │     │ created_at         │     │ created_at    │
   │     └──────────────────┘     └──────────────┘
   │
   │     ┌──────────────────┐
   │     │participation_risk │
   │     │──────────────────│
   │     │ PK id             │
   └─────│ FK user_id (UNQ)  │
         │ recency_days      │
         │ frequency         │
         │ consistency_score │
         │ risk_level        │
         │ confidence_score  │
         │ predicted_at      │
         └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│waste_point_rates │     │  point_settings   │
│─────────────────│     │──────────────────│
│ PK id            │     │ PK id             │
│ code (UNQ)       │     │ key (UNQ)         │
│ name             │     │ name              │
│ category         │     │ value             │
│ points_per_kg    │     │ sort_order        │
│ is_active        │     │ updated_at        │
│ sort_order       │     └──────────────────┘
│ updated_at       │
└─────────────────┘
```

### Tabel Detail

#### `users`
- **Fungsi**: Menyimpan data user (member & admin)
- **PK**: `id` (Integer, auto-increment)
- **Indexes**: `email` (unique), `account_number` (unique), `nik`, composite indexes pada `(role, created_at)`, `(role, total_points)`, `(role, name)`
- **Relasi**: One-to-Many ke `waste_deposits`, `user_missions`, `user_badges`, `reward_redemptions`; One-to-One ke `participation_risk`

#### `waste_deposits`
- **Fungsi**: Menyimpan data setoran sampah
- **PK**: `id`
- **FK**: `user_id → users.id`, `validated_by → users.id`
- **Status values**: `pending`, `validated`, `rejected`
- **Indexes**: 6 composite indexes untuk query optimization

#### `missions`
- **Fungsi**: Menyimpan definisi misi
- **PK**: `id`
- **FK**: `waste_type_code → waste_point_rates.code` (nullable)
- **`target_type`**: `deposit_count` atau `weight`
- **`target_label`**: `null` (semua), `high`, `medium`, `low` (filter per risk level)

#### `user_missions`
- **Fungsi**: Menyimpan progress misi per user
- **PK**: `id`
- **FK**: `user_id → users.id`, `mission_id → missions.id`
- **Constraint**: `UNIQUE(user_id, mission_id)`

#### `badges`
- **Fungsi**: Definisi badge/pencapaian
- **PK**: `id`
- **`condition_type`**: `deposit_count`, `total_weight`, `points`
- **`condition_value`**: Threshold numerik

#### `user_badges`
- **Fungsi**: Badge yang dimiliki user
- **Constraint**: `UNIQUE(user_id, badge_id)`

#### `rewards`
- **Fungsi**: Katalog reward yang bisa ditukar
- **PK**: `id`
- **Indexes**: composite `(is_active, points_cost)`, `created_at`

#### `reward_redemptions`
- **Fungsi**: Riwayat penukaran reward
- **`status`**: `pending`, `approved`, `rejected`
- **`redemption_code`**: Format `SRK-XXXXXXXX` (8 hex chars)

#### `participation_risk`
- **Fungsi**: Hasil prediksi ML per user
- **Constraint**: `user_id` unique (one-to-one)
- **`risk_level`**: `low`, `medium`, `high`

#### `waste_point_rates`
- **Fungsi**: Konfigurasi poin per kg per jenis sampah
- **`code`**: Kode singkat (P1, P2, K1, B1, MJ, dll)
- **Default**: 20 jenis sampah (9 plastik, 6 kertas, 4 logam, 1 minyak)

#### `point_settings`
- **Fungsi**: Konfigurasi threshold level
- **Default**: Bronze (0), Silver (5000), Gold (10000), Platinum (15000)

---

## 9. Business Logic

### 9.1 Perhitungan Point
Sumber: [gamification_service.py#L95-L98](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L95-L98)

```
points = weight_kg × points_per_kg
```

`points_per_kg` diambil dari tabel `waste_point_rates` berdasarkan kode waste type. Contoh rates:

| Code | Nama | Points/Kg |
|---|---|---|
| P1 | Gelas Air Mineral Bersih | 4,000 |
| P3 | 600mL & 1L Bersih | 4,200 |
| L1 | Kaleng Lunak | 9,600 |
| MJ | Minyak Jelantah | 5,000 |
| K6 | Karton Telur | 100 |

Jika waste type tidak ditemukan, fallback ke legacy rates (plastik=100, kertas=80, dll).

### 9.2 Perhitungan Level
Sumber: [gamification_service.py#L208-L215](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L208-L215)

```
Level = threshold tertinggi yang ≤ total_points
```

Default thresholds (konfigurabel oleh admin via `point_settings`):

| Level | Threshold |
|---|---|
| Bronze | 0 |
| Silver | 5,000 |
| Gold | 10,000 |
| Platinum | 15,000 |

### 9.3 Level Progress
Sumber: [gamification_service.py#L218-L253](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L218-L253)

```
progress_percent = ((total_points - current_threshold) / (next_threshold - current_threshold)) × 100
```

Jika sudah Platinum (level terakhir): `progress_percent = 100%`

### 9.4 Badge System
Sumber: [gamification_service.py#L329-L372](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L329-L372)

3 tipe badge:

| `condition_type` | Logika |
|---|---|
| `deposit_count` | `validated_deposit_count >= condition_value` |
| `total_weight` | `total_validated_weight >= condition_value` |
| `points` | `user.total_points >= condition_value` |

Level badges otomatis dibuat per level threshold: "Badge Level Bronze", "Badge Level Silver", dst. (Sumber: [gamification_service.py#L175-L205](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L175-L205))

### 9.5 Mission Engine
Sumber: [gamification_service.py#L258-L324](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L258-L324)

Mission memiliki:
- **`target_type`**: `deposit_count` atau `weight`
- **`waste_type_code`**: Opsional filter jenis sampah
- **`target_label`**: Opsional filter risk level user (`high`, `medium`, `low`)
- **`period`**: `daily` atau `weekly` (informational, tidak ada auto-reset)

Progress calculation:
```
if target_type == 'deposit_count':
    progress = count(validated_deposits filtered by waste_type)
elif target_type == 'weight':
    progress = sum(weight_kg of validated_deposits filtered by waste_type)

if progress >= target_value:
    is_completed = True
    user.total_points += mission.points_reward
```

### 9.6 Reward Redemption
Sumber: [rewards.py#L37-L105](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L37-L105)

1. Cek reward aktif & stok > 0
2. Cek `user.total_points >= reward.points_cost`
3. Kurangi user points: `user.total_points -= reward.points_cost`
4. Kurangi stok: `reward.stock -= 1`
5. Buat `RewardRedemption(status='pending', redemption_code='SRK-XXXXXXXX')`
6. Sync ulang level & badges (karena points berkurang)
7. **Rejection refund**: Points dikembalikan + stock dikembalikan

### 9.7 Leaderboard
Sumber: [gamification.py#L62-L107](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py#L62-L107)

- Top 10 member by `total_points` descending
- Current user rank: `COUNT(members with more points) + 1`
- Cache: per-week, invalidated awal minggu baru

### 9.8 Sync Level & Badges
Sumber: [gamification_service.py#L392-L447](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L392-L447)

Full reconciliation: recalculate level, check all badge eligibility, add missing badges, remove unqualified badges. Dipanggil setelah:
- Deposit validated
- Reward redeemed
- Reward redemption rejected (refund)
- Admin mengubah point settings

---

## 10. Machine Learning

### 10.1 Model
- **Algorithm**: Random Forest Classifier
- **File**: [random_forest_model.pkl](file:///d:/kulyeah/Sems%208/TA/model/random_forest_model.pkl) (1.2MB)
- **Label Encoder**: [label_encoder.pkl](file:///d:/kulyeah/Sems%208/TA/model/label_encoder.pkl)
- **Thresholds**: [thresholds.pkl](file:///d:/kulyeah/Sems%208/TA/model/thresholds.pkl)
- **Training data**: [dataset_fitur_rfm.csv](file:///d:/kulyeah/Sems%208/TA/model/dataset_fitur_rfm.csv)

### 10.2 Feature Engineering (RFM)
Sumber: [ml_service.py#L37-L84](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L37-L84), [feature_calculator.py](file:///d:/kulyeah/Sems%208/TA/ml-service/feature_calculator.py)

| Feature | Rumus | Deskripsi |
|---|---|---|
| **Recency** | `max(0, (now - last_deposit_date).days)` | Hari sejak setoran terakhir |
| **Frequency** | `count(validated_deposits)` | Total setoran tervalidasi |
| **Consistency** | `active_months / 6` | Rasio bulan aktif terhadap 6 bulan observasi |

**Observation period**: 6 bulan (`OBSERVATION_MONTHS = 6`)

### 10.3 Prediction Flow
Sumber: [app.py#L74-L93](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L74-L93)

```python
features = np.array([[recency, frequency, consistency]])
prediction_encoded = model.predict(features)[0]
probabilities = model.predict_proba(features)[0]
risk_level = label_encoder.inverse_transform([prediction_encoded])[0]
confidence_score = float(max(probabilities))
```

### 10.4 Risk Level Normalization
Sumber: [ml_service.py#L18-L34](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L18-L34)

Input ML di-normalize: `low risk → low`, `medium risk → medium`, `high risk → high`, unknown → `unknown`

### 10.5 Batch Prediction
Sumber: [ml_service.py#L129-L265](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L129-L265)

1. Aggregate query: `MAX(created_at)`, `COUNT(id)` per user (validated deposits)
2. Second query: `COUNT(DISTINCT date_trunc('month', created_at))` per user (consistency)
3. Build batch features array
4. Send to ML Service `/predict/batch`
5. Bulk upsert to `participation_risk` table

### 10.6 Model Loading
Sumber: [app.py#L41-L71](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L41-L71)

Model di-load sekali saat startup via `load_models()` menggunakan `joblib.load()`. Disimpan sebagai global variables `model`, `label_encoder`, `thresholds`.

---

## 11. Gamification Engine

### Point Calculation
```python
# gamification_service.py#L95-L98
def calculate_points(weight_kg, waste_type):
    rate = get_points_rate(waste_type)  # Lookup dari waste_point_rates table
    return int(weight_kg * rate)
```

### Level Calculation
```python
# gamification_service.py#L208-L215
def calculate_user_level(total_points):
    levels = get_levels()  # From point_settings table
    level_name = levels[0][1]  # Default: 'Bronze'
    for threshold, name in levels:
        if total_points >= threshold:
            level_name = name
    return level_name
```

### Badge Eligibility Check
```python
# gamification_service.py#L329-L372
def check_badge_eligibility(user_id):
    for badge in all_badges:
        if badge.condition_type == 'deposit_count':
            earned = validated_count >= badge.condition_value
        elif badge.condition_type == 'total_weight':
            earned = total_weight >= badge.condition_value
        elif badge.condition_type == 'points':
            earned = user.total_points >= badge.condition_value
        
        if earned and badge.id not in already_earned:
            db.session.add(UserBadge(user_id, badge.id))
```

### Mission Progress Check
```python
# gamification_service.py#L258-L324
def check_mission_progress(user_id):
    for mission in active_missions:
        if mission.target_type == 'deposit_count':
            progress = count(validated_deposits)
        elif mission.target_type == 'weight':
            progress = sum(weight_kg)
        
        if progress >= mission.target_value:
            user.total_points += mission.points_reward
```

### Full Sync Function
```python
# gamification_service.py#L392-L447
def sync_user_level_and_badges(user_id):
    user.level = calculate_user_level(total_points)
    eligible_ids = check_all_badges()
    to_add = eligible_ids - currently_earned
    to_remove = currently_earned - eligible_ids
```

### Leaderboard
```python
# gamification.py#L62-L107
# Top 10 members by total_points DESC
# Cached per week (invalidated at week start)
# Current user rank = COUNT(members with more points) + 1
```

---

## 12. Prediction Flow (End-to-End)

```
1. Transaksi Baru (Flutter POST /api/deposits)
    ↓
2. Status = 'pending' → disimpan ke waste_deposits
    ↓
3. Admin validates (PUT /api/deposits/<id>/validate)
    ↓
4. Points dihitung: weight_kg × points_per_kg
    ↓
5. user.total_points += points
    ↓
6. check_mission_progress(user_id)
    → Loop semua misi aktif
    → Update progress, award mission points jika completed
    ↓
7. sync_user_level_and_badges(user_id)
    → Recalculate level
    → Check semua badge eligibility
    → Add/remove badges
    ↓
8. db.session.commit()
    ↓
9. Admin triggers ML analysis (POST /api/ml/analyze/all)
    ↓
10. Backend calculates RFM features per user (aggregate queries)
    ↓
11. HTTP POST → ML Service /predict/batch
     → Random Forest model.predict()
     → label_encoder.inverse_transform()
    ↓
12. Results saved to participation_risk table
    ↓
13. Dashboard updated: risk distribution, high-risk users
    ↓
14. Missions with target_label filter show/hide based on user risk level
```

---

## 13. Dashboard Admin

### Halaman & API yang Digunakan

| Halaman | File | API Endpoints |
|---|---|---|
| **Dashboard** | `dashboard/page.tsx` | `GET /api/admin/dashboard/kpis`, `/dashboard/trend`, `/dashboard/risk-distribution`, `/dashboard/recent-pending` |
| **Members** | `dashboard/members/page.tsx` | `GET /api/admin/members`, `POST /api/admin/members`, `PUT /api/admin/members/<id>`, `DELETE /api/admin/members/<id>`, `GET /api/admin/members/<id>` |
| **Deposits** | `dashboard/deposits/page.tsx` | `GET /api/admin/deposits`, `PUT /api/deposits/<id>/validate`, `PUT /api/deposits/<id>/reject` |
| **Missions** | `dashboard/missions/page.tsx` | `GET /api/admin/missions`, `POST /api/admin/missions`, `PUT /api/admin/missions/<id>`, `DELETE /api/admin/missions/<id>` |
| **Rewards** | `dashboard/rewards/page.tsx` | `GET /api/admin/rewards`, `POST /api/admin/rewards`, `PUT /api/admin/rewards/<id>`, `POST /api/admin/reward-images`, `GET /api/rewards/redemptions/pending`, `PUT /api/rewards/redemptions/<id>/approve`, `PUT /api/rewards/redemptions/<id>/reject` |
| **Risk Analysis** | `dashboard/risk/page.tsx` | `GET /api/ml/risk-summary`, `POST /api/ml/analyze/all`, `POST /api/ml/analyze/<id>`, `GET /api/admin/risk-trend` |
| **Settings** | `dashboard/settings/page.tsx` | `GET /api/admin/waste-point-rates`, `PUT /api/admin/waste-point-rates`, `GET /api/admin/point-settings`, `PUT /api/admin/point-settings`, `POST /api/admin/sync-gamification`, `POST /api/admin/data/import/*`, `GET /api/admin/data/export/*`, `POST /api/admin/data/reset` |
| **Login** | `(auth)/login/page.tsx` | `POST /api/auth/login` |

---

## 14. Mobile App

### Halaman & Detail

| Halaman | File | UI | API | State Management | Navigasi |
|---|---|---|---|---|---|
| **Splash** | `splash_screen.dart` | Loading indicator | — | AuthProvider (checkAuth) | Auto-redirect ke login/home |
| **Login** | `login_screen.dart` | Email/password form, validasi client | `POST /auth/login` | AuthProvider | → Home atau → Register |
| **Register** | `register_screen.dart` | Name/email/phone/password form | `POST /auth/register` | AuthProvider | → Home |
| **Home (Beranda)** | `home_screen.dart` | Points, level, progress bar, misi aktif, recent deposits | `GET /gamification/summary`, `GET /gamification/missions`, `GET /deposits/my` | HomeProvider | Bottom nav 4 tab |
| **Setor** | `setor_screen.dart` | Dropdown jenis sampah, input berat, estimasi poin | `GET /deposits/waste-point-rates`, `POST /deposits` | SetorProvider | Tab 2 |
| **Reward** | `reward_screen.dart` | Katalog reward, kategori filter | `GET /rewards` | RewardProvider | Tab 3 |
| **Reward Detail** | `reward_detail_screen.dart` | Detail reward, tombol tukar | `POST /rewards/redeem` | RewardProvider | Push dari reward list |
| **Leaderboard** | `reward_leaderboard_screen.dart` | Top 10 users, current rank | `GET /gamification/leaderboard` | LeaderboardProvider | Push dari reward |
| **Profil** | `profil_screen.dart` | Info user, badges, stats | `GET /auth/me`, `GET /gamification/summary`, `GET /gamification/badges/my` | ProfilProvider | Tab 4 |
| **Edit Profil** | `edit_profile_screen.dart` | Edit name/email/gender/nik/address/department | `PUT /auth/me` | ProfilProvider | Push dari profil |
| **Riwayat Setoran** | `riwayat_setoran_screen.dart` | List semua deposit, filter by type | `GET /deposits/my`, `GET /gamification/summary` | RiwayatProvider | Push dari home |
| **Misi** | `misi_screen.dart` | List misi aktif + progress | `GET /gamification/missions` | HomeProvider | Push dari home |
| **Notifikasi** | `notification_screen.dart` | List notifikasi | — | NotificationProvider | Push dari home |
| **Support** | `support_center_screen.dart` | Help/FAQ | — | — | Push dari profil |

### State Management Pattern

Semua provider menggunakan **ChangeNotifier** (Provider package):
- `_isLoading` flag untuk loading state
- `_errorMessage` untuk error feedback
- `notifyListeners()` pada setiap state change
- Try-catch dengan custom exceptions: `ApiException`, `NetworkException`, `TimeoutException`, `UnauthorizedException`

---

## 15. Dependency Graph

```
Login (Flutter/Admin)
  ↓
AuthProvider / Axios Interceptor
  ↓
JWT Token (SharedPreferences / Cookie)
  ↓
ApiClient (Dio / Axios)
  ↓
Flask Routes (auth_bp, deposits_bp, gamification_bp, rewards_bp, ml_bp, admin_bp)
  ↓
Middleware: @jwt_required → get_jwt_identity() → _require_admin()
  ↓
Services Layer
  ├── GamificationService
  │     ├── calculate_points() ← WastePointRate
  │     ├── calculate_user_level() ← PointSetting
  │     ├── check_mission_progress() ← Mission, UserMission, WasteDeposit
  │     ├── check_badge_eligibility() ← Badge, UserBadge, WasteDeposit
  │     └── sync_user_level_and_badges() ← all above
  ├── MLService
  │     ├── calculate_features() ← WasteDeposit
  │     ├── predict_single/batch() → HTTP → ML Service
  │     └── save → ParticipationRisk
  └── SimpleCache
        └── In-memory TTL cache for rates, settings, leaderboard, rewards
  ↓
SQLAlchemy Models → PostgreSQL
  ↓
ML Service (Flask :5001)
  └── joblib.load() → Random Forest → predict()
```

---

## 16. Sequence Diagram (Kode)

### Deposit Validation Sequence

```
User         Flutter       Flask Backend          GamificationService    Database       ML Service
 │              │               │                        │                  │               │
 │──setor──────→│               │                        │                  │               │
 │              │──POST /deposits→                       │                  │               │
 │              │               │──validate waste_type──→│                  │               │
 │              │               │                        │──query rates────→│               │
 │              │               │                        │←─────rates───────│               │
 │              │               │──INSERT deposit(pending)────────────────→│               │
 │              │←──201 + est. points──│                  │                  │               │
 │←─────UI────→│               │                        │                  │               │
 │              │               │                        │                  │               │
Admin        Dashboard      Flask Backend          GamificationService    Database       ML Service
 │              │               │                        │                  │               │
 │──validate───→│               │                        │                  │               │
 │              │──PUT /<id>/validate→                    │                  │               │
 │              │               │──calculate_points()───→│                  │               │
 │              │               │                        │──get_points_rate→│               │
 │              │               │                        │←─rate────────────│               │
 │              │               │←──points──────────────│                  │               │
 │              │               │──UPDATE deposit(validated)──────────────→│               │
 │              │               │──UPDATE user.total_points───────────────→│               │
 │              │               │──check_mission_progress()─→│             │               │
 │              │               │                        │──query missions─→│               │
 │              │               │                        │──update progress→│               │
 │              │               │                        │  (if completed:  │               │
 │              │               │                        │   award points)  │               │
 │              │               │──sync_user_level_and_badges()→│          │               │
 │              │               │                        │──recalc level──→│               │
 │              │               │                        │──check badges──→│               │
 │              │               │                        │──add/remove────→│               │
 │              │←──200 + points earned──│               │                  │               │
 │←─────UI────→│               │                        │                  │               │
```

---

## 17. Error Handling

### Backend Error Handling

**Standardized error response** (sumber: [api_response.py](file:///d:/kulyeah/Sems%208/TA/api/app/utils/api_response.py)):
```python
def error_response(message, code, status=400, fields=None):
    return jsonify({"error": {"code": code, "message": message, "fields": clean_fields}}), status
```

**Global handlers** (sumber: [__init__.py#L79-L90](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L79-L90)):
- `RequestEntityTooLarge` → 413
- `HTTPException` → dynamic status
- `Exception` (catch-all) → 500

**JWT handlers** (sumber: [__init__.py#L62-L72](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L62-L72)):
- `expired_token_loader` → 401 "Token telah kedaluwarsa"
- `invalid_token_loader` → 401 "Token tidak valid"
- `unauthorized_loader` → 401 "Token tidak ditemukan"

**Service-level try-catch**:
- [gamification_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py): `SQLAlchemyError` → `db.session.rollback()`
- [ml_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py): `requests.exceptions.RequestException` → log error, return None
- [ml.py routes](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py): Generic `Exception` → 500 with error string

**Validation rollback**: Point settings update validates threshold ordering, rollback on invalid (sumber: [admin/gamification.py#L278-L284](file:///d:/kulyeah/Sems%208/TA/api/app/routes/admin/gamification.py#L278-L284))

### Mobile Error Handling
Sumber: [exceptions.dart](file:///d:/kulyeah/Sems%208/TA/mobile/lib/core/exceptions.dart), [api_client.dart#L100-L128](file:///d:/kulyeah/Sems%208/TA/mobile/lib/core/api_client.dart#L100-L128)

Custom exceptions:
- `ApiException` (with statusCode)
- `NetworkException`
- `UnauthorizedException`
- `TimeoutException`

DioException mapping:
- `connectionTimeout/sendTimeout/receiveTimeout` → `TimeoutException`
- `connectionError` → `NetworkException`
- `badResponse` → Parse error message from response body, 401 → `UnauthorizedException`

### Admin Error Handling
Sumber: [axios.ts](file:///d:/kulyeah/Sems%208/TA/admin/src/lib/axios.ts)

Response interceptor: 401 → clear cookies → redirect to `/login`

---

## 18. Security

### Password Hashing
Sumber: [user.py#L37-L41](file:///d:/kulyeah/Sems%208/TA/api/app/models/user.py#L37-L41)

```python
from werkzeug.security import generate_password_hash, check_password_hash

def set_password(self, password):
    self.password_hash = generate_password_hash(password)  # pbkdf2:sha256

def check_password(self, password):
    return check_password_hash(self.password_hash, password)
```

> **Catatan**: Menggunakan Werkzeug `pbkdf2:sha256`, bukan `bcrypt`. Library bcrypt **tidak ditemukan** dalam dependency.

### JWT
- Secret key dari environment variable `JWT_SECRET_KEY`
- Default development key: `dev-secret-key-please-change-to-32-bytes-min`
- Token di header `Authorization: Bearer <token>`

### Authorization
- Role-based: `member` vs `admin`
- Admin check per-route: `_require_admin(user)` → 403 if not admin
- Mobile app menolak login admin (client-side check)

### Input Validation
- Backend: manual validation di setiap route (field checks, length, type)
- Frontend: form validation + Zod schemas (admin)
- Password minimum length: 6 characters

### SQL Injection Protection
- SQLAlchemy ORM queries (parameterized)
- `ilike()` pattern used for search (potential LIKE injection, tapi parameterized)
- Raw SQL hanya di `import_dlh_excel.py` untuk schema migration (`text()`)

### CORS
Sumber: [__init__.py#L34-L41](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py#L34-L41)

- Allowed origins: `localhost:3000`, `localhost:3001`, `localhost:59657`
- Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Supports credentials: True

### Upload Security
Sumber: [admin_common.py#L17-L18](file:///d:/kulyeah/Sems%208/TA/api/app/routes/admin_common.py#L17-L18), [admin/rewards.py#L26-L70](file:///d:/kulyeah/Sems%208/TA/api/app/routes/admin/rewards.py#L26-L70)

- Allowed extensions: `png`, `jpg`, `jpeg`, `webp`
- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`
- Max size: 5MB (validated server-side)
- `werkzeug.utils.secure_filename()` untuk sanitasi nama file
- File disimpan dengan UUID unique filename
- Path traversal protection: `os.path.basename(filename) != filename` check

---

## 19. Performance

### Database Indexes
Sumber: Seluruh model files

| Table | Index | Columns |
|---|---|---|
| users | `ix_users_role_created_at` | (role, created_at) |
| users | `ix_users_role_total_points` | (role, total_points) |
| users | `ix_users_role_name` | (role, name) |
| users | `ix_users_nik` | nik |
| waste_deposits | `ix_waste_deposits_status` | status |
| waste_deposits | `ix_waste_deposits_created_at` | created_at |
| waste_deposits | `ix_waste_deposits_user_status` | (user_id, status) |
| waste_deposits | `ix_waste_deposits_status_created_at` | (status, created_at) |
| waste_deposits | `ix_waste_deposits_user_created_at` | (user_id, created_at) |
| waste_deposits | `ix_waste_deposits_status_waste_created` | (status, waste_type, created_at) |
| rewards | `ix_rewards_is_active_points_cost` | (is_active, points_cost) |
| participation_risk | `ix_participation_risk_risk_level` | risk_level |
| participation_risk | `ix_participation_risk_predicted_at` | predicted_at |
| reward_redemptions | Multiple | status, (status, created_at), (user_id, created_at) |

### Connection Pool
Sumber: [config.py#L20-L24](file:///d:/kulyeah/Sems%208/TA/api/config.py#L20-L24)

```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_size': 10,
    'max_overflow': 20,
}
```

### Caching
Sumber: [simple_cache.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/simple_cache.py)

In-memory TTL cache:

| Key | TTL | Data |
|---|---|---|
| `waste_point_rates_active` | 300s (5 min) | Active waste point rates |
| `point_settings` | 300s (5 min) | Level threshold settings |
| `rewards_active` | 120s (2 min) | Active rewards catalog |
| `leaderboard:{year}-W{week}` | Until next week start | Top 10 leaderboard |

Cache invalidation: `invalidate_cache(key)` dipanggil setelah admin update rates/rewards.

### ML Model Loading
Model di-load sekali saat startup (`load_models()` di module level). Tidak ada reload mechanism.

### Batch Processing
- Excel import: batch commit setiap `batch_size` (default 2000) rows
- ML batch prediction: single HTTP request dengan semua user features, timeout 300s
- Batch prediction uses O(1) feature lookup with `feature_map` dict

### Potential Bottlenecks
1. **`sync_all_users_levels_and_badges()`**: Iterates ALL members, runs N+1 queries per user
2. **`check_mission_progress()`**: Re-queries all deposits per mission per user
3. **Leaderboard rank calculation**: Full table scan `COUNT(members with more points)`
4. **Risk summary**: Loads ALL risk profiles + users in one query (no pagination)

---

## 20. Deployment

### Docker Compose
Sumber: [docker-compose.yml](file:///d:/kulyeah/Sems%208/TA/docker-compose.yml)

| Service | Container | Port | Depends On |
|---|---|---|---|
| PostgreSQL 16 | `sirkula-db` | 5432 | — |
| Flask Backend | `sirkula-backend` | 5000 | postgres (healthy) |
| ML Service | `sirkula-ml` | 5001 | — |
| Next.js Admin | `sirkula-admin` | 3000 | backend-api |

### Environment Variables

**Backend** (`.env` / `.env.development`):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: JWT signing secret
- `ML_SERVICE_URL`: ML service URL (default: `http://localhost:5001`)
- `FLASK_ENV`: `development` / `production`
- `CORS_ORIGINS`: Comma-separated allowed origins
- `MAX_CONTENT_LENGTH`, `MAX_REWARD_IMAGE_SIZE`, `UPLOAD_FOLDER`

**ML Service**:
- `MODEL_DIR`: Path to model directory (default: `../model`)
- `ML_HOST`: Bind host (default: `0.0.0.0`)
- `ML_PORT`: Port (default: `5001`)

**Admin Dashboard**:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:5000/api`)

### Menjalankan Development

```bash
# 1. Database (Docker)
docker compose up postgres -d

# 2. Backend API
cd api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python init_db.py        # Create tables + seed
python run.py            # Start on :5000

# 3. ML Service
cd ml-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py            # Start on :5001

# 4. Admin Dashboard
cd admin
npm install
npm run dev              # Start on :3000

# 5. Mobile App
cd mobile
flutter pub get
flutter run              # Run on device/emulator
```

### Data Import

```bash
cd api
python import_dlh_excel.py --commit          # Import from data/Data DLH.xlsx
python import_dlh_excel.py --limit 100       # Dry-run first 100 rows
python seed_admin.py                          # Create admin user
```

---

## 21. Knowledge Base

### Semua Folder Penting

| Path | Konten |
|---|---|
| `api/app/models/` | 8 SQLAlchemy model files |
| `api/app/routes/` | 6 route files + admin/ package (7 files) |
| `api/app/services/` | 3 service files |
| `api/app/utils/` | 1 utility file |
| `mobile/lib/features/` | 10 feature folders |
| `mobile/lib/core/` | API client, constants, exceptions, theme |
| `mobile/lib/models/` | 5 data model files |
| `admin/src/app/(dashboard)/dashboard/` | 6 page folders + 1 page |
| `ml-service/` | 3 Python files |
| `model/` | 3 .pkl + 1 .csv + 3 .png |

### Semua Models (10)
`User`, `WasteDeposit`, `Mission`, `UserMission`, `Badge`, `UserBadge`, `Reward`, `RewardRedemption`, `ParticipationRisk`, `WastePointRate`, `PointSetting`

### Semua Services (3)
`gamification_service.py`, `ml_service.py`, `simple_cache.py`

### Semua Blueprints (6)
`auth_bp`, `deposits_bp`, `gamification_bp`, `rewards_bp`, `admin_bp`, `ml_bp`

### Semua Provider (Mobile, 8)
`AuthProvider`, `HomeProvider`, `SetorProvider`, `RewardProvider`, `LeaderboardProvider`, `ProfilProvider`, `RiwayatProvider`, `NotificationProvider`

### Semua Rumus

| Rumus | Formula |
|---|---|
| Points | `weight_kg × points_per_kg` |
| Level | Highest threshold ≤ total_points |
| Level Progress | `(points - current_threshold) / (next - current) × 100` |
| Badge (deposit_count) | `validated_count >= condition_value` |
| Badge (total_weight) | `total_weight >= condition_value` |
| Badge (points) | `total_points >= condition_value` |
| Mission (deposit_count) | `count(validated_deposits [filtered]) >= target_value` |
| Mission (weight) | `sum(weight_kg [filtered]) >= target_value` |
| Recency | `(now - last_deposit).days` |
| Frequency | `count(validated_deposits)` |
| Consistency | `active_months / 6` |
| Redemption Code | `SRK-{uuid4.hex[:8].upper()}` |
| Account Number | `SRK-{random 100000-999999}` |
| User Rank | `count(members with more points) + 1` |

### Semua Konfigurasi

| Key | Default | Source |
|---|---|---|
| JWT Access Expire | 1h (dev) / 30m (prod) | config.py |
| JWT Refresh Expire | 30 days | config.py |
| Pool Size | 10 | config.py |
| Max Overflow | 20 | config.py |
| Max Content Length | 6MB | config.py |
| Max Reward Image | 5MB | config.py |
| ML Observation Months | 6 | ml_service.py |
| ML Batch Timeout | 300s | config.py |
| Cache TTL (rates) | 300s | gamification_service.py |
| Cache TTL (rewards) | 120s | rewards.py |
| API Base URL (mobile) | http://192.168.1.13:5000/api | constants.dart |

---

## 22. Reverse Engineering — Cara Sistem Bekerja

### Alur Lengkap Sistem dari Awal hingga Akhir

```
1. USER MEMBUKA APLIKASI MOBILE
   └── main.dart → SirkulaApp → GoRouter
   └── AuthProvider.checkAuth() → TokenHelper.isLoggedIn()
   └── Jika token ada: GET /api/auth/me → verifikasi token
   └── Jika tidak ada/expired: redirect ke LoginScreen

2. USER LOGIN
   └── LoginScreen → AuthProvider.login(email, password)
   └── POST /api/auth/login
       └── Flask: User.query.filter_by(email) → check_password_hash()
       └── create_access_token(identity=str(user.id))
       └── create_refresh_token(identity=str(user.id))
   └── Response: { user, access_token, refresh_token }
   └── Mobile: TokenHelper.saveToken(access_token)
   └── Mobile: SharedPreferences.setString(user data)
   └── GoRouter redirect → HomeScreen

3. HOME SCREEN LOADS
   └── HomeProvider.fetchDashboardSummary()
   └── GET /api/gamification/summary
       └── Count badges, missions, deposits, weight
       └── get_level_progress(total_points)
   └── GET /api/gamification/missions (filtered by risk label)
   └── GET /api/deposits/my?page=1&per_page=5
   └── UI renders: points, level, progress bar, missions, recent deposits

4. USER MEMBUAT SETORAN SAMPAH
   └── SetorScreen → SetorProvider.fetchWastePointRates()
       └── GET /api/deposits/waste-point-rates
       └── Display dropdown jenis sampah + poin/kg
   └── User pilih jenis, input berat → submit
   └── SetorProvider.submitDeposit(wasteCode, weightKg)
       └── POST /api/deposits { waste_type, weight_kg }
       └── Flask: validate waste_type against active rates
       └── INSERT waste_deposits(status='pending', points_earned=0)
       └── Response: { deposit, estimated_points }
   └── UI: "Menunggu validasi admin"

5. ADMIN LOGIN KE DASHBOARD
   └── Admin buka localhost:3000 → Next.js middleware
   └── Jika tidak ada cookie access_token → redirect /login
   └── POST /api/auth/login { email, password }
   └── Cookie: access_token = jwt_token
   └── Redirect → /dashboard

6. ADMIN VALIDASI SETORAN
   └── Dashboard → GET /api/admin/deposits?status=pending
   └── Admin klik "Validate" → PUT /api/deposits/<id>/validate
   └── Flask Backend:
       a. calculate_points(weight_kg, waste_type)
          └── Lookup WastePointRate → weight × rate
       b. deposit.status = 'validated'
          deposit.points_earned = points
       c. user.total_points += points
       d. db.session.commit()
       e. check_mission_progress(user_id)
          └── Loop semua Mission aktif
          └── Hitung progress (deposit count atau total weight)
          └── Jika progress >= target_value:
              └── is_completed = True
              └── user.total_points += mission.points_reward
       f. sync_user_level_and_badges(user_id)
          └── user.level = calculate_user_level(total_points)
              └── Loop levels, ambil tertinggi yang ≤ total_points
          └── Check semua Badge eligibility
              └── deposit_count badges, total_weight badges, points badges
          └── Add UserBadge baru yang qualified
          └── Remove UserBadge yang sudah tidak qualified
       g. db.session.commit()

7. ADMIN MENJALANKAN PREDIKSI ML
   └── Risk Analysis page → POST /api/ml/analyze/all
   └── ml_service.predict_batch():
       a. Aggregate query: MAX(created_at), COUNT(id) per user
       b. Second query: active months per user (6 month window)
       c. Build features: [{user_id, recency, frequency, consistency}, ...]
       d. HTTP POST → ML Service :5001/predict/batch
          └── ML Service:
              └── Loop each user features
              └── np.array([[recency, frequency, consistency]])
              └── model.predict(features) → encoded prediction
              └── model.predict_proba(features) → probability array
              └── label_encoder.inverse_transform() → "low"/"medium"/"high"
              └── confidence_score = max(probabilities)
       e. Response: { predictions: [{user_id, risk_level, confidence_score}] }
       f. Bulk upsert to participation_risk table
       g. db.session.commit()

8. DASHBOARD DIPERBARUI
   └── GET /api/admin/dashboard/kpis
       └── total_members, active_members, deposits_today, weight, risk_count
   └── GET /api/admin/dashboard/trend
       └── Daily deposit count & weight (30 days)
   └── GET /api/admin/dashboard/risk-distribution
       └── { low: N, medium: N, high: N }
   └── Charts rendered via Recharts

9. LEADERBOARD DIPERBARUI
   └── User buka Leaderboard di mobile
   └── GET /api/gamification/leaderboard
       └── Top 10 by total_points DESC
       └── current_user_rank = COUNT(more points) + 1
       └── Cached per week

10. MISSION DITARGETKAN BERDASARKAN RISK
    └── Missions dengan target_label = 'high' hanya ditampilkan
        ke user dengan risk_level = 'high'
    └── Filter di gamification.py route: mission.target_label != user_risk_level → skip

11. USER MENUKAR REWARD
    └── RewardScreen → GET /api/rewards
    └── RewardDetailScreen → POST /api/rewards/redeem { reward_id }
    └── Flask:
        a. Cek reward aktif & stok > 0
        b. Cek user.total_points >= reward.points_cost
        c. user.total_points -= reward.points_cost
        d. reward.stock -= 1
        e. RewardRedemption(status='pending', code='SRK-XXXXXXXX')
        f. sync_user_level_and_badges() (karena points berubah)
    └── UI: kode redemption + "Menunggu approval admin"

12. ADMIN APPROVE/REJECT REDEMPTION
    └── Approve: redemption.status = 'approved'
    └── Reject: 
        └── member.total_points += points_spent (refund)
        └── reward.stock += 1 (restore stock)
        └── redemption.status = 'rejected'

13. USER MELIHAT PROFIL
    └── ProfilScreen → GET /auth/me + GET /gamification/summary + GET /gamification/badges/my
    └── Display: nama, email, level, points, total deposits, badges earned/available
    └── Badge priority sorting: points > total_weight > deposit_count

14. ADMIN IMPORT DATA DLH
    └── POST /api/admin/data/import/deposits (upload .xlsx)
    └── import_dlh_excel.py:
        a. Auto-detect sheet transaksi dan nasabah
        b. Loop rows: validate account, weight, waste_type
        c. Create/update User per account_number
        d. Insert WasteDeposit(status='validated')
        e. Recalculate total_points dan level per user
        f. sync_all_users_levels_and_badges()

15. RESPONSE DIKIRIM KE CLIENT
    └── JSON response → Dio/Axios parse
    └── Provider update state → notifyListeners()
    └── Widget rebuild → UI diperbarui
```

---

> **Catatan**: Seluruh informasi di atas berasal dari analisis source code. Tidak ada informasi yang dikarang. File dan fungsi asal dicantumkan di setiap bagian untuk kemudahan penelusuran.
