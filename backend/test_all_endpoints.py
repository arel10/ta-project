"""Comprehensive endpoint test suite for Sirkula backend API."""

import io
import json
from openpyxl import Workbook
from app import create_app, db
from app.models.user import User


def run_tests():
    app = create_app('development')
    client = app.test_client()

    print("=== [1] Testing Health Endpoint ===")
    res = client.get('/api/health')
    print("GET /api/health ->", res.status_code, res.get_json())
    assert res.status_code in (200, 503)

    with app.app_context():
        # Ensure test admin user exists
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                name="Super Admin",
                email="admin@sirkula.com",
                role="admin",
                status="approved",
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("Created test admin: admin@sirkula.com / admin123")
        else:
            admin.set_password("admin123")
            db.session.commit()
            print(f"Using existing admin: {admin.email}")

    print("\n=== [2] Testing Admin Login ===")
    login_res = client.post('/api/auth/login', json={
        "email": admin.email,
        "password": "admin123"
    })
    print("POST /api/auth/login ->", login_res.status_code)
    login_data = login_res.get_json()
    assert login_res.status_code == 200
    token = login_data.get('access_token')
    headers = {"Authorization": f"Bearer {token}"}

    print("\n=== [3] Testing Member Registration (with varied gender inputs) ===")
    for gender_input in ['Laki-laki', 'pria', 'Perempuan', 'wanita', 'L', 'P']:
        test_email = f"test_reg_{gender_input.lower()}@example.com"
        with app.app_context():
            existing = User.query.filter_by(email=test_email).first()
            if existing:
                db.session.delete(existing)
                db.session.commit()

        reg_res = client.post('/api/auth/register', json={
            "name": f"User {gender_input}",
            "email": test_email,
            "password": "password123",
            "account_number": f"ACC_{gender_input.upper()}",
            "gender": gender_input,
        })
        print(f"POST /api/auth/register (gender='{gender_input}') ->", reg_res.status_code)
        assert reg_res.status_code == 201

    print("\n=== [4] Testing Admin Members List ===")
    members_res = client.get('/api/admin/members', headers=headers)
    print("GET /api/admin/members ->", members_res.status_code, f"total: {members_res.get_json().get('total')}")
    assert members_res.status_code == 200

    print("\n=== [5] Testing Admin Create Member (POST /api/admin/members) ===")
    test_member_email = "created_by_admin@example.com"
    with app.app_context():
        existing = User.query.filter_by(email=test_member_email).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

    create_res = client.post('/api/admin/members', headers=headers, json={
        "name": "Member Baru Admin",
        "email": test_member_email,
        "password": "password123",
        "account_number": "BSLH_TEST_CREATE",
        "gender": "Laki-laki",  # Testing non-standard casing
        "nik": "3201234567890001",
        "address": "Jl. Merdeka No. 1",
        "department": "Kebersihan",
    })
    print("POST /api/admin/members ->", create_res.status_code, create_res.get_json())
    assert create_res.status_code == 201
    created_id = create_res.get_json()['member']['id']

    print("\n=== [6] Testing Admin Get Member Detail ===")
    detail_res = client.get(f'/api/admin/members/{created_id}', headers=headers)
    print(f"GET /api/admin/members/{created_id} ->", detail_res.status_code)
    assert detail_res.status_code == 200

    print("\n=== [7] Testing Admin Update Member (PUT /api/admin/members/<id>) ===")
    update_res = client.put(f'/api/admin/members/{created_id}', headers=headers, json={
        "name": "Member Baru Admin Updated",
        "email": test_member_email,
        "gender": "Perempuan",
        "address": "Jl. Baru No. 2",
    })
    print(f"PUT /api/admin/members/{created_id} ->", update_res.status_code)
    assert update_res.status_code == 200

    print("\n=== [8] Testing Admin Delete Member (DELETE /api/admin/members/<id>) ===")
    del_res = client.delete(f'/api/admin/members/{created_id}', headers=headers)
    print(f"DELETE /api/admin/members/{created_id} ->", del_res.status_code)
    assert del_res.status_code == 200

    print("\n=== [9] Testing Member Excel Import (POST /api/admin/data/import/members) ===")
    wb = Workbook()
    ws = wb.active
    ws.title = "Data Nasabah"
    ws.append(["No Rekening", "Nama", "Jenis Kelamin", "NIK", "Alamat", "Bidang"])
    ws.append(["BSLH_IMP_001", "Budi Santoso", "Laki-laki", "3201001", "Alamat 1", "Bidang 1"])
    ws.append(["BSLH_IMP_002", "Siti Aminah", "Perempuan", "3201002", "Alamat 2", "Bidang 2"])
    
    excel_buf = io.BytesIO()
    wb.save(excel_buf)
    excel_buf.seek(0)

    import_res = client.post(
        '/api/admin/data/import/members',
        headers=headers,
        data={'file': (excel_buf, 'nasabah.xlsx')},
        content_type='multipart/form-data',
    )
    print("POST /api/admin/data/import/members ->", import_res.status_code, import_res.get_json())
    assert import_res.status_code == 200

    print("\n=== [10] Testing Admin Dashboard Endpoints ===")
    kpis_res = client.get('/api/admin/dashboard/kpis', headers=headers)
    print("GET /api/admin/dashboard/kpis ->", kpis_res.status_code)
    assert kpis_res.status_code == 200

    trend_res = client.get('/api/admin/dashboard/trend', headers=headers)
    print("GET /api/admin/dashboard/trend ->", trend_res.status_code)
    assert trend_res.status_code == 200

    churn_res = client.get('/api/admin/dashboard/churn-distribution', headers=headers)
    print("GET /api/admin/dashboard/churn-distribution ->", churn_res.status_code)
    assert churn_res.status_code == 200

    print("\n=== [11] Testing Waste Rates ===")
    rates_res = client.get('/api/admin/waste-point-rates', headers=headers)
    print("GET /api/admin/waste-point-rates ->", rates_res.status_code)
    assert rates_res.status_code == 200

    print("\n=== [12] Testing Point Settings ===")
    pts_res = client.get('/api/admin/point-settings', headers=headers)
    print("GET /api/admin/point-settings ->", pts_res.status_code)
    assert pts_res.status_code == 200

    print("\n=== [13] Testing Rewards List ===")
    rewards_res = client.get('/api/admin/rewards', headers=headers)
    print("GET /api/admin/rewards ->", rewards_res.status_code)
    assert rewards_res.status_code == 200

    print("\n=== [14] Testing Missions List ===")
    missions_res = client.get('/api/admin/missions', headers=headers)
    print("GET /api/admin/missions ->", missions_res.status_code)
    assert missions_res.status_code == 200

    print("\n=== [15] Testing Public Endpoints ===")
    pub_stats = client.get('/api/admin/public/stats')
    print("GET /api/admin/public/stats ->", pub_stats.status_code)
    assert pub_stats.status_code == 200

    pub_badges = client.get('/api/admin/public/badges')
    print("GET /api/admin/public/badges ->", pub_badges.status_code)
    assert pub_badges.status_code == 200

    print("\n============================================")
    print("🎉 ALL ENDPOINT TESTS PASSED SUCCESSFULLY! 🎉")
    print("============================================")


if __name__ == '__main__':
    run_tests()
