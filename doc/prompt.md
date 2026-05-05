# Struktur Project
I am building a Waste Bank (Bank Sampah) digital platform with the following tech stack:
- Mobile App: Flutter (Android)
- Admin Web: Next.js
- Backend API: Flask (Python)
- Database: PostgreSQL
- ML Service: Separate Flask service (model already built)

Please generate the full project folder structure for all 4 components:
1. /mobile-app (Flutter)
2. /admin-web (Next.js)
3. /backend-api (Flask)
4. /ml-service (Flask)

Each folder should follow best practices for scalability and separation of concerns.
Show me the complete directory tree with file names.

# Database Schema
Generate a complete PostgreSQL database schema for a Waste Bank (Bank Sampah) application.

The system has these entities:
1. users — members (anggota) with fields: id, name, email, password_hash, account_number, role (member/admin), level, total_points, created_at
2. waste_deposits — setoran sampah: id, user_id, weight_kg, waste_type, status (pending/validated), points_earned, created_at, validated_at, validated_by
3. missions — misi gamifikasi: id, title, description, target_type (deposit_count/weight), target_value, points_reward, period (daily/weekly), is_active
4. user_missions — progres misi: id, user_id, mission_id, progress, is_completed, completed_at
5. badges — id, name, description, icon_url, condition_type, condition_value
6. user_badges — id, user_id, badge_id, earned_at
7. rewards — id, name, description, points_cost, stock, image_url, is_active
8. reward_redemptions — id, user_id, reward_id, points_spent, status (pending/approved), redemption_code, created_at
9. participation_risk — id, user_id, recency_days, frequency, consistency_score, risk_level (low/medium/high), predicted_at

Generate:
- CREATE TABLE statements with proper constraints and foreign keys
- Indexes for frequently queried columns
- ENUM types where appropriate

# Backend Endpoint 
Generate a Flask REST API project for a Waste Bank application.

Project structure:
- app/__init__.py (Flask app factory with blueprints)
- app/models/ (SQLAlchemy models matching this PostgreSQL schema: users, waste_deposits, missions, user_missions, badges, user_badges, rewards, reward_redemptions, participation_risk)
- app/routes/ (blueprints: auth, deposits, gamification, rewards, admin, ml)
- app/services/ (business logic layer)
- config.py (development/production config with PostgreSQL URI)
- requirements.txt

Requirements:
- Use Flask-SQLAlchemy for ORM
- Use Flask-JWT-Extended for authentication (JWT tokens)
- Use Flask-Migrate for database migrations
- Use marshmallow for serialization/validation
- Role-based access: 'member' and 'admin'
- CORS enabled for Next.js and Flutter clients

Generate the complete app/__init__.py and config.py first.

# Backend Routes 
- Auth and Deposit
Continue the Flask backend. Generate these route files:

1. app/routes/auth.py
   - POST /api/auth/register → register new member
   - POST /api/auth/login → login, return JWT access + refresh token
   - POST /api/auth/refresh → refresh token
   - GET /api/auth/me → get current user profile

2. app/routes/deposits.py
   - POST /api/deposits → member creates a new deposit (status: pending)
   - GET /api/deposits/my → member sees their own deposit history
   - GET /api/deposits/pending → admin gets all pending deposits
   - PUT /api/deposits/{id}/validate → admin validates deposit, triggers:
     * update status to 'validated'
     * calculate and add points to user
     * check and update mission progress
     * check badge eligibility
     * trigger ML risk recalculation for this user

Each route should include JWT authentication decorator and role checking.
Use SQLAlchemy session for database operations.
Include proper error handling with HTTP status codes.

- Gamification and Rewards
Continue the Flask backend. Generate these route files:

1. app/routes/gamification.py
   - GET /api/gamification/missions → get all active missions with user progress
   - GET /api/gamification/leaderboard → top 10 users by total points
   - GET /api/gamification/badges/my → get user's earned badges
   - GET /api/gamification/summary → get user's points, level, badges count, missions completed

2. app/routes/rewards.py
   - GET /api/rewards → list all available rewards with stock
   - POST /api/rewards/redeem → member redeems reward (deduct points, generate redemption code, reduce stock)
   - GET /api/rewards/redemptions/my → member's redemption history
   - PUT /api/rewards/redemptions/{id}/approve → admin approves redemption

3. app/services/gamification_service.py
   - calculate_points(weight_kg, waste_type) → returns points
   - check_mission_progress(user_id) → updates mission completion
   - check_badge_eligibility(user_id) → awards new badges
   - calculate_user_level(total_points) → returns level name

Include JWT auth and role-based access on all routes.

# ML Service 
Generate a separate Flask ML Service that loads pre-trained models and serves predictions.

The models are already saved as .pkl files:
- random_forest_model.pkl (Random Forest classifier)
- label_encoder.pkl (LabelEncoder for risk levels: low/medium/high)
- thresholds.pkl (dictionary with threshold values for features)

Features used by the model:
- recency (int): days since last deposit
- frequency (int): total number of deposits in observation period
- consistency (float): ratio of active months / total months

Create these files:

1. ml_service/app.py
   - Load all 3 pkl files on startup
   - POST /predict → accepts JSON {user_id, recency, frequency, consistency}, returns {user_id, risk_level, confidence_score}
   - POST /predict/batch → accepts list of users, returns batch predictions
   - GET /health → health check endpoint

2. ml_service/feature_calculator.py
   - calculate_recency(last_deposit_date) → days since last deposit from today
   - calculate_frequency(deposit_list) → count of deposits
   - calculate_consistency(deposit_list, period_months) → consistency score

3. ml_service/requirements.txt
   - flask, scikit-learn, pandas, numpy, joblib

Important: Handle model loading errors gracefully. Add logging for each prediction.

# Backend ML Integration Route
Generate app/routes/ml.py for the Flask backend that acts as a bridge to the ML service.

Endpoints:
1. POST /api/ml/analyze/{user_id} → admin triggers risk analysis for one user
   - Fetch user's deposit history from PostgreSQL
   - Calculate recency, frequency, consistency using the formulas below
   - Call ML Service at http://localhost:5001/predict
   - Save result to participation_risk table
   - Return risk result

2. POST /api/ml/analyze/all → admin triggers batch analysis for ALL users
   - Run for all active users
   - Call ML Service at http://localhost:5001/predict/batch
   - Update participation_risk table for all users

3. GET /api/ml/risk-summary → admin dashboard data
   - Returns count of users per risk level (low/medium/high)
   - Returns list of high-risk users with their details

Feature calculation formulas:
- recency = (today - max(deposit_date)).days
- frequency = count of validated deposits
- consistency = (count of months with at least 1 deposit) / (total months in observation period)
- observation_period = 6 months from latest deposit date backwards

Add JWT admin-only protection on all routes.

# Next.js Admin Dashboard
Generate a Next.js 14 admin dashboard for a Waste Bank management system using App Router.

Tech stack:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- Axios for API calls to Flask backend at http://localhost:5000

Pages to generate:

1. app/(auth)/login/page.tsx → Admin login form

2. app/(dashboard)/layout.tsx → Sidebar layout with navigation:
   - Dashboard, Deposit Validation, Members, Gamification, Rewards, Risk Analysis

3. app/(dashboard)/page.tsx → Main Dashboard with:
   - Stats cards: total members, total deposits today, high risk count, total points distributed
   - Line chart: deposit trends (last 30 days)
   - Pie chart: risk level distribution (low/medium/high)
   - Table: top 5 high-risk members

4. app/(dashboard)/deposits/page.tsx → Pending deposits table with validate button

5. app/(dashboard)/risk/page.tsx → Risk Analysis page:
   - Button to trigger batch ML analysis
   - Table: all members with risk level badge (color-coded: green/yellow/red)
   - Filter by risk level

Generate complete code for each file with proper TypeScript types.
Use environment variable NEXT_PUBLIC_API_URL for backend URL.

# Flutter Mobile APP
- Structure and Auth 
Generate a Flutter Android app for Waste Bank members (anggota bank sampah).

Tech stack:
- Flutter (Dart)
- Provider for state management
- Dio for HTTP requests
- SharedPreferences for token storage
- Go_router for navigation

Generate:

1. lib/main.dart → App entry point with Provider setup and GoRouter

2. lib/core/
   - api_client.dart → Dio instance with base URL, JWT interceptor (auto-attach token, handle 401)
   - constants.dart → API_BASE_URL and app constants

3. lib/features/auth/
   - auth_provider.dart → login(), logout(), isLoggedIn state
   - login_screen.dart → Clean login UI with email/password form

4. lib/features/home/
   - home_screen.dart → Bottom navigation bar with 4 tabs:
     * Beranda (home summary: poin, level, misi aktif)
     * Setor (form setor sampah)
     * Reward (katalog reward)
     * Profil (user profile)

5. lib/models/
   - user_model.dart
   - deposit_model.dart
   - mission_model.dart
   - reward_model.dart

Generate complete Dart code for all files.
Backend API base URL: http://10.0.2.2:5000/api (Android emulator localhost)

- Gamification Screens
Continue the Flutter app. Generate gamification feature screens.

1. lib/features/gamification/
   a. gamification_provider.dart
      - fetchSummary() → GET /api/gamification/summary
      - fetchMissions() → GET /api/gamification/missions
      - fetchLeaderboard() → GET /api/gamification/leaderboard

   b. home_tab.dart → Beranda screen showing:
      - User greeting with avatar
      - Points balance card with level badge
      - Progress bar to next level
      - Active missions list (with progress bar each)
      - Quick action button: "Setor Sampah"

   c. missions_widget.dart → Mission card widget:
      - Mission title and description
      - Progress bar (current/target)
      - Points reward badge
      - Status: completed ✓ or in progress

   d. leaderboard_screen.dart → Top 10 leaderboard:
      - Rank number, user name, total points
      - Current user highlighted

2. lib/features/deposit/deposit_screen.dart
   - Form: waste type dropdown, weight input (manual entry)
   - Submit button → POST /api/deposits
   - Show success message: "Setoran menunggu validasi admin"
   - Show pending deposits list

Use Material Design 3 components. Add loading states and error handling for all API calls.

# Testing and Environment Setup
Generate configuration and setup files for the complete Waste Bank project:

1. docker-compose.yml → orchestrate all services:
   - postgres (port 5432)
   - backend-api Flask (port 5000)
   - ml-service Flask (port 5001)
   - admin-web Next.js (port 3000)
   - Include volume for PostgreSQL data persistence
   - Include .env file references

2. .env.example for backend-api:
   DATABASE_URL=postgresql://user:password@localhost:5432/bank_sampah
   JWT_SECRET_KEY=your-secret-key
   ML_SERVICE_URL=http://ml-service:5001
   FLASK_ENV=development

3. .env.example for admin-web:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api

4. backend-api/init_db.py → script to:
   - Create all tables
   - Seed admin user (email: admin@dlh.padang.go.id, password: admin123)
   - Seed 3 sample missions
   - Seed 5 sample rewards

5. ml-service/load_models.py → test script to verify all 3 pkl files load correctly:
   - D:/kulyeah/Sems 8/TA/model/random_forest_model.pkl
   - D:/kulyeah/Sems 8/TA/model/label_encoder.pkl
   - D:/kulyeah/Sems 8/TA/model/thresholds.pkl
   Print model info and sample prediction after loading.
   
