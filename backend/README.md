# Fraud Detection Backend (Flask)

Enterprise-style API for credit card fraud detection: JWT auth (roles **admin**, **analyst**, **user**), transaction ingest and monitoring, ML scoring with explainability hooks, alerts, admin, reports, and audit trails.

## Quick start

1. Python 3.11+ recommended. Create a venv and install deps: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Database migrations:

```bash
flask --app run db upgrade
```

If this is a fresh clone after new migrations were added, generate/apply migrations as usual (`db migrate` / `db upgrade`).

4. Run: `python run.py` (CORS enabled for local Next.js.)

## Roles

- **admin** — user/rule management, model retrain stub, full audit exports  
- **analyst** — dashboards, monitoring, fraud lab, explainability  
- **user** — read-level dashboards (for demos); create analysts via self-registration or admin patch  

Create an **admin** by registering any account then updating `user.role` to `admin` in the DB, or use `PATCH /admin/users/<id>` from an existing admin session.

## Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | Body: `email`, `password` (8+), optional `full_name`, `role` in `user` \| `analyst` |
| POST | `/auth/login` | Returns JWT + `role` |
| POST | `/auth/forgot-password` | OTP stored; in **debug**, response may include `dev_otp` |
| POST | `/auth/verify-otp` | `{ email, otp }` → `{ valid }` |
| POST | `/auth/reset-password` | `{ email, otp, new_password }` |
| POST | `/auth/verify-email` | JWT — marks `email_verified` (demo) |
| GET | `/auth/me` | JWT — profile |

## Transactions

| Method | Path | Notes |
|--------|------|--------|
| POST | `/transactions/ingest` | JWT; optional `country`, `card_type`, `ip_address`, `device_id`, … |
| GET | `/transactions/flagged` | JWT |
| GET | `/transactions/list` | JWT; query: `page`, `per_page`, `q`, `status`, `risk_min`, `risk_max`, `country`, `merchant`, `date_from`, `date_to`, `sort` |
| PATCH | `/transactions/<id>/action` | `{ action: flag \| approve \| safe \| freeze_account }` |

## Dashboard (JWT; `user` / `analyst` / `admin` for reads)

- `GET /dashboard/overview` — KPIs including `active_users`, `revenue_protected`  
- `GET /dashboard/trends`, `fraud-vs-legit`, `risk-distribution`, `top-locations`  
- `GET /dashboard/fraud-by-region`, `fraud-by-card`  
- `GET /dashboard/recent-transactions`, `live-activity`, `heatmap`, `model-metrics`  
- `GET /dashboard/audit-logs`  
- `GET /dashboard/rules` — **admin only**

## Fraud & explainability

- `POST /fraud/simulate` — manual scoring + approximate feature attribution (no DB write unless you extend)  
- `GET /fraud/explain/<transaction_id>` — stored decision + feature ranking approximation  

## Alerts

- `GET /alerts/notifications` — in-app fraud notifications (seeded on first load)  
- `PATCH /alerts/notifications/<id>/read`  
- `GET /alerts/email-log`  

## Admin (JWT **admin**)

- `GET /admin/users`, `PATCH /admin/users/<id>`  
- `PATCH /admin/rules/<id>` — toggle `FraudRule.enabled`  
- `POST /admin/models/retrain` — stub audit event  

## Reports

- `GET /reports/transactions.csv`  
- `GET /reports/summary.json`  
- `GET /reports/summary.pdf` — JSON stub until PDF pipeline is wired  
- `GET /reports/audit-export.json`  

## Users / profile

- `GET /users/me`, `PATCH /users/me`  
- `POST /users/change-password`  
- `GET /users/sessions`  
- `POST /users/toggle-2fa`  

## ML training

Dataset: [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) — place `creditcard.csv` under `backend/ml/data/`.

```bash
python ml/train_model.py --dataset "C:\path\to\creditcard.csv"
```

Artifacts: `ml/artifacts/fraud_model.joblib`, `metrics.json`. Runtime loads the joblib in `app/fraud/model.py` when present.

## Next steps (production)

- SMTP / SendGrid for real email; remove `dev_otp` leakage outside debug  
- True SHAP / model explainers wired to `fraud/explain`  
- Redis for rate limits and streaming ingestion  
- Never store PAN/CVV; tokenize cards  
