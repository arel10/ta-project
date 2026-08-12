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
    phone?: string | null;
    account_number: string;
    gender?: string | null;
    nik?: string | null;
    ktp_image_url?: string | null;
    address?: string | null;
    department?: string | null;
    role: "member" | "admin";
    status?: "pending" | "approved" | "rejected";
    level: string;
    total_points: number;
    created_at: string;
    will_churn?: boolean | null;
    churn_probability?: number | null;
    risk_level?: string | null;
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
    status: "pending" | "validated" | "rejected";
    points_earned: number;
    created_at: string;
    validated_at: string | null;
    validated_by: string | null;
    rejection_reason?: string | null;
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
    target_label?: "churn" | "not_churn" | "high" | "medium" | "low" | null;
    deadline?: string | null;
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

// ─── Participation Risk / Churn Profile ────────────────────────────────
export interface ParticipationRisk {
    id: number;
    user_id: number;
    recency_days: number;
    frequency: number;
    consistency_score: number;
    avg_interval?: number | null;
    std_interval?: number | null;
    avg_berat?: number | null;
    trend_berat?: number | null;
    days_active?: number | null;
    churn_probability?: number | null;
    will_churn?: boolean | null;
    confidence_score: number;
    predicted_at: string;
    risk_level?: string; // backward compatibility
}

// ─── Churn Summary ─────────────────────────────────────────────────────
export interface ChurnSummary {
    distribution: {
        churn: number;
        not_churn: number;
        low?: number;
        medium?: number;
        high?: number;
    };
    users: ChurnUser[];
    churn_users: ChurnUser[];
    high_risk_users?: ChurnUser[]; // backward compatibility
    total_analyzed: number;
    last_analyzed_at?: string;
}

export type RiskSummary = ChurnSummary; // Type alias for compatibility

export interface ChurnUser {
    user_id: number;
    name: string;
    email?: string;
    account_number: string;
    recency_days: number;
    frequency: number;
    consistency_score: number;
    avg_interval?: number | null;
    std_interval?: number | null;
    avg_berat?: number | null;
    trend_berat?: number | null;
    days_active?: number | null;
    churn_probability?: number | null;
    will_churn?: boolean | null;
    confidence_score?: number | null;
    predicted_at: string;
    risk_level?: string; // backward compatibility
}

export type HighRiskUser = ChurnUser; // Type alias for compatibility

// ─── Dashboard Stats ──────────────────────────────────────────────────
export interface DashboardKPIs {
    total_members: number;
    active_members_this_month: number;
    total_deposits_today: number;
    total_weight_kg: number;
    churn_count: number;
    high_risk_count?: number; // backward compatibility
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
    churn_profile?: ParticipationRisk | null;
    risk_profile?: ParticipationRisk | null;
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

// ─── Churn Trend ───────────────────────────────────────────────────────
export interface ChurnTrendItem {
    month: string;
    churn: number;
    not_churn: number;
    low?: number;
    medium?: number;
    high?: number;
}

export type RiskTrendItem = ChurnTrendItem; // Type alias
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
