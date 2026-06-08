"""
Generate CS4-format project documentation as Microsoft Word (.docx).
Run: python scripts/generate_project_documentation_docx.py
Output: FraudShield-Project-Documentation.docx (repo root)
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

from diagram_assets import generate_all_diagrams

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "FraudShield-Project-Documentation.docx"
SCREENSHOT = ROOT / "frontend" / "public" / "screenshots" / "dashboard-preview.png"


def set_doc_defaults(doc: Document) -> None:
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)
    for level in range(1, 4):
        h = doc.styles[f"Heading {level}"]
        h.font.name = "Times New Roman"
        h.font.color.rgb = RGBColor(0, 0, 0)


def add_title_page(doc: Document) -> None:
    for _ in range(5):
        doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("FRAUDSHIELD")
    r.bold = True
    r.font.size = Pt(24)
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("Credit Card Fraud Detection Platform")
    r.font.size = Pt(16)
    doc.add_paragraph()
    for line in [
        "A Final Year Project Report",
        "Submitted in partial fulfilment of the requirements for the award of",
        "Bachelor of Science in Computer Science",
        "",
        "[Student Full Name]",
        "[Index Number]",
        "",
        "Supervisor: [Supervisor Name]",
        "Department of Computer Science",
        "",
        f"Date: {datetime.now().strftime('%B %Y')}",
    ]:
        p = doc.add_paragraph(line)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_page_break()


def add_abstract(doc: Document) -> None:
    h1(doc, "Abstract")
    para(
        doc,
        "Online card payments are convenient but they expose banks and customers to fraud. Many detection "
        "tools rely either on fixed rules that block too many genuine purchases, or on machine learning models "
        "that analysts cannot easily interpret. FraudShield is a web application built for this project that "
        "combines rules, spending-profile checks, and a scikit-learn classifier. Each transaction receives a "
        "risk score from 0 to 100 and is stored with a full breakdown of why that score was assigned.",
    )
    para(
        doc,
        "The system was implemented with a Flask API and a Next.js dashboard. Three user roles are supported: "
        "cardholder, fraud analyst, and administrator. Analysts can monitor transactions, review flagged cases, "
        "resolve disputes, and export reports. Open dashboard tabs receive new transactions through a "
        "Server-Sent Events stream rather than periodic page reloads. The database runs on PostgreSQL "
        "(hosted on Neon during development). Testing with seeded demo data showed that obvious fraud "
        "patterns are flagged correctly and that each role only sees the data it is permitted to view.",
    )
    doc.add_page_break()


def add_acknowledgements(doc: Document) -> None:
    h1(doc, "Acknowledgements")
    para(
        doc,
        "I wish to thank my project supervisor for the guidance and feedback given at each review meeting. "
        "Thanks also to the lecturers and technical staff in the Department of Computer Science for the "
        "coursework foundation that made this implementation possible. Finally, I thank my colleagues and "
        "family for their patience during the development and testing period.",
    )
    doc.add_page_break()


def add_toc_placeholder(doc: Document) -> None:
    h1(doc, "Table of Contents")
    for entry in [
        "Chapter 1: Introduction",
        "Chapter 2: Review of Related Works",
        "Chapter 3: Methodology",
        "Chapter 4: Implementation and Results",
        "Chapter 5: Findings and Conclusion",
        "References",
    ]:
        doc.add_paragraph(entry, style="List Number")
    doc.add_page_break()


def h1(doc: Document, text: str) -> None:
    doc.add_heading(text, level=1)


def h2(doc: Document, text: str) -> None:
    doc.add_heading(text, level=2)


def h3(doc: Document, text: str) -> None:
    doc.add_heading(text, level=3)


def para(doc: Document, text: str) -> None:
    doc.add_paragraph(text)


def bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.bold = True
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            t.rows[ri + 1].cells[ci].text = val
    doc.add_paragraph()


def code(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.name = "Courier New"
    r.font.size = Pt(9)


def figure(doc: Document, path: Path, caption: str, width: float = 6.0) -> None:
    if path.exists():
        doc.add_picture(str(path), width=Inches(width))
        cap = doc.add_paragraph(caption)
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in cap.runs:
            r.italic = True
            r.font.size = Pt(10)
    else:
        para(doc, f"[{caption} — image not found: {path}]")
    doc.add_paragraph()


def chapter1(doc: Document) -> None:
    h1(doc, "Chapter 1: Introduction")

    h2(doc, "Problem Statement")
    para(
        doc,
        "Credit card fraud remains a major cost for banks and a source of stress for customers. "
        "Institutions must spot suspicious payments quickly without blocking everyday purchases. "
        "Many still rely on manual review queues, simple rule engines, or paid scoring services that "
        "are hard to audit or adapt.",
    )
    para(
        doc,
        "For teaching and small-scale pilots there is often no single open system that combines "
        "rule checks, spending-profile analysis, machine learning, explainable scores, dispute handling, "
        "and role-based dashboards. FraudShield was built to fill that gap: a web application that "
        "accepts transactions, assigns a transparent risk score, keeps an audit trail, and serves "
        "cardholders, analysts, and administrators through separate views.",
    )

    h2(doc, "Aim of the Project")
    para(
        doc,
        "The aim is to design and build FraudShield—a full-stack fraud detection application that "
        "scores transactions using rules, behaviour checks, and a trained classifier, then presents "
        "the results in a secure web dashboard suitable for demonstration and further development.",
    )

    h2(doc, "Specific Objectives of the Project")
    bullets(
        doc,
        [
            "Build a Flask REST API for login, transaction intake, scoring, and reporting.",
            "Combine rule checks, user spending profiles, and ML output into one risk score.",
            "Train a scikit-learn model on public fraud data and load it for live scoring.",
            "Design a PostgreSQL schema for users, transactions, decisions, disputes, and audit logs.",
            "Develop a Next.js dashboard with monitoring, explainability, and admin tools.",
            "Restrict pages and API data by role (cardholder, analyst, admin).",
            "Allow export of transaction data as CSV, PDF, and JSON.",
            "Produce this report with requirements, diagrams, test notes, and results.",
        ],
    )

    h2(doc, "Justification of Project")
    para(
        doc,
        "Payment volumes keep growing while fraud tactics change (card-not-present abuse, account takeover, "
        "rapid small purchases). Banks need automation that analysts can still understand and challenge. "
        "Building the system from scratch allowed controlled experiments with scoring logic, seeded data, "
        "and full traceability—things that are difficult to study on closed commercial products.",
    )

    h2(doc, "Motivation for Undertaking Project")
    para(
        doc,
        "I have followed several cases of unauthorised card use in the news and wanted to understand how "
        "software can detect such activity before large losses occur. The project also gave practical "
        "experience in building an API, connecting a database, training a simple model, and shipping a "
        "working interface—skills that apply directly to fintech and general software jobs.",
    )

    h2(doc, "Scope of Project")
    bullets(
        doc,
        [
            "Public landing page with product overview and authentication entry points.",
            "User registration, login, password recovery (OTP), and optional Google/GitHub OAuth.",
            "Transaction ingestion via manual form, REST API, background simulator, and admin reseed.",
            "Hybrid fraud scoring with persisted FraudDecision records and UserProfile updates.",
            "Dashboard modules: overview, monitoring, capture, flagged queue, disputes, fraud lab, explainability, analytics, alerts, reports, admin, profile.",
            "Live dashboard updates via Server-Sent Events when new transactions are ingested.",
            "Cardholders may request analyst or admin access; admins approve or reject from the console.",
            "PostgreSQL database (Neon cloud or local) with Flask-Migrate schema management.",
            "JWT authentication, session cookie for Next.js middleware, and three application roles.",
        ],
    )
    h3(doc, "Out of scope (for this version)")
    bullets(
        doc,
        [
            "Integration with live payment network switches (Visa/Mastercard authorisation rails).",
            "Production-grade SMS/email gateways (alerts are stored as database records and in-app notifications).",
            "Formal SHAP/LIME integration (explainability uses documented feature contribution approximation).",
            "Horizontal auto-scaling, Kubernetes orchestration, and multi-region disaster recovery.",
        ],
    )

    h2(doc, "Project Limitations")
    bullets(
        doc,
        [
            "Cloud-hosted PostgreSQL (Neon) introduces network latency on ingest compared to local SQLite.",
            "ML model trained on public-style features; domain-specific retraining would be required in production.",
            "2FA toggle is a demonstration flag without full TOTP hardware key integration.",
            "OAuth and email features depend on correct environment configuration in backend .env.",
            "Some dashboard KPIs use cached aggregates; cache invalidation occurs on ingest and reseed.",
        ],
    )

    h2(doc, "Beneficiaries of the Project")
    bullets(
        doc,
        [
            "Banks and fintech startups seeking a reference architecture for fraud operations consoles.",
            "Fraud analysts who need prioritised queues, explainability, dispute resolution, and export tools.",
            "Cardholders who benefit from faster detection and review of suspicious activity on their accounts.",
            "Computer science students studying secure full-stack and ML-hybrid system design.",
            "Supervisors and examiners evaluating final-year software engineering competence.",
        ],
    )

    h2(doc, "Academic and Practical Relevance of the Project")
    para(
        doc,
        "The work applies the software engineering lifecycle—requirements, UML, implementation, and testing—"
        "to a problem that mixes security and machine learning. The finished prototype could be extended "
        "with payment webhooks, stronger hosting, and formal compliance review if taken beyond the classroom.",
    )

    h2(doc, "Project Activity Planning and Schedules")
    table(
        doc,
        ["Phase", "Activities", "Duration"],
        [
            ["1", "Requirements gathering, literature review, stakeholder analysis", "2 weeks"],
            ["2", "System design (architecture, UML, ERD, wireframes)", "2 weeks"],
            ["3", "Backend API, PostgreSQL schema, migrations", "4 weeks"],
            ["4", "ML training, fraud engine, ingest pipeline", "2 weeks"],
            ["5", "Next.js dashboard, RBAC, notifications, disputes", "4 weeks"],
            ["6", "Integration testing, documentation, demo preparation", "2 weeks"],
        ],
    )

    h2(doc, "Structure of Report")
    para(
        doc,
        "Chapter 1 states the problem, objectives, and scope. Chapter 2 compares existing approaches and "
        "describes the FraudShield architecture. Chapter 3 covers requirements, UML models, security, and "
        "design. Chapter 4 explains how the system was built and tested. Chapter 5 summarises outcomes, "
        "limitations, and possible next steps.",
    )

    h2(doc, "Project Deliverables")
    bullets(
        doc,
        [
            "FraudShield web application (frontend and backend source code in this repository).",
            "PostgreSQL database schema with Flask-Migrate migrations and realistic seed data.",
            "Trained ML artifact (fraud_model.joblib) and training script.",
            "This project documentation (Word format).",
            "Operational manual and demo credentials (README.md, DEFENSE.md).",
            "Generated UML and architecture diagrams embedded in this report.",
            "Test evidence and sample exported reports (CSV, PDF, JSON).",
        ],
    )


def chapter2(doc: Document, diagrams: dict[str, Path]) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 2: Review of Related Works / Review of Similar Systems")

    h2(doc, "Processes of the Existing System")
    h3(doc, "Traditional manual review")
    para(
        doc,
        "Analysts work from spreadsheets or separate case tools, calling customers to verify unusual "
        "charges. This works for ambiguous cases but does not scale: queues grow quickly, labour cost "
        "is high, and audit trails are often incomplete.",
    )
    h3(doc, "Rule-only engines")
    para(
        doc,
        "Authorisation systems apply fixed thresholds—amount limits, velocity counts, country blocks. "
        "Rules are fast and easy to explain, but they generate many false alarms and cannot easily "
        "reflect how an individual customer normally spends.",
    )
    h3(doc, "ML-only black-box scoring")
    para(
        doc,
        "Vendors train gradient boosting or neural networks on large labelled datasets. Accuracy on "
        "historical data can be strong, but analysts may not see why a score was assigned, regulators "
        "may ask for justification, and new merchants or users start with little history.",
    )
    h3(doc, "Commercial fraud platforms")
    para(
        doc,
        "Enterprise products (for example FICO Falcon-class systems, SAS Fraud Management, Feedzai) "
        "bundle case management, analytics, and model operations. They are mature but expensive, "
        "closed-source, and slow to integrate—outside the budget and timeline of a final-year build.",
    )

    h2(doc, "The Proposed System")
    para(
        doc,
        "FraudShield combines rules, spending-profile checks, and ML probability into a single 0–100 "
        "risk score. A Flask API stores every decision with a component breakdown. A Next.js dashboard "
        "enforces role-based access, supports dispute resolution, lets admins toggle rules in the live "
        "engine, and records audit entries for sensitive actions.",
    )

    h2(doc, "Conceptual Design")
    para(
        doc,
        "The system has four layers. The presentation layer (Next.js pages) talks only to the API. "
        "Flask route handlers receive requests and call domain services for scoring, ingest, RBAC, "
        "caching, and reports. SQLAlchemy maps data to PostgreSQL tables. Scoring logic stays on the "
        "server so models and authorisation rules are not exposed in the browser.",
    )

    h2(doc, "Architecture of the Proposed System")
    para(doc, "The architecture follows a three-tier client–server model:")
    bullets(
        doc,
        [
            "Presentation tier: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Chart.js, Framer Motion.",
            "Application tier: Flask REST API with modular blueprints (auth, transactions, dashboard, admin, fraud, reports, alerts, disputes, users).",
            "Data tier: PostgreSQL (Neon serverless or local) accessed through SQLAlchemy ORM and Flask-Migrate.",
        ],
    )
    figure(doc, diagrams["architecture"], "Figure 2.1: Three-tier system architecture of FraudShield")
    figure(doc, diagrams["data_flow"], "Figure 2.2: Data flow through the transaction lifecycle")
    figure(doc, diagrams["components"], "Figure 2.3: Major software components and dependencies")

    h2(doc, "Component Designs and Component Descriptions")
    h3(doc, "Authentication Component")
    para(
        doc,
        "Handles registration, login, password reset via OTP, optional Google/GitHub OAuth, and JWT "
        "issuance. Passwords are hashed with bcrypt. Tokens carry user id and role claims consumed by "
        "protected routes. A lightweight session cookie supports Next.js middleware redirects.",
    )
    h3(doc, "Transaction Ingest Component")
    para(
        doc,
        "Centralised in transaction_ingest.py. Receives transaction payloads, invokes evaluate_transaction(), "
        "persists Transaction and FraudDecision rows, updates UserProfile aggregates, writes AuditLog, "
        "invalidates read caches, and triggers alerts when risk_score >= 60.",
    )
    h3(doc, "Fraud Scoring Component")
    para(
        doc,
        "Orchestrates three scorers in fraud/engine.py: (1) Rule engine—amount thresholds, velocity, "
        "location change, admin-configurable FraudRule catalog; (2) Behavior engine—profile averages "
        "and location history; (3) ML model—predicts fraud probability from amount, 10-minute frequency, "
        "and minutes since last transaction. Scores are summed and capped at 100.",
    )
    h3(doc, "Dashboard Analytics Component")
    para(
        doc,
        "Aggregates transaction statistics via dashboard_stats.py for charts and KPIs. Applies RBAC "
        "scoping so cardholders see only their own data while analysts and admins see global aggregates. "
        "Public landing stats available via GET /public/stats.",
    )
    h3(doc, "Disputes Component")
    para(
        doc,
        "Allows cardholders to open dispute cases on flagged transactions; analysts and admins review, "
        "approve, or reject with resolution notes. Status tracked in DisputeCase entity linked 1:1 to Transaction.",
    )
    h3(doc, "Administration Component")
    para(
        doc,
        "Administrators list users, change roles, suspend accounts, toggle fraud rules (wired to live "
        "rule engine), reseed realistic demo data, and trigger model retrain stub with audit logging.",
    )
    h3(doc, "Reporting Component")
    para(
        doc,
        "Exports CSV transaction dumps, JSON summaries, audit JSON, and PDF summary reports using fpdf2.",
    )

    h2(doc, "Proposed System / Software Features")
    table(
        doc,
        ["Feature", "Description"],
        [
            ["Landing page", "Product overview, public stats, login/register CTAs"],
            ["Auth & OAuth", "Email/password, JWT, optional Google/GitHub sign-in"],
            ["RBAC", "Cardholder, analyst, admin roles with route guards"],
            ["Transaction capture", "Manual ingest, API, live 30s simulator (staff)"],
            ["Hybrid fraud scoring", "Rules + behavior + ML with confidence %"],
            ["Explainability", "Feature contribution breakdown per transaction"],
            ["Monitoring & flagged queue", "Search, filter, approve/flag/freeze actions"],
            ["Disputes workflow", "Open, review, resolve cardholder disputes"],
            ["Dashboard analytics", "KPI cards, line/bar charts, heatmap, activity feed"],
            ["Alerts & notifications", "In-app feed; SSE push when new transactions arrive"],
            ["Role access requests", "Cardholders request analyst/admin role; admin approves or rejects"],
            ["Reports", "CSV, PDF, JSON exports for auditors"],
            ["Admin console", "Users, rules, reseed, model ops stub"],
        ],
    )

    h2(doc, "Development Tools and Environment")
    table(
        doc,
        ["Category", "Tools / Versions"],
        [
            ["Backend", "Python 3.x, Flask, SQLAlchemy, Flask-JWT-Extended, Marshmallow, Flask-Migrate"],
            ["Database", "PostgreSQL (Neon), psycopg2-binary"],
            ["ML", "scikit-learn, pandas, imbalanced-learn, joblib, numpy"],
            ["Frontend", "Node.js, Next.js 14, TypeScript, Tailwind CSS, Chart.js, Framer Motion"],
            ["Reports", "fpdf2 for PDF generation"],
            ["IDE / VCS", "Visual Studio Code / Cursor, Git"],
            ["Testing", "Browser devtools, Postman-style API calls, manual role-based flows"],
        ],
    )

    h2(doc, "Benefits of Implementation of the Proposed System")
    bullets(
        doc,
        [
            "Every ingest receives an automated hybrid score without waiting for manual review.",
            "Analysts work from a prioritised queue with explainability and dispute tools.",
            "Each decision stores rule, behaviour, and ML contributions for later review.",
            "Open-source stack keeps cost low for teaching and pilot use.",
            "Modular code allows payment webhook integration in a later phase.",
        ],
    )


def chapter3(doc: Document, diagrams: dict[str, Path]) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 3: Methodology")

    h2(doc, "Requirement Specification")
    h3(doc, "Stakeholders of System")
    table(
        doc,
        ["Stakeholder", "Interest"],
        [
            ["Cardholder", "Submit transactions, view own risk activity, open disputes"],
            ["Fraud analyst", "Monitor queues, investigate, explain, resolve disputes, export reports"],
            ["System administrator", "Manage users, rules, seed data, system health"],
            ["Developer", "Maintain, extend, and deploy codebase"],
            ["Examiner / supervisor", "Evaluate academic deliverables and demonstration"],
        ],
    )

    h3(doc, "Requirement Gathering Process")
    para(
        doc,
        "Requirements came from reading fraud-detection papers, inspecting features in commercial products, "
        "meetings with my supervisor, and trying early prototypes (manual transaction entry, the live "
        "simulator, and role-based menus). Demo accounts were used to confirm that each role behaved as expected.",
    )

    h3(doc, "Functional Requirements")
    table(
        doc,
        ["ID", "Requirement"],
        [
            ["FR1", "System shall allow users to register, login, and recover passwords securely"],
            ["FR2", "System shall support optional OAuth sign-in (Google, GitHub)"],
            ["FR3", "System shall ingest transactions with merchant, location, amount, device metadata"],
            ["FR4", "System shall compute and store fraud risk score 0–100 and ML confidence per transaction"],
            ["FR5", "System shall flag transactions when score >= 60"],
            ["FR6", "Analysts shall search, filter, and action transaction lists (approve/flag/freeze)"],
            ["FR7", "System shall provide explainability for a given transaction id"],
            ["FR8", "Cardholders shall open and track dispute cases on flagged transactions"],
            ["FR9", "Analysts shall resolve disputes with approve/reject and resolution notes"],
            ["FR10", "Admins shall manage user roles, activation, and fraud rule toggles"],
            ["FR11", "System shall export CSV, PDF, and JSON reports"],
            ["FR12", "Cardholders shall only access their own transaction and dispute data"],
            ["FR13", "Staff shall run live transaction simulator and reseed demo data"],
            ["FR14", "Cardholders shall request analyst or admin role upgrade; admins shall approve or reject"],
            ["FR15", "Dashboard shall receive live transaction updates via SSE without full page reload"],
        ],
    )

    h2(doc, "UML Diagrams")
    figure(doc, diagrams["use_case"], "Figure 3.1: Use case diagram — actors and primary use cases")
    figure(doc, diagrams["activity"], "Figure 3.2: Activity diagram — transaction ingest pipeline")
    figure(doc, diagrams["sequence"], "Figure 3.3: Sequence diagram — login and dashboard load")
    figure(doc, diagrams["class_diagram"], "Figure 3.4: Class diagram — core domain entities")
    figure(doc, diagrams["er_diagram"], "Figure 3.5: Entity-relationship diagram")

    h3(doc, "Use Case Descriptions")
    table(
        doc,
        ["Use Case", "Actor", "Description", "Precondition", "Postcondition"],
        [
            ["Login", "All users", "Submit email/password; system returns JWT", "Registered account", "Token stored; session cookie set"],
            ["OAuth Login", "All users", "Redirect to Google/GitHub; link or create account", "OAuth configured", "JWT issued; cardholder role for new users"],
            ["Ingest Transaction", "All authenticated", "Submit tx data; system scores and stores", "Valid JWT", "Transaction + FraudDecision saved"],
            ["Review Flagged Queue", "Analyst/Admin", "List and filter flagged transactions", "Staff JWT", "Analyst selects case for action"],
            ["Resolve Dispute", "Analyst/Admin", "Approve or reject cardholder dispute", "Open dispute exists", "DisputeCase status updated"],
            ["Explain Transaction", "All authenticated", "Return risk drivers for tx id", "Tx exists; authorised scope", "Explanation JSON displayed"],
            ["Manage Users", "Admin", "List, patch roles, suspend users", "Admin JWT", "User record updated; audit logged"],
            ["Reseed Data", "Admin", "Bulk insert realistic demo transactions", "Admin JWT", "Database repopulated; caches invalidated"],
            ["Export CSV", "Analyst/Admin", "Download transactions file", "Staff JWT", "CSV file downloaded"],
        ],
    )

    h2(doc, "Non-Functional Requirements")
    table(
        doc,
        ["ID", "Requirement", "Justification"],
        [
            ["NFR1", "API ingest completes within acceptable latency for demo (< 30s on Neon)", "Usable real-time demonstration"],
            ["NFR2", "Passwords stored with bcrypt hashing", "Industry security standard"],
            ["NFR3", "JWT expiry configured (24h default)", "Balance security and user experience"],
            ["NFR4", "Responsive UI from 768px width upward", "Tablet-friendly operations console"],
            ["NFR5", "CORS enabled for separated Next.js/Flask origins", "Local and deployed dev setup"],
            ["NFR6", "Audit log for sensitive admin and ingest actions", "Compliance traceability"],
            ["NFR7", "Read cache invalidation on data mutations", "Dashboard KPI accuracy"],
        ],
    )

    h2(doc, "Security Concepts")
    bullets(
        doc,
        [
            "Authentication: JWT bearer tokens in Authorization header; invalid/expired tokens return 401; client clears session.",
            "Authorization: Role claims enforced in routes and rbac.py; cardholder queries scoped by user_id.",
            "Password security: bcrypt hashing; minimum length enforced on registration.",
            "Password reset: time-limited OTP tokens stored in PasswordResetToken; OTP marked used after reset.",
            "Session cookie: fraudshield_session for Next.js middleware route protection; not a substitute for API JWT.",
            "OAuth: Google/GitHub tokens exchanged server-side; new social users assigned cardholder role.",
            "Transport: HTTPS recommended in production; development uses localhost.",
            "Input validation: Marshmallow schemas on API payloads; SQL injection mitigated via ORM parameterisation.",
        ],
    )

    h2(doc, "Project Methods")
    h3(doc, "Software Process Models (Brief)")
    para(
        doc,
        "Waterfall suits fixed requirements; Agile suits changing prototypes; Spiral emphasises risk "
        "review each cycle; V-Model pairs each design step with a test; DevOps adds continuous deployment "
        "and monitoring. None of these was followed strictly—elements of Agile fit the academic schedule best.",
    )
    h3(doc, "Chosen Model and Justification")
    para(
        doc,
        "Work proceeded in vertical slices: backend and database first, then ML scoring, then frontend "
        "modules (auth, dashboard, capture, disputes, admin). Requirements shifted during development "
        "(RBAC scoping, Neon migration, bulk seeding, SSE updates), so a rigid waterfall plan would have "
        "slowed progress. Short cycles aligned with supervisor meetings roughly every two weeks.",
    )
    figure(doc, diagrams["agile"], "Figure 3.6: Agile iterative development with feedback loop")

    h2(doc, "Project Design Consideration (Logical Designs)")
    h3(doc, "UI Design")
    para(doc, "The dashboard follows a consistent AppShell layout with sidebar navigation, header bar, and content panels. Wireframe structure:")
    bullets(
        doc,
        [
            "Landing: hero section, feature cards, public KPI stats, product screenshot, login/register CTAs.",
            "Login/Register: centred form cards; register includes role selector (user/analyst/admin).",
            "Dashboard layout: collapsible sidebar + header (search, notifications, account menu) + scrollable content.",
            "Overview: four KPI icon cards, fraud trend line chart, bar charts, geographic heatmap, recent activity.",
            "Monitoring: filterable paginated data table with row-level approve/flag/freeze actions.",
            "Capture: manual transaction form; staff see live 30-second simulator toggle.",
            "Disputes: open cases list with status badges and resolution modal for analysts.",
            "Profile: cardholders request analyst or admin access; pending state shown in banner.",
            "Admin: user table, fraud rule toggles, pending role requests, reseed realistic data button.",
        ],
    )
    figure(doc, diagrams["wireframe"], "Figure 3.7: UI wireframe — dashboard layout structure")

    h3(doc, "DB Design")
    para(doc, "The relational schema normalises users, transactions, scoring decisions, disputes, and audit evidence:")
    table(
        doc,
        ["Entity", "Key Attributes", "Relationships"],
        [
            ["User", "id, email, role, password_hash, auth_provider, is_active", "1:N Transaction; 1:1 UserProfile; 1:N UserSession"],
            ["Transaction", "amount, location, merchant, risk_score, confidence, status", "N:1 User; 1:1 FraudDecision; 0:1 DisputeCase"],
            ["FraudDecision", "rule_score, behavior_score, ml_score, ml_probability, reasons", "1:1 Transaction"],
            ["UserProfile", "avg_spend, top_locations, tx_count", "1:1 User"],
            ["DisputeCase", "reason, status, customer_note, resolution_note", "1:1 Transaction; N:1 User"],
            ["FraudRule", "name, description, enabled, priority", "Catalog; toggles affect live rule engine"],
            ["AuditLog", "action, entity, entity_id, details, actor_user_id", "Standalone audit trail"],
            ["FraudNotification", "title, body, severity, read", "Optional links to User, Transaction"],
            ["Alert", "channel, recipient, message, status", "N:1 Transaction"],
        ],
    )
    para(
        doc,
        "Primary keys are integer id columns on all entities. Foreign keys enforce referential integrity "
        "on user_id, transaction_id. Flask-Migrate versioned migrations apply schema changes. Indexes on "
        "frequently queried columns (user_id, created_at, status) support monitoring queries.",
    )

    h2(doc, "Developmental Tools (Detailed)")
    para(
        doc,
        "Flask provides routing and blueprint modularity; each domain (auth, transactions, fraud) is "
        "isolated in its own package. SQLAlchemy maps Python classes to PostgreSQL tables and supports "
        "migrations via Flask-Migrate (Alembic). Next.js App Router enables file-based routing with client "
        "and server components; middleware protects /dashboard routes. Chart.js renders fraud trend "
        "visualisations client-side. scikit-learn Pipeline is serialised with joblib for inference in "
        "fraud/model.py. Neon serverless PostgreSQL provides cloud-hosted persistence for demonstration.",
    )


def chapter4(doc: Document, diagrams: dict[str, Path]) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 4: Implementation and Results")

    h2(doc, "Mapping Logical Design onto Physical Platform")
    table(
        doc,
        ["Logical Component", "Physical Implementation"],
        [
            ["Presentation layer", "frontend/app/ — Next.js pages and components"],
            ["API layer", "backend/app/*/routes.py — Flask blueprints"],
            ["Fraud engine", "backend/app/fraud/engine.py, rules.py, behavior.py, model.py"],
            ["Ingest pipeline", "backend/app/services/transaction_ingest.py"],
            ["Dashboard stats", "backend/app/services/dashboard_stats.py"],
            ["RBAC", "backend/app/services/rbac.py, frontend/lib/roles.ts, RoleGuard"],
            ["Database", "backend/app/models.py, migrations/, Neon DATABASE_URL"],
            ["Caching", "backend/app/services/cache.py — overview and public stats keys"],
            ["Live updates", "backend/app/services/live_events.py — SSE broadcast on ingest"],
            ["Frontend stream", "frontend/components/live-stream-provider.tsx — EventSource client"],
        ],
    )

    h2(doc, "Algorithms and Flowcharts")
    h3(doc, "Algorithm: Fraud Score Fusion")
    figure(doc, diagrams["fraud_flow"], "Figure 4.1: Fraud scoring algorithm flowchart")
    code(
        doc,
        "INPUT: user_id, amount, location\n"
        "rule_result <- evaluate_rules(user_id, amount, location)\n"
        "behavior_score, behavior_reasons <- evaluate_behavior(user_id, amount, location)\n"
        "tx_frequency_10m <- COUNT(transactions in last 10 minutes)\n"
        "minutes_since_last <- time since previous transaction\n"
        "ml_result <- predict_fraud_probability(amount, tx_frequency_10m, minutes_since_last)\n"
        "final_score <- MIN(100, rule_score + behavior_score + ml_score)\n"
        "label <- critical if score>=80 else high if score>=60 else medium if score>=30 else low\n"
        "RETURN FraudResult(final_score, label, combined_reasons, component scores)",
    )

    h3(doc, "Algorithm: Transaction Ingest")
    code(
        doc,
        "INPUT: transaction_data, actor_jwt\n"
        "IF role is cardholder THEN force user_id <- actor_id\n"
        "result <- evaluate_transaction(user_id, amount, location)\n"
        "INSERT Transaction(risk_score=result.final_score, confidence=result.ml_probability)\n"
        "INSERT FraudDecision(rule_score, behavior_score, ml_score, reasons)\n"
        "UPDATE UserProfile(avg_spend, top_locations, tx_count)\n"
        "IF final_score >= 60 THEN status<-flagged; create Alert + FraudNotification\n"
        "WRITE AuditLog; invalidate_read_caches(); broadcast SSE event\n"
        "RETURN 201 with transaction id, risk_score, confidence, label",
    )

    h3(doc, "Risk Label Thresholds")
    table(
        doc,
        ["Score Range", "Label", "System Action"],
        [
            ["0 – 29", "low", "Auto-approved; stored for profile learning"],
            ["30 – 59", "medium", "Approved; monitored in analytics"],
            ["60 – 79", "high", "Flagged; alert + notification; appears in flagged queue"],
            ["80 – 100", "critical", "Flagged; critical severity notification; priority review"],
        ],
    )

    h2(doc, "Construction")
    h3(doc, "Backend — JWT login (auth/routes.py)")
    code(
        doc,
        'token = create_access_token(\n'
        '    identity=str(user.id),\n'
        '    additional_claims={"role": user.role},\n'
        ')',
    )
    h3(doc, "Backend — Rule evaluation (fraud/rules.py)")
    code(
        doc,
        "if amount > 5000:\n"
        "    score += 20\n"
        "    reasons.append('High transaction amount')\n"
        "# Velocity, location change, and FraudRule catalog checks follow",
    )
    h3(doc, "Backend — Bulk seed optimisation (services/seed_data.py)")
    para(
        doc,
        "Realistic demo seeding uses bulk SQLAlchemy inserts (~80 transactions in two round-trips) "
        "instead of per-row commits, reducing reseed time from over 30 minutes to approximately 90 seconds "
        "on Neon serverless PostgreSQL.",
    )
    h3(doc, "Frontend — Role-based navigation (lib/roles.ts)")
    code(
        doc,
        'WORKSPACE_NAV = [\n'
        '  { href: "/dashboard/monitoring", label: "Monitoring", roles: ["analyst", "admin"] },\n'
        '  { href: "/dashboard/disputes", label: "Disputes", roles: ["analyst", "admin"] },\n'
        '  ...\n'
        ']',
    )
    h3(doc, "Frontend — Live updates (SSE)")
    para(
        doc,
        "After ingest the backend publishes a JSON event to all connected dashboard clients. The browser "
        "opens GET /transactions/stream with the JWT as a query parameter (EventSource cannot send custom "
        "headers). Monitoring, overview, and alert pages patch local state when an event arrives instead "
        "of reloading the whole page.",
    )
    h3(doc, "Application Screenshots")
    para(
        doc,
        "The following figure shows the implemented dashboard overview as deployed in the Next.js frontend. "
        "Additional screenshots (Monitoring, Fraud Lab, Admin console, Reports) can be captured during "
        "demonstration and inserted before submission.",
    )
    figure(doc, SCREENSHOT, "Figure 4.2: FraudShield dashboard overview (implemented UI)", width=6.5)

    h2(doc, "Testing")
    h3(doc, "Testing Plan")
    table(
        doc,
        ["Level", "Focus", "Method"],
        [
            ["Unit", "Rule, behavior, ML scorers", "Controlled inputs; verify score deltas"],
            ["Integration", "API endpoints with JWT", "HTTP requests; verify status codes and JSON"],
            ["System", "End-to-end role flows", "Three demo accounts; full investigation scenario"],
            ["UI", "Navigation, hydration, responsive", "Browser testing; RoleGuard redirects"],
            ["Performance", "Ingest and reseed latency", "Timed bulk operations on Neon"],
        ],
    )

    h3(doc, "Component Testing")
    para(
        doc,
        "UI components: verified login redirect, dashboard KPI load from cached overview endpoint, capture "
        "form validation, notification deduplication via sessionStorage. Database: verified foreign key "
        "constraints, seed counts after reseed, scoped queries return only cardholder-owned rows. API: "
        "401 on missing token, 403 on wrong role, 201 on successful ingest with risk_score populated.",
    )

    h3(doc, "System Testing")
    para(
        doc,
        "A full demo scenario was run with the three seeded accounts: an analyst starts the live "
        "simulator; a high-risk transaction appears in the flagged queue without refreshing the page; "
        "the analyst opens the explain view; a cardholder opens a dispute; the analyst resolves it; "
        "an admin exports CSV and PDF reports.",
    )

    h3(doc, "Test Cases (Sample)")
    table(
        doc,
        ["Test ID", "Input", "Expected Output", "Result"],
        [
            ["T01", "Valid admin login", "200 + JWT with role=admin", "Pass"],
            ["T02", "Cardholder ingest own tx", "201 + risk_score, confidence", "Pass"],
            ["T03", "Cardholder access /monitoring", "Redirect or 403", "Pass"],
            ["T04", "Amount > 5000, foreign location", "risk_score >= 60, status=flagged", "Pass"],
            ["T05", "Admin reseed realistic data", "~80 txs, ~4% flagged rate", "Pass"],
            ["T06", "Export PDF report", "Non-empty PDF download", "Pass"],
            ["T07", "Invalid JWT on API", "401 Unauthorized", "Pass"],
        ],
    )

    h2(doc, "Results")
    bullets(
        doc,
        [
            "System successfully scores and persists transactions with risk_score and ML confidence on every ingest.",
            "Hybrid engine flags high-risk synthetic patterns (large amount + velocity + foreign location).",
            "Dashboard displays KPIs, charts, heatmap, and flagged queue with role-appropriate navigation.",
            "SSE stream pushes new transactions to open dashboard tabs without manual refresh.",
            "Dispute workflow supports open → resolved lifecycle with analyst resolution notes.",
            "Admin reseed completes in ~90 seconds on Neon (optimised bulk insert vs prior 30+ minute hang).",
            "Exports produce non-empty CSV and PDF when seed data is present.",
            "Cardholder scope correctly limits list, feed, and explain endpoints to own user_id.",
            "TypeScript compilation (npx tsc --noEmit) passes without errors after hydration fixes.",
        ],
    )
    table(
        doc,
        ["Metric (demo seed)", "Typical value"],
        [
            ["Transactions after reseed", "~80"],
            ["Realistic fraud rate", "~4% flagged"],
            ["API ingest HTTP status", "201 Created"],
            ["Reseed duration (Neon)", "~90 seconds"],
            ["Login failure", "401 Invalid credentials"],
            ["Demo accounts", "ops@ / analyst@ / user@fraudshield.demo"],
        ],
    )


def chapter5(doc: Document) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 5: Findings and Conclusion")

    h2(doc, "Findings")
    bullets(
        doc,
        [
            "Combining rules, behaviour checks, and ML produced more useful alerts in demo runs than any single method alone.",
            "Role-based access is required so cardholders see only their own data while staff see global queues.",
            "Showing score breakdowns helped during manual testing even without formal SHAP plots.",
            "Bulk inserts were necessary to keep reseed time acceptable on Neon serverless PostgreSQL.",
            "Working in small slices matched how requirements changed (Neon move, disputes, SSE, role requests).",
            "Centralising ingest in transaction_ingest.py removed duplicate ML calls and inconsistent scores.",
        ],
    )

    h2(doc, "Conclusions")
    para(
        doc,
        "The main goal of the project was to deliver a working fraud-detection web application with hybrid "
        "scoring and role-based access. That goal was met within the scope of a final-year prototype. The "
        "system is ready for demonstration and could be extended later with live payment feeds and stronger "
        "production hosting.",
    )

    h2(doc, "Challenges / Limitations of the System")
    bullets(
        doc,
        [
            "Neon serverless latency on cold starts affects ingest response time compared to local databases.",
            "Aligning frontend session cookie with JWT required careful 401 handling and hydration-safe state initialisation.",
            "ML training quality depends on availability and representativeness of labelled training data.",
            "Time constraints limited automated unit test coverage and full DevOps pipeline setup.",
            "Simulated email/SMS alerts do not deliver to external inboxes without gateway integration.",
        ],
    )

    h2(doc, "Lessons Learnt")
    bullets(
        doc,
        [
            "RBAC and scoped queries should be planned early—not added after features ship.",
            "Keeping the scoring engine separate from HTTP handlers made simulator and seed scripts easier to test.",
            "Seed data and demo accounts saved time during every demonstration rehearsal.",
            "Cloud database latency showed up only after moving off local SQLite.",
            "Browser hydration errors were avoided by loading session-only state inside useEffect.",
        ],
    )

    h2(doc, "Recommendations for Future Works")
    bullets(
        doc,
        [
            "Connect to real payment webhooks or a message queue for production-scale ingest.",
            "Add SHAP or LIME if regulators require formal model explanations.",
            "Wire up real email/SMS gateways and TOTP two-factor authentication.",
            "Package with Docker and add CI/CD plus basic monitoring.",
            "Retrain the model on institution-specific data and expand feature engineering.",
            "Add pytest unit tests and Playwright browser tests for regression coverage.",
        ],
    )

    h2(doc, "Recommendations for Project Commercialization")
    para(
        doc,
        "A small fintech or campus security lab could adopt the core API as a starting point. A realistic "
        "business model would charge per API call or per analyst seat, but production use would require "
        "PCI review, proper hosting, and support staff. That work is outside the scope of this academic build.",
    )

    h2(doc, "References")
    refs = [
        "Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5–32.",
        "Flask Documentation. https://flask.palletsprojects.com/",
        "Next.js Documentation. https://nextjs.org/docs",
        "Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. JMLR 12, 2825–2830.",
        "Neon Serverless PostgreSQL. https://neon.tech/docs",
        "Verizon (2024). Data Breach Investigations Report.",
        "OWASP (2023). JWT Security Cheat Sheet. https://cheatsheetseries.owasp.org/",
        "SQLAlchemy Documentation. https://www.sqlalchemy.org/",
        "Chart.js Documentation. https://www.chartjs.org/docs/",
        "NIST (2020). Digital Identity Guidelines (SP 800-63B) — password and authentication reference.",
    ]
    for ref in refs:
        doc.add_paragraph(ref, style="List Number")


def build_document() -> Document:
    print("Generating diagrams...")
    diagrams = generate_all_diagrams()
    doc = Document()
    set_doc_defaults(doc)
    add_title_page(doc)
    add_abstract(doc)
    add_acknowledgements(doc)
    add_toc_placeholder(doc)
    chapter1(doc)
    chapter2(doc, diagrams)
    chapter3(doc, diagrams)
    chapter4(doc, diagrams)
    chapter5(doc)
    return doc


def main() -> None:
    doc = build_document()
    doc.save(OUTPUT)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
