export type DashboardOverview = {
  total_transactions: number;
  flagged_transactions: number;
  disputed_transactions?: number;
  approved_transactions: number;
  under_review_transactions?: number;
  fraud_rate: number;
  review_rate?: number;
  total_volume: number;
  flagged_volume?: number;
  active_users?: number;
  revenue_protected?: number;
  scope?: string;
  enabled_rules?: number;
  total_rules?: number;
  active_analysts?: number;
};

export type PublicStats = DashboardOverview & {
  pr_auc?: number | null;
  recall_fraud?: number | null;
  precision_at_alert?: number | null;
  artifact_present?: boolean;
  last_trained?: string | null;
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
  customer_status?: string;
  risk_level?: string;
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
  cnn_probability?: number;
  autoencoder_score?: number;
  model_family?: string;
  confidence: number;
  reasons: string[];
  narrative: string;
  feature_importance: { feature: string; contribution: number; direction: string; source?: string }[];
  scores: { rules: number; behavior: number; ml: number };
  persisted?: boolean;
  transaction_id?: number;
  status?: string;
};

export type ExplainTransactionResponse = {
  transaction_id: number;
  risk_score?: number;
  status: string;
  ml_probability?: number;
  cnn_probability?: number;
  autoencoder_score?: number;
  model_family?: string;
  decision_label?: string;
  stored_reasons?: string[];
  feature_importance?: { feature: string; contribution: number; direction: string }[];
  customer_status?: string;
  message?: string;
};

export type FraudNotification = {
  id: number;
  title: string;
  body: string;
  severity: string;
  category: string;
  read: boolean;
  created_at: string;
  transaction_id?: number | null;
};

export type DisputeCaseRow = {
  id: number;
  transaction_id: number;
  user_id: number;
  user_email: string | null;
  reason: string;
  status: string;
  customer_note: string;
  resolution_note: string;
  created_at: string;
  updated_at: string;
  transaction: {
    id: number;
    amount: number;
    merchant: string | null;
    location: string;
    status: string;
    risk_score: number;
    created_at: string;
  } | null;
};

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
  approved: boolean;
  email_verified: boolean;
  created_at: string;
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
  disputes: number;
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
