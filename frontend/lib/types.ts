export type DashboardOverview = {
  total_transactions: number;
  flagged_transactions: number;
  approved_transactions: number;
  fraud_rate: number;
  total_volume: number;
  active_users?: number;
  revenue_protected?: number;
};

export type FlaggedTransaction = {
  id: number;
  user_id: number;
  amount: number;
  location: string;
  risk_score: number;
  created_at: string;
};

export type TransactionRow = {
  id: number;
  user_id: number;
  amount: number;
  location: string;
  country?: string | null;
  merchant?: string | null;
  merchant_category?: string | null;
  card_last4?: string | null;
  card_type?: string | null;
  ip_address?: string | null;
  device_id?: string | null;
  status: string;
  risk_score: number;
  confidence: number;
  created_at: string;
};

export type PaginatedTransactions = {
  items: TransactionRow[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
};

export type TrendResponse = {
  labels: string[];
  fraud_series: number[];
  legit_series: number[];
};

export type LabelValueResponse = {
  labels: string[];
  values: number[];
};

export type LocationStat = {
  location: string;
  count: number;
  avg_risk: number;
};

export type AuditLog = {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  created_at: string;
};

export type LiveActivityItem = {
  title: string;
  detail: string;
  time: string;
};

export type HeatmapResponse = {
  cells: { country: string; category: string; intensity: number }[];
};

export type FraudSimulateResponse = {
  risk_score: number;
  label: string;
  ml_probability: number;
  confidence: number;
  reasons: string[];
  narrative: string;
  feature_importance: { feature: string; contribution: number; direction: string }[];
  scores: { rules: number; behavior: number; ml: number };
};

export type ExplainTransactionResponse = {
  transaction_id: number;
  risk_score: number;
  status: string;
  ml_probability: number;
  decision_label: string;
  stored_reasons: string[];
  feature_importance: { feature: string; contribution: number; direction: string }[];
};

export type FraudNotification = {
  id: number;
  title: string;
  body: string;
  severity: string;
  category: string;
  read: boolean;
  created_at: string;
};

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
  email_verified: boolean;
};

export type AdminTransactionRow = {
  id: number;
  user_id: number;
  amount: number;
  location: string;
  merchant: string | null;
  status: string;
  risk_score: number;
  created_at: string;
};

export type AdminTransactionsPage = {
  items: AdminTransactionRow[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
};

export type AdminSystemStats = {
  users: number;
  transactions: number;
  fraud_decisions: number;
  alerts: number;
  notifications: number;
  audit_logs: number;
};

export type FraudRule = {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
};
