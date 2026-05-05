Create a new Next.js 14 project called "sirkula-admin" with these specifications:

Tech stack:
- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui (New York style, zinc color scheme)
- Recharts for charts
- Axios for API calls
- React Hook Form + Zod for form validation
- js-cookie for token management

Generate these config files:

1. package.json with all dependencies above
2. tailwind.config.ts with shadcn/ui preset
3. next.config.ts with:
   - NEXT_PUBLIC_API_URL environment variable
   - Image domains: localhost
4. .env.local:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
5. tsconfig.json with path alias: @/* → ./src/*
6. src/lib/axios.ts → Axios instance with:
   - baseURL from NEXT_PUBLIC_API_URL
   - Request interceptor: auto-attach Bearer token from cookie
   - Response interceptor: on 401 → clear cookie → redirect to /login
7. src/lib/utils.ts → cn() utility + formatDate() + formatNumber()
8. src/types/index.ts → TypeScript interfaces for:
   - User, WasteDeposit, Mission, Badge, Reward, 
     RewardRedemption, ParticipationRisk, RiskSummary
   - API response wrapper: ApiResponse<T>


Continue the sirkula-admin Next.js project.
Generate the authentication system:

1. src/app/(auth)/layout.tsx
   - Centered layout with Sirkula logo and brand color #16a34a (green-600)
   - Clean white card container

2. src/app/(auth)/login/page.tsx
   - Form fields: email, password
   - Validation with Zod: email format, password min 6 chars
   - On submit: POST /api/auth/login
   - On success: save access_token to cookie (js-cookie, expires 1 day)
               save refresh_token to cookie (expires 7 days)
               redirect to /dashboard
   - Show error toast on wrong credentials
   - Loading state on button

3. src/middleware.ts
   - Protect all routes under /dashboard/*
   - If no token cookie → redirect to /login
   - If on /login with valid token → redirect to /dashboard

4. src/hooks/useAuth.ts
   - getCurrentUser() → GET /api/auth/me
   - logout() → clear cookies → redirect /login
   - Returns: { user, isLoading, logout }

5. src/components/providers/auth-provider.tsx
   - React context wrapping the app
   - Fetch current user on mount
   - Expose user data globally

Use shadcn/ui components: Button, Input, Label, Card, Form.
Show loading spinner during auth check.


Continue sirkula-admin. Generate the dashboard layout:

1. src/app/(dashboard)/layout.tsx
   - Full-height sidebar layout (sidebar fixed, content scrollable)
   - Sidebar width: 240px
   - Top header bar: 64px height

2. src/components/layout/sidebar.tsx
   Navigation items with icons (lucide-react):
   - Dashboard → /dashboard (LayoutDashboard icon)
   - Validasi Setoran → /dashboard/deposits (CheckSquare icon)
   - Anggota → /dashboard/members (Users icon)
   - Analisis Risiko → /dashboard/risk (AlertTriangle icon)
   - Misi & Gamifikasi → /dashboard/missions (Trophy icon)
   - Katalog Reward → /dashboard/rewards (Gift icon)
   - Pengaturan → /dashboard/settings (Settings icon)

   Features:
   - Active route highlighted with green-600 background
   - Sirkula logo at top of sidebar
   - Admin user avatar + name at bottom of sidebar
   - Logout button at bottom

3. src/components/layout/header.tsx
   - Page title (dynamic based on route)
   - Notification bell icon (badge count)
   - Admin avatar with dropdown: Profile, Logout

4. src/components/ui/stat-card.tsx
   - Reusable card: icon, label, value, trend (% up/down vs yesterday)
   - Color variants: green (good), yellow (warning), red (danger), blue (info)

Use shadcn/ui: Sheet for mobile sidebar, Avatar, DropdownMenu, Badge.
Make sidebar responsive: collapse to icon-only on md, Sheet drawer on mobile.


Continue sirkula-admin. Generate src/app/(dashboard)/page.tsx (main dashboard).

This page fetches data from multiple endpoints and shows:

SECTION 1 — Stats Row (4 cards):
- Total Anggota → GET /api/admin/stats/members (total count)
- Setoran Hari Ini → GET /api/admin/stats/deposits-today (count + weight kg)
- Anggota High Risk → GET /api/ml/risk-summary (high risk count)
- Total Poin Tersebar → GET /api/admin/stats/points (total points ever given)

SECTION 2 — Charts Row (2 columns):
Left (60%): Line chart "Tren Setoran 30 Hari"
- X axis: date (last 30 days)
- Y axis: jumlah setoran
- Data: GET /api/admin/stats/deposit-trend?days=30
- Use Recharts: ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip

Right (40%): Pie chart "Distribusi Risiko Anggota"
- 3 segments: Low (green), Medium (yellow), High (red)
- Data: GET /api/ml/risk-summary
- Show count labels inside each segment
- Use Recharts: PieChart, Pie, Cell, Legend, Tooltip

SECTION 3 — Two tables side by side:
Left: "Setoran Pending Terbaru" (last 5)
- Columns: Nama Anggota, Jenis Sampah, Waktu, Action (Validasi button)
- Data: GET /api/deposits/pending?limit=5

Right: "Anggota High Risk"
- Columns: Nama, Last Setor, Recency (days), Risk badge
- Data: GET /api/ml/risk-summary → high_risk_users (top 5)
- Risk badge: red pill "High Risk"

All sections use React Suspense with skeleton loading states.
Use shadcn/ui: Card, Table, Badge, Button, Skeleton.
Add auto-refresh every 5 minutes using setInterval.


Continue sirkula-admin. Generate src/app/(dashboard)/deposits/page.tsx

This is the main page for admin to validate waste deposits.

FEATURES:

1. Filter bar (top):
   - Search by member name (text input)
   - Filter by status: All | Pending | Validated (tabs/segmented)
   - Date range picker (today, last 7 days, last 30 days, custom)
   - Export CSV button

2. Data table — columns:
   - No
   - Nama Anggota (with account number below)
   - Jenis Sampah (badge: Organik/Anorganik/B3)
   - Berat Input (kg) — member's self-reported weight
   - Berat Aktual (kg) — editable field when validating
   - Poin Diberikan (calculated, shown after input)
   - Waktu Setor
   - Status badge (Pending=yellow, Validated=green)
   - Action column

3. Validate modal (Dialog):
   Triggered by "Validasi" button on each pending row.
   Fields:
   - Tampilkan info: Nama, Jenis, Berat Input
   - Input: Berat Aktual (kg) — number input, required
   - Auto-calculate preview: "Poin yang akan diberikan: X poin"
     (formula: berat_aktual × 100 for organik, × 150 for anorganik)
   - Confirm button → PUT /api/deposits/{id}/validate
     Body: { actual_weight_kg: number }
   - On success: toast "Setoran berhasil divalidasi!", refresh table

4. Pagination: 10 rows per page

Data source: GET /api/deposits/pending (and /api/deposits for all)

Use shadcn/ui: Table, Dialog, Input, Select, Button, Badge, Tabs, Pagination.
Add optimistic UI update after validation (remove from pending table instantly).


Continue sirkula-admin. Generate src/app/(dashboard)/members/page.tsx

Member management page with full details.

FEATURES:

1. Header: "Daftar Anggota" + total count badge + "Tambah Anggota" button

2. Search + Filter bar:
   - Search by name / account number
   - Filter by risk level: Semua | Low | Medium | High
   - Filter by status: Aktif | Tidak Aktif (no deposit in 30 days)
   - Sort by: Nama, Total Poin, Last Setor, Risk Level

3. Member table — columns:
   - Avatar (initials-based, colored by risk level)
   - Nama + No. Rekening
   - Total Poin
   - Level (Bronze/Silver/Gold/Platinum badge)
   - Last Setor (relative time: "3 hari lalu")
   - Risk Level badge (green/yellow/red)
   - Action: "Detail" button

4. Member Detail Sheet (opens from right side, not new page):
   Sections:
   a. Profile: nama, email, account number, join date, total setoran (kg)
   b. Gamifikasi: poin, level, progress bar ke next level, badges grid
   c. Riwayat Setoran: mini table (last 10 deposits)
   d. Risk Profile: recency, frequency, consistency scores + risk level + last analyzed
   e. Misi Aktif: list of ongoing missions with progress

   Data: GET /api/admin/members/{id}/detail

5. Add Member modal:
   Fields: nama, email, password, nomor rekening
   POST /api/auth/register (with admin role calling it)

Data: GET /api/admin/members with query params for filter/search/sort
Use shadcn/ui: Sheet, Avatar, Progress, Table, Badge, Dialog, Input.


Continue sirkula-admin. Generate src/app/(dashboard)/risk/page.tsx

This is the ML-powered risk analysis dashboard.

FEATURES:

1. Top action bar:
   - "Jalankan Analisis Semua Anggota" button (primary, green)
     → POST /api/ml/analyze/all
     → Show progress dialog with loading spinner: "Model sedang memproses X anggota..."
     → On success: refresh page, show toast "Analisis selesai untuk X anggota"
   - "Terakhir dianalisis: [datetime]" text
   - Export CSV button

2. Summary cards row (3 cards):
   - Low Risk: count + green background
   - Medium Risk: count + yellow background  
   - High Risk: count + red background
   Data: GET /api/ml/risk-summary

3. Risk distribution chart:
   - Horizontal bar chart showing risk trend over last 6 months
   - X: month, Y: count per risk category (stacked bars)
   - Colors: green/yellow/red per stack
   Data: GET /api/ml/risk-trend?months=6

4. Main risk table — columns:
   - Nama Anggota + No. Rekening
   - Recency (days since last deposit) — colored: 
     green <30, yellow 30-60, red >60
   - Frequency (total deposits)
   - Consistency Score (0-1, shown as percentage)
   - Risk Level badge (Low=green, Medium=amber, High=red)
   - Last Analyzed (relative time)
   - Action: "Analisis Ulang" button (per user)
     → POST /api/ml/analyze/{user_id}
     → Update that row in table

5. Filter: by risk level tabs (Semua | Low | Medium | High)
   Search by name.
   Sort by: Recency, Frequency, Consistency, Risk Level.

6. Intervention suggestions panel (collapsible, for High Risk users):
   Show automatically when High Risk count > 0.
   List high-risk members with suggestion: 
   "Kirim notifikasi misi khusus" button (future feature, show as disabled)

Data: GET /api/ml/risk-summary
Use shadcn/ui: Table, Badge, Progress, Dialog, Alert, Tabs, Button.
Add color-coded row highlighting: red background (opacity 5%) for High Risk rows.


Continue sirkula-admin. Generate src/app/(dashboard)/missions/page.tsx

Admin page to manage gamification missions and point settings.

FEATURES:

1. Tabs: "Misi Aktif" | "Semua Misi" | "Pengaturan Poin"

TAB 1 & 2 — Mission table:
Columns:
- Judul Misi
- Tipe (Harian/Mingguan badge)
- Target (e.g., "Setor 3x" or "Total 5kg")
- Reward Poin
- Anggota Ikut (count)
- Anggota Selesai (count + percentage bar)
- Status toggle (Active/Inactive switch)
- Actions: Edit, Delete

"Tambah Misi" button → Modal with form:
Fields:
- Judul (text, required)
- Deskripsi (textarea)
- Tipe Target: dropdown (deposit_count | weight)
- Nilai Target: number input
- Periode: dropdown (daily | weekly)
- Poin Reward: number input
- Status: toggle active/inactive
POST /api/admin/missions

Edit mission → same modal prefilled → PUT /api/admin/missions/{id}
Delete → confirmation dialog → DELETE /api/admin/missions/{id}

TAB 3 — Pengaturan Poin:
Form cards for point calculation rules:
- Poin per kg Sampah Organik: number input (default: 100)
- Poin per kg Sampah Anorganik: number input (default: 150)
- Level thresholds:
  * Bronze: 0 - X poin
  * Silver: X - Y poin
  * Gold: Y - Z poin
  * Platinum: Z+ poin
  (editable inputs for X, Y, Z)
Save button → PUT /api/admin/settings/points

Also show: Badge management mini-section
- List of badges with icon, name, condition
- Toggle active/inactive

Data: GET /api/admin/missions, GET /api/admin/settings
Use shadcn/ui: Tabs, Table, Dialog, Switch, Input, Select, Textarea, Button.


Continue sirkula-admin. Generate src/app/(dashboard)/rewards/page.tsx

Admin page for reward catalog and redemption management.

FEATURES:

Tabs: "Katalog Reward" | "Penukaran Pending" | "Riwayat Penukaran"

TAB 1 — Reward Catalog:
Grid layout (3 columns) showing reward cards:
Each card:
- Gambar placeholder (gray box with gift icon if no image)
- Nama reward
- Poin yang dibutuhkan (bold)
- Stok tersisa (red if stok < 5, green otherwise)
- Status badge (Aktif/Nonaktif)
- Edit & Delete buttons

"Tambah Reward" button → Modal:
Fields:
- Nama reward (text)
- Deskripsi (textarea)
- Poin yang dibutuhkan (number)
- Stok (number)
- Upload gambar (file input, show preview)
- Status aktif (toggle)
POST /api/admin/rewards

Edit → prefilled modal → PUT /api/admin/rewards/{id}
Restock button (quick add stock): input number → PATCH /api/admin/rewards/{id}/stock

TAB 2 — Penukaran Pending:
Table — columns:
- Nama Anggota
- Reward yang Ditukar
- Poin Digunakan
- Kode Penukaran (monospace, copyable)
- Waktu Request
- Action: "Konfirmasi Penyerahan" button

Konfirmasi modal:
- Show: nama anggota, reward, kode
- Input: verifikasi kode penukaran (anggota tunjukkan kode)
- Confirm → PUT /api/rewards/redemptions/{id}/approve
- On success: move to riwayat, reduce stock

TAB 3 — Riwayat:
Full table with date filter, status filter (all/approved/rejected)
Export CSV button

Data: 
- GET /api/admin/rewards
- GET /api/rewards/redemptions (admin sees all)
Use shadcn/ui: Tabs, Card, Dialog, Input, Badge, Button, Table.
Add stock warning alert when any reward has stock < 5.


I need additional Flask routes for the admin web dashboard.
Add these to the existing Flask backend:

File: app/routes/admin.py

1. GET /api/admin/stats/members
   Returns: { total: int, active_this_month: int, new_this_week: int }

2. GET /api/admin/stats/deposits-today
   Returns: { count: int, total_weight_kg: float, total_points_given: int }

3. GET /api/admin/stats/deposit-trend?days=30
   Returns: [{ date: "YYYY-MM-DD", count: int, weight_kg: float }] for last N days

4. GET /api/admin/stats/points
   Returns: { total_points_distributed: int, total_points_redeemed: int }

5. GET /api/admin/members
   Query params: search, risk_level, status, sort_by, page, per_page
   Returns: paginated list of members with their risk profile

6. GET /api/admin/members/{id}/detail
   Returns: full member profile including:
   - profile info
   - gamification summary (points, level, badges)
   - last 10 deposits
   - risk profile
   - active missions

7. GET /api/ml/risk-trend?months=6
   Returns: [{ month: "YYYY-MM", low: int, medium: int, high: int }]

8. GET /api/admin/missions
   Returns: all missions with participation stats

9. PUT /api/admin/missions/{id}
   Update mission fields

10. DELETE /api/admin/missions/{id}
    Soft delete (set is_active=False)

11. GET /api/admin/rewards
    Returns: all rewards including stock info

12. PATCH /api/admin/rewards/{id}/stock
    Body: { add_stock: int }

All routes require JWT admin role.
Add proper pagination, filtering, and error handling.


Generate the reward redemption management page for sirkula-admin.

File: src/app/(dashboard)/rewards/redemptions/page.tsx

This page is for admin to manage all reward redemptions from members.

--- TYPES needed ---
interface RewardRedemption {
  id: string
  user: { id: string; name: string; account_number: string; avatar_initials: string }
  reward: { id: string; name: string; points_cost: number }
  points_spent: number
  redemption_code: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  approved_by?: string
  rejection_reason?: string
}

--- STATE ---
- activeTab: 'pending' | 'approved' | 'history'
- searchQuery: string
- dateRange: { from: Date | null; to: Date | null }
- selectedRedemption: RewardRedemption | null (for modal)
- verificationCode: string (input in modal)
- codeMatch: boolean (verificationCode === selectedRedemption.redemption_code)

--- SUMMARY CARDS (pending tab only) ---
3 cards fetched from GET /api/admin/redemptions/summary:
{ pending_count, total_points_held, affected_rewards_count }

--- DATA FETCHING ---
GET /api/rewards/redemptions?status={activeTab}&search={query}&page={page}
Returns: { data: RewardRedemption[], total, page, per_page }

--- TABLE COLUMNS ---
Pending tab:
  no | member (avatar+name+account) | reward (name+points) | 
  code (monospace+copy) | requested_at | status badge | actions

Approved tab:
  no | member | reward | code | requested_at | 
  approved_at | approved_by | status badge

History tab:
  no | member | reward | code | requested_at | 
  resolved_at | status badge (all 3 types) | notes

--- COPY CODE FEATURE ---
Copy icon button next to redemption code.
On click: navigator.clipboard.writeText(code)
Show toast: "Kode disalin!" 
Change icon to CheckCheck for 2 seconds then revert.

--- CONFIRM MODAL ---
Triggered by "Konfirmasi" button.
Uses shadcn/ui Dialog component.

State inside modal:
- verificationCode: string
- isSubmitting: boolean
- error: string

Content:
1. Member info section (bg-gray-50 rounded-lg p-4):
   Avatar + name + account_number + current_points

2. Reward info section:
   reward name + points_cost + remaining stock after approval

3. Verification code display (bg-green-50 border border-green-200 rounded-lg):
   Large monospace text showing selectedRedemption.redemption_code
   Instruction: "Minta anggota menunjukkan kode ini"
   
   Input below (Label: "Masukkan Kode untuk Verifikasi"):
   onChange: setVerificationCode
   Show: green CheckCircle icon if codeMatch, red XCircle if typed but no match
   Border: green if match, red if mismatch (after typing)

4. Warning Alert (variant: destructive, but amber colored):
   "Tindakan ini tidak dapat dibatalkan"

Submit handler:
  - Validate: verificationCode === selectedRedemption.redemption_code
  - If not match: show error "Kode tidak sesuai, periksa kembali"
  - If match: PUT /api/rewards/redemptions/{id}/approve
  - On success: 
    * toast.success("Reward berhasil diserahkan!")
    * Remove row from pending table (optimistic update)
    * Close modal
    * Refresh summary cards

--- REJECT FLOW ---
"Tolak" button → small inline dialog:
- Textarea: "Alasan penolakan" (required)
- PUT /api/rewards/redemptions/{id}/reject
  Body: { reason: string }
- On success: toast + remove from pending

--- PAGINATION ---
10 items per page.
Show: "Menampilkan X-Y dari Z penukaran"

Use shadcn/ui: Tabs, Table, Dialog, Badge, Button, Input, 
Textarea, Alert, Avatar, Skeleton (loading state).
Use sonner for all toasts.
Add empty state for each tab:
- Pending: "Tidak ada penukaran yang menunggu konfirmasi" + checkmark illustration
- Approved: "Belum ada penukaran yang disetujui"


