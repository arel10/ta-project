# Pemetaan Kode Backend untuk Pengujian Bab 4

Dokumen ini memetakan **setiap skenario pengujian** ke **kode backend** yang menangani logika tersebut, beserta lokasi file dan baris kode.

---

## Arsitektur Backend

```
d:\kulyeah\Sems 8\TA\
├── api/                         ← Backend API (Flask)
│   ├── app/
│   │   ├── __init__.py          ← App factory, blueprint registration
│   │   ├── routes/              ← Endpoint handlers
│   │   │   ├── auth.py          ← Authentikasi
│   │   │   ├── deposits.py      ← Setoran Sampah
│   │   │   ├── gamification.py  ← Gamifikasi
│   │   │   ├── rewards.py       ← Reward
│   │   │   └── ml.py            ← Machine Learning
│   │   ├── models/              ← Database models
│   │   │   ├── user.py
│   │   │   ├── waste_deposit.py
│   │   │   ├── mission.py
│   │   │   ├── badge.py
│   │   │   ├── reward.py
│   │   │   ├── participation_risk.py
│   │   │   ├── waste_point_rate.py
│   │   │   └── point_setting.py
│   │   ├── services/            ← Business logic
│   │   │   ├── gamification_service.py
│   │   │   └── ml_service.py
│   │   └── utils/
│   │       └── api_response.py
│   └── config.py
└── ml-service/                  ← ML Microservice (Flask)
    ├── app.py                   ← Predict endpoints
    └── feature_calculator.py    ← RFM feature utils
```

---

## 4.2.1.1 Pengujian Fitur Authentikasi

### File Utama: [auth.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py)
### Model: [user.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/user.py)

---

### 1. Registrasi

#### a. Registrasi dengan data valid
- **Endpoint**: `POST /api/auth/register`
- **Fungsi**: [register()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L14-L75)
- **Kode yang diuji**:

```python
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new member account."""
    data = request.get_json()

    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Validation
    if not name or not email or not password:
        return error_response(
            "Nama, email, dan password wajib diisi",
            "validation_error", status=400,
            fields={
                "name": "required" if not name else None,
                "email": "required" if not email else None,
                "password": "required" if not password else None,
            },
        )

    if len(password) < 6:
        return error_response("Password minimal 6 karakter", "validation_error", status=400,
                              fields={"password": "min_length_6"})

    if User.query.filter_by(email=email).first():
        return error_response("Email sudah terdaftar", "conflict", status=409,
                              fields={"email": "duplicate"})

    # Generate unique account number
    while True:
        account_number = f"SRK-{random.randint(100000, 999999)}"
        if not User.query.filter_by(account_number=account_number).first():
            break

    user = User(name=name, email=email, account_number=account_number, role='member')
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Registrasi berhasil",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201
```

| Aspek | Detail |
|-------|--------|
| **Input** | `name`, `email`, `password` (valid) |
| **Expected Output** | Status `201`, message "Registrasi berhasil", user data + JWT tokens |
| **Logika** | Validasi field → cek email duplikat → generate account number → hash password → simpan DB → return JWT |

---

#### b. Registrasi dengan email yang sudah terdaftar
- **Baris kode**: [auth.py#L47-L48](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L47-L48)

```python
if User.query.filter_by(email=email).first():
    return error_response("Email sudah terdaftar", "conflict", status=409,
                          fields={"email": "duplicate"})
```

| Aspek | Detail |
|-------|--------|
| **Input** | Email yang sudah ada di database |
| **Expected Output** | Status `409`, error "Email sudah terdaftar" |

---

#### c. Registrasi dengan field kosong
- **Baris kode**: [auth.py#L27-L37](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L27-L37)

```python
if not name or not email or not password:
    return error_response(
        "Nama, email, dan password wajib diisi",
        "validation_error", status=400,
        fields={
            "name": "required" if not name else None,
            "email": "required" if not email else None,
            "password": "required" if not password else None,
        },
    )
```

| Aspek | Detail |
|-------|--------|
| **Input** | Salah satu atau semua field kosong |
| **Expected Output** | Status `400`, error "Nama, email, dan password wajib diisi" + detail fields |

---

### 2. Login

#### a. Login dengan kredensial valid
- **Endpoint**: `POST /api/auth/login`
- **Fungsi**: [login()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L78-L113)
- **Kode yang diuji**:

```python
@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password, returns JWT tokens."""
    data = request.get_json()

    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response(
            "Email dan password wajib diisi", "validation_error", status=400,
            fields={
                "email": "required" if not email else None,
                "password": "required" if not password else None,
            },
        )

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return error_response("Email atau password salah", "unauthorized", status=401)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Login berhasil",
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | `email` dan `password` valid |
| **Expected Output** | Status `200`, message "Login berhasil", user data + JWT tokens |

---

#### b. Login dengan Password salah
- **Baris kode**: [auth.py#L100-L103](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L100-L103)

```python
user = User.query.filter_by(email=email).first()

if not user or not user.check_password(password):
    return error_response("Email atau password salah", "unauthorized", status=401)
```

Model `check_password` di [user.py#L40-L41](file:///d:/kulyeah/Sems%208/TA/api/app/models/user.py#L40-L41):
```python
def check_password(self, password):
    return check_password_hash(self.password_hash, password)
```

| Aspek | Detail |
|-------|--------|
| **Input** | Email valid, password salah |
| **Expected Output** | Status `401`, error "Email atau password salah" |

---

#### c. Login dengan email tidak terdaftar
- **Baris kode**: Sama dengan di atas — [auth.py#L100-L103](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py#L100-L103)

```python
user = User.query.filter_by(email=email).first()

if not user or not user.check_password(password):
    return error_response("Email atau password salah", "unauthorized", status=401)
```

| Aspek | Detail |
|-------|--------|
| **Input** | Email tidak terdaftar |
| **Expected Output** | Status `401`, error "Email atau password salah" |
| **Catatan** | Satu pesan error untuk keduanya (security best practice agar tidak membocorkan apakah email terdaftar) |

---

## 4.2.1.2 Pengujian Fitur Setoran Sampah

### File Utama: [deposits.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py)
### Model: [waste_deposit.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/waste_deposit.py)
### Service: [gamification_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py)

---

### 1. Pengujian Pencatatan Setoran

#### a. Membuat setoran dengan data valid
- **Endpoint**: `POST /api/deposits`
- **Fungsi**: [create_deposit()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L32-L90)
- **Kode yang diuji**:

```python
@deposits_bp.route('', methods=['POST'])
@jwt_required()
def create_deposit():
    """Member creates a new waste deposit (status: pending)."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    data = request.get_json()
    if not data:
        return error_response("Request body tidak boleh kosong", "validation_error", status=400)

    weight_kg = data.get('weight_kg')
    waste_type = data.get('waste_type', '').strip().lower()

    if not weight_kg or not waste_type:
        return error_response("Berat (kg) dan jenis sampah wajib diisi", "validation_error", status=400,
            fields={"weight_kg": "required" if not weight_kg else None,
                     "waste_type": "required" if not waste_type else None})

    try:
        weight_kg = float(weight_kg)
    except (ValueError, TypeError):
        return error_response("Berat harus berupa angka", "validation_error", status=400,
                              fields={"weight_kg": "invalid"})

    if weight_kg <= 0:
        return error_response("Berat harus lebih dari 0", "validation_error", status=400,
                              fields={"weight_kg": "min_0"})

    active_rates = get_active_waste_point_rates()
    valid_types = {r.code.lower() for r in active_rates}
    if waste_type not in valid_types:
        return error_response("Jenis sampah tidak valid atau belum aktif", "validation_error",
                              status=400, fields={"waste_type": "invalid"})

    deposit = WasteDeposit(
        user_id=user.id, weight_kg=weight_kg,
        waste_type=waste_type, status='pending', points_earned=0,
    )
    db.session.add(deposit)
    db.session.commit()

    return jsonify({
        "message": "Setoran berhasil dibuat, menunggu validasi admin",
        "deposit": deposit.to_dict(),
        "estimated_points": calculate_points(weight_kg, waste_type),
    }), 201
```

| Aspek | Detail |
|-------|--------|
| **Input** | `weight_kg` (positif), `waste_type` (valid/aktif) + JWT token |
| **Expected Output** | Status `201`, message "Setoran berhasil dibuat, menunggu validasi admin" |

---

#### b. Membuat setoran dengan jenis sampah tidak valid
- **Baris kode**: [deposits.py#L66-L74](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L66-L74)

```python
active_rates = get_active_waste_point_rates()
valid_types = {r.code.lower() for r in active_rates}
if waste_type not in valid_types:
    return error_response("Jenis sampah tidak valid atau belum aktif",
                          "validation_error", status=400,
                          fields={"waste_type": "invalid"})
```

Validasi mengacu pada daftar waste rates aktif dari [waste_point_rate.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/waste_point_rate.py#L5-L26) (kode P1-P9, K1-K6, B1-B3, L1, MJ).

| Aspek | Detail |
|-------|--------|
| **Input** | `waste_type` = "karet" (tidak ada di daftar aktif) |
| **Expected Output** | Status `400`, error "Jenis sampah tidak valid atau belum aktif" |

---

#### c. Membuat setoran dengan berat negatif
- **Baris kode**: [deposits.py#L63-L64](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L63-L64)

```python
if weight_kg <= 0:
    return error_response("Berat harus lebih dari 0", "validation_error", status=400,
                          fields={"weight_kg": "min_0"})
```

| Aspek | Detail |
|-------|--------|
| **Input** | `weight_kg` = -5 |
| **Expected Output** | Status `400`, error "Berat harus lebih dari 0" |

---

#### d. Melihat Riwayat Setoran
- **Endpoint**: `GET /api/deposits/my`
- **Fungsi**: [get_my_deposits()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L103-L131)

```python
@deposits_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_deposits():
    """Member retrieves their own deposit history."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    deposits = WasteDeposit.query.filter_by(
        user_id=user.id
    ).order_by(
        WasteDeposit.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "deposits": [
            {**d.to_dict(), "waste_label": get_waste_display_name(d.waste_type)}
            for d in deposits.items
        ],
        "total": deposits.total,
        "page": deposits.page,
        "pages": deposits.pages,
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token (member), query params `page` & `per_page` (opsional) |
| **Expected Output** | Status `200`, array `deposits` + pagination info |

---

### 2. Pengujian Validasi Setoran (Admin)

#### a. Validasi setoran pending
- **Endpoint**: `PUT /api/deposits/<deposit_id>/validate`
- **Fungsi**: [validate_deposit()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L175-L232)

```python
@deposits_bp.route('/<int:deposit_id>/validate', methods=['PUT'])
@jwt_required()
def validate_deposit(deposit_id):
    """Admin validates a pending deposit. This triggers:
    1. Status update to 'validated'
    2. Points calculation and awarding
    3. Mission progress check
    4. Badge eligibility check
    """
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    deposit = WasteDeposit.query.get(deposit_id)
    if not deposit:
        return error_response("Setoran tidak ditemukan", "not_found", status=404)

    if deposit.status == 'validated':
        return error_response("Setoran sudah divalidasi sebelumnya", "validation_error", status=400)

    data = request.get_json() or {}
    actual_weight = data.get('actual_weight_kg')
    if actual_weight is not None:
        try:
            actual_weight = float(actual_weight)
            if actual_weight > 0:
                deposit.weight_kg = actual_weight
        except (ValueError, TypeError):
            pass

    # 1. Calculate and award points
    points = calculate_points(deposit.weight_kg, deposit.waste_type)
    deposit.points_earned = points
    deposit.status = 'validated'
    deposit.validated_at = datetime.now(timezone.utc)
    deposit.validated_by = admin.id

    # 2. Update user points
    member = User.query.get(deposit.user_id)
    if member:
        member.total_points += points

    db.session.commit()

    # 3. Check mission progress
    check_mission_progress(deposit.user_id)

    # 4. Re-sync level and badges
    sync_user_level_and_badges(deposit.user_id)

    return jsonify({
        "message": "Setoran berhasil divalidasi",
        "deposit": deposit.to_dict(),
        "points_earned": points,
    }), 200
```

**Fungsi pendukung** untuk kalkulasi poin — [calculate_points()](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L95-L98):
```python
def calculate_points(weight_kg: float, waste_type: str) -> int:
    rate = get_points_rate(waste_type)
    return int(weight_kg * rate)
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token admin, `deposit_id` yang berstatus `pending` |
| **Expected Output** | Status `200`, message "Setoran berhasil divalidasi", points_earned |
| **Side Effects** | Update user points, cek misi, sinkron badge & level |

---

#### b. Validasi dengan override berat
- **Baris kode**: [deposits.py#L198-L206](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L198-L206)

```python
data = request.get_json() or {}
actual_weight = data.get('actual_weight_kg')
if actual_weight is not None:
    try:
        actual_weight = float(actual_weight)
        if actual_weight > 0:
            deposit.weight_kg = actual_weight
    except (ValueError, TypeError):
        pass
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin, `deposit_id`, body `{"actual_weight_kg": 3.5}` |
| **Expected Output** | Status `200`, berat setoran diubah, points dihitung berdasarkan berat baru |

---

## 4.2.1.3 Pengujian Fitur Gamifikasi

### File Utama: [gamification.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py)
### Service: [gamification_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py)

---

#### a. Melihat daftar misi aktif
- **Endpoint**: `GET /api/gamification/missions`
- **Fungsi**: [get_missions()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py#L21-L48)

```python
@gamification_bp.route('/missions', methods=['GET'])
@jwt_required()
def get_missions():
    """Get all active missions with current user's progress."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    active_missions = Mission.query.filter_by(is_active=True).all()
    result = []

    for mission in active_missions:
        user_mission = UserMission.query.filter_by(
            user_id=user.id, mission_id=mission.id).first()

        mission_data = mission.to_dict()
        mission_data['user_progress'] = user_mission.progress if user_mission else 0
        mission_data['is_completed'] = user_mission.is_completed if user_mission else False
        mission_data['completed_at'] = (
            user_mission.completed_at.isoformat()
            if user_mission and user_mission.completed_at else None)
        result.append(mission_data)

    return jsonify({"missions": result}), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token member |
| **Expected Output** | Status `200`, array `missions` dengan `user_progress`, `is_completed` |

---

#### b. Melihat leaderboard
- **Endpoint**: `GET /api/gamification/leaderboard`
- **Fungsi**: [get_leaderboard()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py#L51-L96)

```python
@gamification_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Get top 10 users by total points."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    cache_key = f'leaderboard:{year}-W{week}'
    leaderboard = get_cache(cache_key)

    if leaderboard is None:
        top_users = User.query.filter_by(
            role='member'
        ).order_by(
            User.total_points.desc()
        ).limit(10).all()

        leaderboard = []
        for rank, user in enumerate(top_users, 1):
            leaderboard.append({
                'rank': rank, 'user_id': user.id,
                'name': user.name, 'total_points': user.total_points,
                'level': user.level,
            })
        # Cache until next week
        ...

    # Get current user's rank
    current_user = _get_current_user()
    higher_count = User.query.filter(
        User.role == 'member',
        User.total_points > current_user.total_points
    ).count()
    current_rank = higher_count + 1

    return jsonify({
        "leaderboard": leaderboard,
        "current_user_rank": current_rank,
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token member |
| **Expected Output** | Status `200`, `leaderboard` (top 10) + `current_user_rank` |

---

#### c. Melihat badge yang dimiliki
- **Endpoint**: `GET /api/gamification/badges/my`
- **Fungsi**: [get_my_badges()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py#L99-L139)

```python
@gamification_bp.route('/badges/my', methods=['GET'])
@jwt_required()
def get_my_badges():
    """Get current user's earned badges."""
    user = _get_current_user()
    if not user:
        return error_response("User tidak ditemukan", "not_found", status=404)

    user_badges = UserBadge.query.filter_by(user_id=user.id).all()
    all_badges = Badge.query.all()

    # ... sorting by priority ...
    earned = [ub.to_dict() for ub in user_badges]
    earned_ids = {ub.badge_id for ub in user_badges}
    available = [b.to_dict() for b in all_badges if b.id not in earned_ids]

    return jsonify({
        "earned_badges": earned,
        "available_badges": available,
        "total_earned": len(earned),
        "total_available": len(all_badges),
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token member |
| **Expected Output** | Status `200`, `earned_badges`, `available_badges`, counts |

---

#### d. Penyelesaian Misi otomatis
- **Fungsi**: [check_mission_progress()](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py#L258-L324) — dipanggil otomatis saat admin memvalidasi setoran

```python
def check_mission_progress(user_id: int):
    """Update mission progress for a user after a deposit is validated."""
    user = User.query.get(user_id)
    if not user:
        return

    active_missions = Mission.query.filter_by(is_active=True).all()

    for mission in active_missions:
        user_mission = UserMission.query.filter_by(
            user_id=user_id, mission_id=mission.id).first()

        if not user_mission:
            user_mission = UserMission(
                user_id=user_id, mission_id=mission.id,
                progress=0, is_completed=False)
            db.session.add(user_mission)

        if user_mission.is_completed:
            continue

        # Calculate progress based on target_type
        waste_code = (mission.waste_type_code or '').strip().lower()
        if mission.target_type == 'deposit_count':
            deposit_query = WasteDeposit.query.filter_by(
                user_id=user_id, status='validated')
            if waste_code:
                deposit_query = deposit_query.filter(WasteDeposit.waste_type == waste_code)
            count = deposit_query.count()
            user_mission.progress = min(count, mission.target_value)

        elif mission.target_type == 'weight':
            # Sum validated deposit weights
            weight_query = db.session.query(
                db.func.coalesce(db.func.sum(WasteDeposit.weight_kg), 0)
            ).filter(WasteDeposit.user_id == user_id, WasteDeposit.status == 'validated')
            if waste_code:
                weight_query = weight_query.filter(WasteDeposit.waste_type == waste_code)
            total_weight = weight_query.scalar()
            user_mission.progress = min(total_weight, mission.target_value)

        # Check for completion
        if user_mission.progress >= mission.target_value:
            user_mission.is_completed = True
            user_mission.completed_at = datetime.now(timezone.utc)
            user.total_points += mission.points_reward
            user.level = calculate_user_level(user.total_points)

    db.session.commit()
```

**Trigger point**: Dipanggil dari [validate_deposit() → baris 223](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py#L223)

| Aspek | Detail |
|-------|--------|
| **Trigger** | Otomatis setelah validasi setoran oleh admin |
| **Logika** | Cek semua misi aktif → hitung progress → jika target tercapai → tandai selesai + bonus poin |

---

## 4.2.1.4 Pengujian Fitur Reward

### File Utama: [rewards.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py)
### Model: [reward.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/reward.py)

---

#### a. Melihat Katalog Reward
- **Endpoint**: `GET /api/rewards`
- **Fungsi**: [get_rewards()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L23-L34)

```python
@rewards_bp.route('', methods=['GET'])
@jwt_required()
def get_rewards():
    """List all available rewards with stock info."""
    cached = get_cache('rewards_active')
    if cached is None:
        rewards = Reward.query.filter_by(is_active=True).order_by(Reward.points_cost.asc()).all()
        cached = set_cache('rewards_active', [r.to_dict() for r in rewards], ttl_seconds=120)

    return jsonify({"rewards": cached}), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token |
| **Expected Output** | Status `200`, array `rewards` (yang `is_active=True`) |

---

#### b. Menukar Point dengan Reward (Point Cukup)
- **Endpoint**: `POST /api/rewards/redeem`
- **Fungsi**: [redeem_reward()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L37-L105)

```python
@rewards_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_reward():
    """Member redeems a reward using accumulated points."""
    user = _get_current_user()
    # ... validasi ...

    reward = Reward.query.get(reward_id)
    if not reward:
        return error_response("Reward tidak ditemukan", "not_found", status=404)

    if not reward.is_active:
        return error_response("Reward sudah tidak aktif", "validation_error", status=400)

    if reward.stock <= 0:
        return error_response("Stok reward habis", "validation_error", status=400)

    if user.total_points < reward.points_cost:
        return error_response("Poin tidak mencukupi", "validation_error", status=400,
            fields={"required": reward.points_cost, "available": user.total_points})

    # Deduct points
    user.total_points -= reward.points_cost
    reward.stock -= 1

    redemption = RewardRedemption(
        user_id=user.id, reward_id=reward.id,
        points_spent=reward.points_cost, status='pending',
        redemption_code=RewardRedemption.generate_code(),
    )
    db.session.add(redemption)

    from app.services.gamification_service import sync_user_level_and_badges
    sync_user_level_and_badges(user.id, commit=False)

    db.session.commit()
    invalidate_cache('rewards_active')

    return jsonify({
        "message": "Penukaran berhasil diajukan...",
        "redemption": redemption.to_dict(),
        "remaining_points": user.total_points,
        "validation_status": "pending_admin_approval",
    }), 201
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT token, `reward_id`, user punya cukup poin |
| **Expected Output** | Status `201`, redemption data, remaining_points |

---

#### c. Menukar Point dengan Reward (Point Tidak Cukup)
- **Baris kode**: [rewards.py#L63-L72](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L63-L72)

```python
if user.total_points < reward.points_cost:
    return error_response("Poin tidak mencukupi", "validation_error", status=400,
        fields={"required": reward.points_cost, "available": user.total_points})
```

| Aspek | Detail |
|-------|--------|
| **Input** | User poin < points_cost reward |
| **Expected Output** | Status `400`, error "Poin tidak mencukupi" + detail required vs available |

---

#### d. Menukar Reward dengan Stok habis
- **Baris kode**: [rewards.py#L60-L61](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L60-L61)

```python
if reward.stock <= 0:
    return error_response("Stok reward habis", "validation_error", status=400)
```

| Aspek | Detail |
|-------|--------|
| **Input** | `reward_id` yang `stock = 0` |
| **Expected Output** | Status `400`, error "Stok reward habis" |

---

#### e. Admin menyetujui penukaran
- **Endpoint**: `PUT /api/rewards/redemptions/<redemption_id>/approve`
- **Fungsi**: [approve_redemption()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L133-L157)

```python
@rewards_bp.route('/redemptions/<int:redemption_id>/approve', methods=['PUT'])
@jwt_required()
def approve_redemption(redemption_id):
    """Admin approves a pending reward redemption."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return error_response("Penukaran tidak ditemukan", "not_found", status=404)

    if redemption.status == 'approved':
        return error_response("Penukaran sudah disetujui sebelumnya", "validation_error", status=400)
    if redemption.status == 'rejected':
        return error_response("Penukaran sudah ditolak sebelumnya", "validation_error", status=400)

    redemption.status = 'approved'
    db.session.commit()

    return jsonify({
        "message": "Penukaran berhasil disetujui",
        "redemption": redemption.to_dict(),
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin, `redemption_id` berstatus `pending` |
| **Expected Output** | Status `200`, message "Penukaran berhasil disetujui" |

---

#### f. Admin menolak penukaran
- **Endpoint**: `PUT /api/rewards/redemptions/<redemption_id>/reject`
- **Fungsi**: [reject_redemption()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L160-L196)

```python
@rewards_bp.route('/redemptions/<int:redemption_id>/reject', methods=['PUT'])
@jwt_required()
def reject_redemption(redemption_id):
    """Admin rejects a pending reward redemption and refunds points."""
    user = _get_current_user()
    admin_check = _require_admin(user)
    if admin_check:
        return admin_check

    redemption = RewardRedemption.query.get(redemption_id)
    if not redemption:
        return error_response("Penukaran tidak ditemukan", "not_found", status=404)

    if redemption.status == 'approved':
        return error_response("Penukaran sudah disetujui sebelumnya", "validation_error", status=400)
    if redemption.status == 'rejected':
        return error_response("Penukaran sudah ditolak sebelumnya", "validation_error", status=400)

    member = User.query.get(redemption.user_id)
    reward = Reward.query.get(redemption.reward_id)
    if reward:
        reward.stock += 1

    member.total_points += int(redemption.points_spent or 0)
    redemption.status = 'rejected'
    db.session.commit()

    invalidate_cache('rewards_active')

    return jsonify({
        "message": "Penukaran berhasil ditolak",
        "redemption": redemption.to_dict(),
        "refunded_points": int(redemption.points_spent or 0),
    }), 200
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin, `redemption_id` berstatus `pending` |
| **Expected Output** | Status `200`, poin dikembalikan, stok reward +1 |

---

## 4.2.1.5 Pengujian Fitur Machine Learning

### File Route: [ml.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py)
### File Service: [ml_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py)
### File ML Microservice: [app.py](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py)
### Model: [participation_risk.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/participation_risk.py)

---

#### a. Analisis Risiko per Nasabah
- **Endpoint**: `POST /api/ml/analyze/<user_id>`
- **Fungsi**: [analyze_user()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py#L20-L49)

```python
@ml_bp.route('/analyze/<int:user_id>', methods=['POST'])
@jwt_required()
def analyze_user(user_id):
    """Admin triggers ML risk analysis for a single user."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"message": "User tidak ditemukan"}), 404

    result = predict_single(user_id)

    if result is None:
        return jsonify({
            "message": "Tidak dapat menganalisis user. Pastikan user memiliki setoran tervalidasi dan ML Service aktif."
        }), 400

    return jsonify({
        "message": "Analisis risiko berhasil",
        "risk_profile": result,
    }), 200
```

**Service layer** — [predict_single()](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L87-L126):
```python
def predict_single(user_id: int) -> dict | None:
    features = calculate_features(user_id)
    if features is None:
        return None

    ml_url = current_app.config['ML_SERVICE_URL']
    response = requests.post(f"{ml_url}/predict", json=features, timeout=10)
    response.raise_for_status()
    result = response.json()

    # Save to participation_risk table
    risk = ParticipationRisk.query.filter_by(user_id=user_id).first()
    if not risk:
        risk = ParticipationRisk(user_id=user_id)
        db.session.add(risk)

    risk.recency_days = features['recency']
    risk.frequency = features['frequency']
    risk.consistency_score = features['consistency']
    risk.risk_level = normalize_risk_level(result.get('risk_level'))
    risk.confidence_score = result.get('confidence_score', 0.0)
    risk.predicted_at = datetime.now(timezone.utc)

    db.session.commit()
    return risk.to_dict()
```

**Feature calculation** — [calculate_features()](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L37-L84):
```python
def calculate_features(user_id: int) -> dict | None:
    deposits = WasteDeposit.query.filter_by(user_id=user_id, status='validated')\
        .order_by(WasteDeposit.created_at.desc()).all()
    if not deposits:
        return None

    now = datetime.now(timezone.utc)
    # Recency: days since last deposit
    recency = max(0, (now - last_deposit_date).days)
    # Frequency: total validated deposits
    frequency = len(deposits)
    # Consistency: active months / total months
    consistency = len(active_months) / len(total_months)

    return {'user_id': user_id, 'recency': recency,
            'frequency': frequency, 'consistency': round(consistency, 4)}
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin, `user_id` |
| **Expected Output** | Status `200`, `risk_profile` (risk_level, confidence_score, fitur RFM) |
| **Flow** | API → calculate_features → ML Service `/predict` → save to DB |

---

#### b. Analisis Risiko Seluruh Nasabah
- **Endpoint**: `POST /api/ml/analyze/all`
- **Fungsi**: [analyze_all_users()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py#L52-L86)

```python
@ml_bp.route('/analyze/all', methods=['POST'])
@jwt_required()
def analyze_all_users():
    """Admin triggers batch ML risk analysis for all users."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    batch = predict_batch()
    total_saved = int(batch.get('total_saved', 0))
    total_requested = int(batch.get('total_requested', 0))
    total_errors = int(batch.get('total_errors', 0))

    return jsonify({
        "message": f"Analisis batch selesai untuk {total_saved} user",
        "total_requested": total_requested,
        "total_analyzed": total_saved,
        "total_errors": total_errors,
        "results": batch.get('results', []),
    }), 200
```

**Service layer** — [predict_batch()](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L129-L265)

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin |
| **Expected Output** | Status `200`, batch stats (total_requested, total_analyzed, total_errors) + results |
| **Flow** | API → aggregate features semua user → ML Service `/predict/batch` → bulk save |

---

#### c. Melihat ringkasan distribusi risiko
- **Endpoint**: `GET /api/ml/risk-summary`
- **Fungsi**: [risk_summary()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py#L89-L100)

```python
@ml_bp.route('/risk-summary', methods=['GET'])
@jwt_required()
def risk_summary():
    """Admin dashboard: risk level distribution and high-risk user list."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    summary = get_risk_summary()
    return jsonify(summary), 200
```

**Service layer** — [get_risk_summary()](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L268-L323):
```python
def get_risk_summary() -> dict:
    rows = db.session.query(ParticipationRisk, User)\
        .join(User, User.id == ParticipationRisk.user_id).all()

    summary = {'low': 0, 'medium': 0, 'high': 0}
    # ... counting per level, building analyzed_users & high_risk_users ...

    return {
        'total_analyzed': len(rows),
        'distribution': summary,
        'users': analyzed_users,
        'high_risk_users': high_risk_users,
        'last_analyzed_at': last_analyzed_at,
    }
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin |
| **Expected Output** | Status `200`, `distribution` (low/medium/high counts), `high_risk_users`, `total_analyzed` |

---

#### d. Menukar Reward dengan Stok habis

> [!NOTE]
> Skenario ini duplikat dari **4.2.1.4.d** (Fitur Reward). Kode yang sama berlaku — [rewards.py#L60-L61](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py#L60-L61).

---

#### e. Melihat Tren Risiko Bulanan
- **Endpoint**: `GET /api/ml/risk-trend`
- **Fungsi**: [risk_trend()](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py#L103-L113)

```python
@ml_bp.route('/risk-trend', methods=['GET'])
@jwt_required()
def risk_trend():
    """Admin dashboard: real monthly risk distribution."""
    admin = _get_current_user()
    admin_check = _require_admin(admin)
    if admin_check:
        return admin_check

    trend = get_risk_trend(months=6)
    return jsonify({"data": trend}), 200
```

**Service layer** — [get_risk_trend()](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py#L326-L369):
```python
def get_risk_trend(months: int = 6) -> list[dict]:
    """Return real monthly distribution of risk profiles based on predicted_at."""
    # ... generates 6 months of data ...
    # Query: GROUP BY month + risk_level
    # Returns: [{'month': 'Jan', 'low': 5, 'medium': 3, 'high': 1}, ...]
```

| Aspek | Detail |
|-------|--------|
| **Input** | JWT admin |
| **Expected Output** | Status `200`, array `data` per bulan (6 bulan terakhir) dengan distribusi low/medium/high |

---

## ML Microservice (Endpoint prediksi)

### File: [app.py](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py)

| Endpoint | Method | Fungsi | Baris |
|----------|--------|--------|-------|
| `/predict` | POST | [predict()](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L113-L150) | Prediksi single user |
| `/predict/batch` | POST | [predict_batch()](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L153-L201) | Prediksi batch |
| `/health` | GET | [health()](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L101-L110) | Health check |
| `/model/info` | GET | [model_info()](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L204-L225) | Info model |

Core prediction function — [predict_risk()](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py#L74-L93):
```python
def predict_risk(recency: int, frequency: int, consistency: float) -> dict:
    features = np.array([[recency, frequency, consistency]])
    prediction_encoded = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    risk_level = label_encoder.inverse_transform([prediction_encoded])[0]
    confidence_score = float(max(probabilities))
    return {'risk_level': risk_level, 'confidence_score': round(confidence_score, 4)}
```

---

## Ringkasan Seluruh File Backend yang Relevan

| No | File | Lokasi | Digunakan Untuk |
|----|------|--------|-----------------|
| 1 | [auth.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/auth.py) | `api/app/routes/` | Register, Login, Refresh, Profile |
| 2 | [deposits.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/deposits.py) | `api/app/routes/` | Create deposit, Riwayat, Validasi |
| 3 | [gamification.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/gamification.py) | `api/app/routes/` | Misi, Leaderboard, Badges |
| 4 | [rewards.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/rewards.py) | `api/app/routes/` | Katalog, Redeem, Approve, Reject |
| 5 | [ml.py](file:///d:/kulyeah/Sems%208/TA/api/app/routes/ml.py) | `api/app/routes/` | Analyze single/batch, Risk summary/trend |
| 6 | [user.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/user.py) | `api/app/models/` | Model User (password hash, level, points) |
| 7 | [waste_deposit.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/waste_deposit.py) | `api/app/models/` | Model WasteDeposit |
| 8 | [mission.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/mission.py) | `api/app/models/` | Model Mission & UserMission |
| 9 | [badge.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/badge.py) | `api/app/models/` | Model Badge & UserBadge |
| 10 | [reward.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/reward.py) | `api/app/models/` | Model Reward & RewardRedemption |
| 11 | [participation_risk.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/participation_risk.py) | `api/app/models/` | Model ParticipationRisk |
| 12 | [waste_point_rate.py](file:///d:/kulyeah/Sems%208/TA/api/app/models/waste_point_rate.py) | `api/app/models/` | Daftar jenis sampah & poin per kg |
| 13 | [gamification_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/gamification_service.py) | `api/app/services/` | Kalkulasi poin, level, misi, badges |
| 14 | [ml_service.py](file:///d:/kulyeah/Sems%208/TA/api/app/services/ml_service.py) | `api/app/services/` | Feature calc, predict single/batch, risk summary/trend |
| 15 | [api_response.py](file:///d:/kulyeah/Sems%208/TA/api/app/utils/api_response.py) | `api/app/utils/` | Helper error response format |
| 16 | [app.py](file:///d:/kulyeah/Sems%208/TA/ml-service/app.py) | `ml-service/` | ML microservice (predict, health) |
| 17 | [feature_calculator.py](file:///d:/kulyeah/Sems%208/TA/ml-service/feature_calculator.py) | `ml-service/` | RFM feature utilities |
| 18 | [__init__.py](file:///d:/kulyeah/Sems%208/TA/api/app/__init__.py) | `api/app/` | App factory, blueprint & error handlers |
