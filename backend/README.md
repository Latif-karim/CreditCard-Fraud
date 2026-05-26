# Fraud Detection Backend (Flask)

Enterprise-style API for credit card fraud detection: JWT auth (roles **admin**, **analyst**, **user**), transaction ingest and monitoring, ML scoring with explainability hooks, alerts, admin, reports, and audit trails.

## Quick start

1. Python 3.11+ recommended. Create a venv and install deps: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Configure the database:

- Local fallback: leave `DATABASE_URL` empty to use SQLite.
- Neon/PostgreSQL: set `DATABASE_URL` in `backend/.env` to your Neon pooled connection string, including `sslmode=require`.
- Demo data auto-seeding is disabled by default for Neon/PostgreSQL. Set `AUTO_SEED_DEMO_DATA=true` only if you intentionally want startup seeding.

Example:

```bash
DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/dbname?sslmode=require
```

4. Database migrations:

```bash
flask --app run db upgrade
```

If this is a fresh clone after new migrations were added, generate/apply migrations as usual (`db migrate` / `db upgrade`).

5. Run: `python run.py` (CORS enabled for local Next.js.)

## Roles

- **admin** — user/rule management, model retrain stub, full audit exports  
- **analyst** — dashboards, monitoring, fraud lab, explainability  
- **user** — cardholder workspace and owned transaction views  

Analyst/admin self-registration creates an access request (`approved=false`). The account signs in as a cardholder while the request is pending, then receives the requested role after an existing admin approves it.

## Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | Body: `email`, `password` (8+), optional `full_name`, `role` in `user` \| `analyst` \| `admin`; staff roles require approval |
| POST | `/auth/login` | Returns JWT + `role` |
| POST | `/auth/forgot-password` | OTP stored; in **debug**, response may include `dev_otp` |
| POST | `/auth/verify-otp` | `{ email, otp }` → `{ valid }` |
| POST | `/auth/reset-password` | `{ email, otp, new_password }` |
| POST | `/auth/verify-email` | JWT — marks `email_verified` (demo) |
| GET | `/auth/me` | JWT — profile |
| GET | `/auth/google`, `/auth/github` | OAuth redirect (requires `.env` client IDs) |
| GET | `/auth/oauth/providers` | Which social providers are configured |

### Google / GitHub sign-in troubleshooting (Windows)

OAuth uses **plain `requests`** (no Authlib). Set in `backend/.env`:

- Copy `backend/.env.example` to `backend/.env` and fill provider credentials. Empty credentials make the frontend show social sign-in as unavailable.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — redirect URI `http://127.0.0.1:5000/auth/google/callback`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — callback `http://127.0.0.1:5000/auth/github/callback`
- Copy `frontend/.env.local.example` to `frontend/.env.local` if the API is not running at the default `http://127.0.0.1:5000`.
- **`OAUTH_SSL_VERIFY=false`** if you see `CERTIFICATE_VERIFY_FAILED` in local development
- **`getaddrinfo failed`:** check internet/DNS/VPN

## Transactions

| Method | Path | Notes |
|--------|------|--------|
| POST | `/transactions/ingest` | JWT; optional `country`, `card_type`, `ip_address`, `device_id`, … |
| GET | `/transactions/flagged` | JWT |
| GET | `/transactions/list` | JWT; query: `page`, `per_page`, `q`, `status`, `risk_min`, `risk_max`, `country`, `merchant`, `date_from`, `date_to`, `sort` |
| PATCH | `/transactions/<id>/action` | `{ action: flag \| approve \| safe \| freeze_account }` |
| DELETE | `/admin/transactions/<id>` | Admin only — remove one transaction and related records |
| GET | `/admin/transactions` | Admin only — paginated transaction list for maintenance UI |

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

- `GET /admin/users`, `PATCH /admin/users/<id>`, `DELETE /admin/users/<id>` — manage users and their data
- `POST /admin/users/<id>/approve`, `POST /admin/users/<id>/reject` — review analyst/admin access requests
- `GET /admin/system/stats` — record counts for maintenance UI
- `POST /admin/data/purge-transactions` — body `{ "confirm": "DELETE_ALL_TRANSACTIONS" }` wipes all transaction-related data
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
