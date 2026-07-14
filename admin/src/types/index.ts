// ─── API Response Wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

// ─── User ─────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  account_number: string;
  gender?: string | null;
  nik?: string | null;
  address?: string | null;
  department?: string | null;
  role: "member" | "admin";
  level: string;
  total_points: number;
  created_at: string;
}

// ─── Waste Deposit ────────────────────────────────────────────────────
export interface WasteDeposit {
  id: string;
  user_id: string;
  user_name: string;
  account_number: string;
  weight_kg: number;
  waste_type: string;
  waste_label?: string;
  status: "pending" | "validated";
  points_earned: number;
  created_at: string;
  validated_at: string | null;
  validated_by: string | null;
  notes: string | null;
}

// ─── Mission ──────────────────────────────────────────────────────────
export interface Mission {
  id: number;
  title: string;
  description: string;
  target_type: "deposit_count" | "weight";
  target_value: number;
  points_reward: number;
  period: "daily" | "weekly";
  waste_type_code?: string | null;
  is_active: boolean;
  target_label?: "high" | "medium" | "low" | null;  // null = semua pengguna
  created_at: string;
  participants_count?: number;
  completed_count?: number;
}

// ─── Badge ────────────────────────────────────────────────────────────
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url: string | null;
  condition_type: string;
  condition_value: number;
  is_active?: boolean;
}

// ─── Reward ───────────────────────────────────────────────────────────
export interface Reward {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Reward Redemption ────────────────────────────────────────────────
export interface RewardRedemption {
  id: number;
  user_id: number;
  reward_id: number;
  points_spent: number;
  status: "pending" | "approved" | "rejected";
  redemption_code: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  reward?: Reward;
  user_name?: string;
  user_account_number?: string;
}

// ─── Participation Risk ───────────────────────────────────────────────
export interface ParticipationRisk {
  id: number;
  user_id: number;
  recency_days: number;
  frequency: number;
  consistency_score: number;
  risk_level: "low" | "medium" | "high";
  confidence_score: number;
  predicted_at: string;
}

// ─── Risk Summary ─────────────────────────────────────────────────────
export interface RiskSummary {
  distribution: {
    low: number;
    medium: number;
    high: number;
  };
  users: HighRiskUser[];
  high_risk_users: HighRiskUser[];
  total_analyzed: number;
  last_analyzed_at?: string;
}

export interface HighRiskUser {
  user_id: number;
  name: string;
  account_number: string;
  recency_days: number;
  frequency: number;
  consistency_score: number;
  risk_level: string;
  predicted_at: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────
export interface DashboardKPIs {
  total_members: number;
  active_members_this_month: number;
  total_deposits_today: number;
  total_weight_kg: number;
  high_risk_count: number;
  total_points_distributed: number;
  pending_deposits_count: number;
  pending_redemptions_count: number;
}

export interface DepositTrend {
  date: string;
  deposit_count: number;
  total_weight_kg: number;
}

// ─── Member Detail ────────────────────────────────────────────────────
export interface MemberDetail {
  member: User;
  stats: {
    total_deposits: number;
    total_weight_kg: number;
    badges_count: number;
    missions_completed: number;
  };
  risk_profile: ParticipationRisk | null;
  recent_deposits: WasteDeposit[];
  badges?: Badge[];
  active_missions?: Mission[];
}

// ─── Pagination ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── Risk Trend ───────────────────────────────────────────────────────
export interface RiskTrendItem {
  month: string;
  low: number;
  medium: number;
  high: number;
}

// ─── Waste Point Rates ───────────────────────────────────────────────
export interface WastePointRate {
  id: number;
  code: string;
  name: string;
  category: string;
  points_per_kg: number;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

// ─── Point Settings ───────────────────────────────────────────────────
export interface PointSetting {
  id: number;
  key: string;
  name: string;
  value: number;
  sort_order: number;
  updated_at?: string;
}
