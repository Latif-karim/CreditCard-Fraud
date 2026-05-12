export type DashboardOverview = {
  total_transactions: number;
  flagged_transactions: number;
  approved_transactions: number;
  fraud_rate: number;
  total_volume: number;
};

export type FlaggedTransaction = {
  id: number;
  user_id: number;
  amount: number;
  location: string;
  risk_score: number;
  created_at: string;
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
