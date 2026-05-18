"""
Generate FraudShield project & codebase PDF for defense preparation.
Run: python scripts/generate_codebase_guide_pdf.py
Output: FraudShield-Codebase-Guide.pdf (repo root)
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "FraudShield-Codebase-Guide.pdf"


def _ascii(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2192", "->")
        .replace("\u2022", "-")
        .encode("latin-1", errors="replace")
        .decode("latin-1")
    )


def build_pdf() -> bytes:
    from fpdf import FPDF

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(18, 18, 18)
    w = pdf.epw

    def section_title(text: str) -> None:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(15, 23, 42)
        pdf.multi_cell(w, 8, _ascii(text))
        pdf.ln(2)
        pdf.set_draw_color(14, 165, 233)
        pdf.set_line_width(0.4)
        y = pdf.get_y()
        pdf.line(18, y, 192, y)
        pdf.ln(4)
        pdf.set_text_color(30, 41, 59)

    def sub_title(text: str) -> None:
        pdf.set_font("Helvetica", "B", 11)
        pdf.multi_cell(w, 6, _ascii(text))
        pdf.ln(1)

    def body(text: str) -> None:
        pdf.set_font("Helvetica", "", 10)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(w, 5, _ascii(text))
        pdf.ln(2)

    def bullets(items: list[str]) -> None:
        pdf.set_font("Helvetica", "", 10)
        for item in items:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(w, 5, _ascii(f"- {item}"))
        pdf.ln(2)

    def code_line(text: str) -> None:
        pdf.set_font("Courier", "", 9)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(w, 4.5, _ascii(text))
        pdf.set_text_color(30, 41, 59)
        pdf.ln(1)

    # --- Title page ---
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(15, 23, 42)
    pdf.ln(25)
    pdf.cell(0, 12, "FraudShield", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 14)
    pdf.cell(0, 10, "Credit Card Fraud Detection Platform", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Project & Codebase Technical Guide", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(12)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(71, 85, 105)
    pdf.multi_cell(
        w,
        6,
        _ascii(
            "This document describes the full-stack implementation: architecture, source layout, "
            "fraud scoring pipeline, API surface, database design, authentication, role-based access, "
            "and frontend modules. Use it to prepare for project demonstration and technical questioning."
        ),
        align="C",
    )
    pdf.ln(8)
    pdf.set_x(pdf.l_margin)
    pdf.cell(
        0,
        6,
        f"Generated: {datetime.now(timezone.utc).strftime('%d %B %Y, %H:%M UTC')}",
        new_x="LMARGIN",
        new_y="NEXT",
        align="C",
    )
    pdf.set_text_color(30, 41, 59)

    # --- 1. Overview ---
    pdf.add_page()
    section_title("1. Project overview")
    body(
        "FraudShield is a web application that ingests card transactions, scores them for fraud risk "
        "using a hybrid approach (deterministic rules, behavioral profiling, and machine learning), "
        "stores decisions with audit trails, and presents results through a role-based operations console."
    )
    sub_title("Problem addressed")
    bullets(
        [
            "Detect suspicious card payments in near real time.",
            "Combine explainable rule signals with ML probability for analyst review.",
            "Support multiple personas: cardholder, fraud analyst, and administrator.",
            "Provide dashboards, alerts, exports, and investigation workflows.",
        ]
    )
    sub_title("Repository layout")
    bullets(
        [
            "backend/  - Flask REST API, SQLAlchemy models, ML training & inference, migrations.",
            "frontend/ - Next.js 14 (App Router) UI with Tailwind CSS and Chart.js.",
            "scripts/  - Utility scripts including this PDF generator.",
            "DEFENSE.md / README.md - Quick-start and demo notes (Markdown).",
        ]
    )

    # --- 2. Architecture ---
    section_title("2. System architecture")
    body(
        "Three-tier pattern: React/Next.js client, Flask JSON API, SQLite database. "
        "The client stores JWT in localStorage and sends Authorization: Bearer on API calls. "
        "A lightweight session cookie (fraudshield_session) allows Next.js middleware to gate /dashboard routes."
    )
    sub_title("Request flow (transaction ingest)")
    bullets(
        [
            "1. Client POST /transactions/ingest with amount, location, merchant, etc.",
            "2. JWT validated; cardholder role forced to own user_id.",
            "3. evaluate_transaction() runs rules + behavior + ML.",
            "4. Transaction row saved; FraudDecision row stores breakdown.",
            "5. UserProfile updated (rolling average spend, top locations).",
            "6. If risk_score >= 60: status flagged, email alert stub, notification row.",
            "7. AuditLog entry written for traceability.",
        ]
    )
    sub_title("Startup behaviour")
    body("On backend start, seed_all() ensures demo users and seeds ~80 sample transactions if the DB is sparse.")

    # --- 3. Tech stack ---
    section_title("3. Technology stack")
    sub_title("Backend (requirements.txt)")
    bullets(
        [
            "Flask - HTTP API and application factory (app/__init__.py).",
            "Flask-SQLAlchemy + Flask-Migrate - ORM and schema migrations.",
            "Flask-JWT-Extended - JWT access tokens (24h expiry in config.py).",
            "Flask-Bcrypt - Password hashing.",
            "Marshmallow - Request validation schemas (app/schemas.py).",
            "scikit-learn, pandas, imbalanced-learn, joblib - ML training and inference.",
            "flask-cors - Cross-origin requests from Next.js dev server.",
            "fpdf2 - PDF report generation.",
        ]
    )
    sub_title("Frontend (package.json)")
    bullets(
        [
            "Next.js 14.2 - App Router, server/client components.",
            "React 18 - UI.",
            "TypeScript 5.5 - Type safety.",
            "Tailwind CSS 3.4 - Styling, dark/light themes (next-themes).",
            "Chart.js + react-chartjs-2 - Dashboard charts.",
            "framer-motion - Landing page animations.",
            "lucide-react - Icons.",
        ]
    )

    # --- 4. Backend ---
    pdf.add_page()
    section_title("4. Backend structure (Flask)")
    sub_title("Application factory - backend/app/__init__.py")
    body("Creates Flask app, loads Config, registers extensions (db, jwt, bcrypt), CORS, all blueprints, /health, and seeds data.")
    sub_title("Blueprints and responsibilities")
    bullets(
        [
            "auth (/auth) - register, login, password reset OTP, verify-email, /me.",
            "transactions (/transactions) - ingest, list, feed, flagged, simulator, PATCH actions.",
            "dashboard (/dashboard) - KPIs, charts, heatmap, audit logs, fraud rules list.",
            "admin (/admin) - user management, toggle FraudRule.enabled, model retrain stub.",
            "alerts (/alerts) - in-app notifications and email log.",
            "reports (/reports) - CSV, JSON, PDF exports and seed endpoint.",
            "fraud (/fraud) - simulate scoring without persist; explain by transaction id.",
            "users (/users) - profile, password change, sessions, 2FA toggle (demo).",
        ]
    )
    sub_title("Key services (backend/app/services/)")
    bullets(
        [
            "transaction_ingest.py - Central pipeline: score, persist, profile update, alerts.",
            "rbac.py - scope_transactions(), is_staff(), can_manage_transaction().",
            "seed_data.py - Demo users and synthetic transaction seeding.",
            "simulator.py - Background thread ingesting every N seconds.",
            "transaction_generator.py - Random realistic transaction payloads.",
            "audit.py - log_action() writes AuditLog rows.",
            "alerts.py - send_email_alert() creates Alert records (simulated email).",
        ]
    )
    sub_title("Configuration - backend/app/config.py")
    bullets(
        [
            "SECRET_KEY, JWT_SECRET_KEY from environment (defaults for dev).",
            "DATABASE_URL default: sqlite:///fraud_detection.db",
            "JWT_ACCESS_TOKEN_EXPIRES: 24 hours",
        ]
    )

    # --- 5. Fraud pipeline ---
    section_title("5. Fraud detection pipeline")
    body("Core function: evaluate_transaction() in backend/app/fraud/engine.py")
    sub_title("A. Rule engine (fraud/rules.py)")
    bullets(
        [
            "Amount exceeds $5,000 -> +20 points.",
            "Five or more transactions in 10 minutes -> +15 points.",
            "Location differs from user's most recent transaction -> +10 points.",
        ]
    )
    sub_title("B. Behavioral engine (fraud/behavior.py)")
    bullets(
        [
            "Uses UserProfile: avg_spend, top_locations (comma-separated), tx_count.",
            "Amount > 2.5x rolling average -> +15.",
            "Location not in historical top locations -> +10.",
            "Large jump vs last transaction amount -> +5.",
        ]
    )
    sub_title("C. Machine learning (fraud/model.py)")
    bullets(
        [
            "Loads backend/ml/artifacts/fraud_model.joblib if present (trained via ml/train_model.py).",
            "Features: amount, tx_frequency_10m, minutes_since_last.",
            "Outputs probability; ml_score = probability * 35 (capped in final sum).",
            "Fallback heuristic if model file missing.",
        ]
    )
    sub_title("D. Score fusion and labels")
    bullets(
        [
            "final_score = min(100, rule_score + behavior_score + ml_score)",
            "Labels: critical >=80, high >=60, medium >=30, else low.",
            "Transaction.status: flagged if score >= 60, else approved.",
        ]
    )
    sub_title("E. Explainability (fraud/explain.py)")
    body(
        "Builds feature contribution list for charts (approximation for transparency). "
        "Used by GET /fraud/explain/<id> and fraud lab simulate endpoint. "
        "Note: Admin FraudRule table toggles are UI/catalog; live scoring uses hard-coded Python rules unless extended."
    )

    # --- 6. Database ---
    pdf.add_page()
    section_title("6. Database design")
    body("SQLite via SQLAlchemy. Main entities in backend/app/models.py:")
    bullets(
        [
            "User - email, role (user|analyst|admin), password hash, is_active, email_verified.",
            "Transaction - amount, location, merchant, card fields, risk_score, status, confidence.",
            "FraudDecision - 1:1 with Transaction; stores rule/behavior/ml scores and reasons text.",
            "UserProfile - 1:1 with User; avg_spend, top_locations, tx_count.",
            "FraudRule - name, enabled, priority (admin-managed catalog).",
            "Alert - email delivery log linked to transaction.",
            "FraudNotification - in-app alert feed items.",
            "AuditLog - actor_user_id, action, entity, entity_id, JSON details.",
            "PasswordResetToken, UserSession - auth support tables.",
        ]
    )
    sub_title("Migrations")
    body("Flask-Migrate under backend/migrations/. Run: python -m flask --app run db upgrade")

    # --- 7. API ---
    section_title("7. API reference (summary)")
    sub_title("Authentication")
    bullets(
        [
            "POST /auth/register  {email, password, full_name, role}",
            "POST /auth/login     -> {access_token, role, user_id}",
            "GET  /auth/me        JWT required",
            "POST /auth/forgot-password, verify-otp, reset-password",
        ]
    )
    sub_title("Transactions")
    bullets(
        [
            "POST /transactions/ingest - Score and store (RBAC on user_id).",
            "GET  /transactions/list?page&filters - Paginated, scoped for cardholder.",
            "GET  /transactions/flagged, /transactions/feed?after_id=",
            "POST /transactions/simulator/start|stop|tick - Staff roles.",
            "PATCH /transactions/<id>/action  {action: flag|approve|safe|freeze_account}",
        ]
    )
    sub_title("Dashboard & admin")
    bullets(
        [
            "GET /dashboard/overview, /trends, /fraud-vs-legit, /heatmap, /model-metrics, ...",
            "GET /dashboard/audit-logs - Staff only.",
            "GET /dashboard/rules - Admin only.",
            "GET/PATCH /admin/users, PATCH /admin/rules/<id>, POST /admin/models/retrain",
        ]
    )
    sub_title("Reports & fraud")
    bullets(
        [
            "GET /reports/transactions.csv, /summary.json, /summary.pdf, /audit-export.json",
            "POST /fraud/simulate, GET /fraud/explain/<transaction_id>",
        ]
    )

    # --- 8. Frontend ---
    pdf.add_page()
    section_title("8. Frontend structure (Next.js)")
    sub_title("Public routes")
    bullets(
        [
            "/ - Landing page (product overview, screenshot).",
            "/login, /register - Auth forms; register supports user/analyst/admin.",
            "/forgot-password, /verify-otp, /reset-password - Password recovery flow.",
        ]
    )
    sub_title("Dashboard routes (protected)")
    bullets(
        [
            "/dashboard - Operations overview, KPI cards, charts, live feed.",
            "/dashboard/monitoring - Transaction table with filters (analyst/admin).",
            "/dashboard/capture - Manual ingest + 30s simulator (staff for stream).",
            "/dashboard/transactions - Flagged investigation queue.",
            "/dashboard/fraud - Fraud lab manual simulation.",
            "/dashboard/explain - Per-transaction explainability view.",
            "/dashboard/analytics, /alerts, /reports - Staff analytics and exports.",
            "/dashboard/admin - User/rule management (admin).",
            "/dashboard/profile - Account settings.",
        ]
    )
    sub_title("Important frontend modules")
    bullets(
        [
            "lib/api.ts - fetchWithAuth, 401 handling, redirect to login.",
            "lib/auth-session.ts - localStorage token + session cookie for middleware.",
            "lib/roles.ts - Navigation and RoleGuard permissions.",
            "middleware.ts - Blocks /dashboard without session cookie.",
            "app/dashboard/layout.tsx - Validates JWT via /auth/me before render.",
            "components/transaction-notification-provider.tsx - Polls feed, toasts, sounds.",
            "components/kpi-card.tsx, charts/*, app-shell.tsx, sidebar.tsx",
        ]
    )

    # --- 9. RBAC ---
    section_title("9. Authentication and RBAC")
    sub_title("JWT contents")
    body("identity = user id (string). additional_claims.role = user | analyst | admin.")
    sub_title("Role capabilities")
    bullets(
        [
            "Cardholder (user): Own transactions only; overview scoped; capture manual; explain own txs.",
            "Analyst: Global monitoring, flagged queue, fraud lab, reports, simulator, freeze account.",
            "Admin: All analyst features + /admin users, rules, retrain stub, dashboard/rules API.",
        ]
    )
    sub_title("Demo accounts (seed_data.py)")
    bullets(
        [
            "ops@fraudshield.demo / DemoPass123! - admin",
            "analyst@fraudshield.demo / DemoPass123! - analyst",
            "user@fraudshield.demo / DemoPass123! - cardholder",
        ]
    )

    # --- 10. Run ---
    section_title("10. How to run locally")
    sub_title("Backend")
    code_line("cd backend")
    code_line("pip install -r requirements.txt")
    code_line("python -m flask --app run db upgrade")
    code_line("python run.py")
    body("API: http://127.0.0.1:5000")
    sub_title("Frontend")
    code_line("cd frontend")
    code_line("npm install")
    code_line("echo NEXT_PUBLIC_API_BASE=http://127.0.0.1:5000 > .env.local")
    code_line("npm run dev")
    body("UI: http://localhost:3000")

    # --- 11. Defense Q&A ---
    pdf.add_page()
    section_title("11. Likely examination questions & answers")
    qa = [
        (
            "Why hybrid rules + ML instead of ML only?",
            "Rules give transparent, auditable triggers; ML catches non-linear patterns. "
            "Fusion improves recall while keeping explainability for analysts and regulators.",
        ),
        (
            "How is explainability implemented?",
            "Feature contributions are derived from rule text, behavior reasons, and ML inputs "
            "in explain.py and shown in the Explainability and Fraud lab pages.",
        ),
        (
            "How do you secure the API?",
            "JWT on protected routes, bcrypt passwords, role checks in routes and rbac.py, "
            "cardholder data scoped to own user_id, session validation on dashboard load.",
        ),
        (
            "What database and why SQLite?",
            "SQLite for development and demonstration portability; SQLAlchemy allows swapping "
            "to PostgreSQL in production via DATABASE_URL.",
        ),
        (
            "How would you deploy to production?",
            "Containerize backend + frontend, use PostgreSQL, set strong SECRET_KEY/JWT_SECRET_KEY, "
            "HTTPS, restrict CORS, connect real payment webhook to /transactions/ingest, "
            "retrain model on production data, integrate real email/SMS alerts.",
        ),
        (
            "Limitations of this prototype?",
            "Simulated email, stub 2FA, FraudRule DB not wired to engine, illustrative model metrics, "
            "no horizontal scaling or message queue yet.",
        ),
    ]
    for q, a in qa:
        sub_title(f"Q: {q}")
        body(f"A: {a}")

    section_title("12. File index (quick reference)")
    bullets(
        [
            "backend/run.py - Dev server entry.",
            "backend/app/__init__.py - App factory.",
            "backend/app/models.py - All ORM models.",
            "backend/app/fraud/engine.py - Scoring orchestration.",
            "backend/ml/train_model.py - Train fraud_model.joblib.",
            "frontend/app/dashboard/page.tsx - Main dashboard UI.",
            "frontend/lib/api.ts - API client.",
        ]
    )

    raw = pdf.output()
    if isinstance(raw, str):
        return raw.encode("latin-1", errors="replace")
    if isinstance(raw, bytearray):
        return bytes(raw)
    return raw


def main() -> None:
    data = build_pdf()
    OUTPUT.write_bytes(data)
    print(f"Wrote {OUTPUT} ({len(data):,} bytes)")


if __name__ == "__main__":
    main()
