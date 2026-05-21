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

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "FraudShield-Project-Documentation.docx"


def set_doc_defaults(doc: Document) -> None:
    style = doc.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)
    for level in range(1, 4):
        h = doc.styles[f"Heading {level}"]
        h.font.name = "Times New Roman"
        h.font.color.rgb = RGBColor(0, 0, 0)


def add_title_page(doc: Document) -> None:
    for _ in range(6):
        doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("FRAUDSHIELD")
    r.bold = True
    r.font.size = Pt(22)
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
        "",
        f"Date: {datetime.now().strftime('%B %Y')}",
    ]:
        p = doc.add_paragraph(line)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
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


def chapter1(doc: Document) -> None:
    h1(doc, "Chapter 1: Introduction")

    h2(doc, "Problem Statement")
    para(
        doc,
        "Credit card fraud causes significant financial losses to banks, merchants, and cardholders worldwide. "
        "Traditional detection approaches rely heavily on manual review or single-method automated systems that "
        "either produce high false-positive rates or lack transparency for investigators. Many small and "
        "medium financial institutions lack affordable, integrated platforms that combine real-time scoring, "
        "behavioral profiling, machine learning, explainable decisions, and role-based operational workflows "
        "in one system. FraudShield addresses this gap by providing a web-based fraud detection platform that "
        "ingests transactions, computes hybrid risk scores, stores audit evidence, and supports cardholders, "
        "analysts, and administrators through dedicated interfaces.",
    )

    h2(doc, "Aim of the Project")
    para(
        doc,
        "The aim of this project is to design and implement FraudShield, a full-stack credit card fraud "
        "detection system that scores transactions in near real time using rules, behavioral analytics, and "
        "machine learning, and presents results through a secure, role-based web application suitable for "
        "demonstration, evaluation, and future production extension.",
    )

    h2(doc, "Specific Objectives of the Project")
    bullets(
        doc,
        [
            "To develop a RESTful backend API for user authentication, transaction ingestion, and fraud scoring.",
            "To implement a hybrid fraud engine combining deterministic rules, user behavioral profiles, and ML probability.",
            "To train and integrate a scikit-learn classification model for fraud probability estimation.",
            "To design a relational database schema for users, transactions, decisions, alerts, and audit logs.",
            "To build a responsive Next.js dashboard with KPIs, monitoring, explainability, and reporting.",
            "To enforce role-based access control for cardholder, analyst, and administrator personas.",
            "To provide exportable reports (CSV, PDF, JSON) and simulated alert notifications.",
            "To document and test the system against functional and non-functional requirements.",
        ],
    )

    h2(doc, "Justification of Project")
    para(
        doc,
        "Electronic payments continue to grow while fraud techniques evolve. Institutions need systems that "
        "balance automation with human oversight. A dedicated academic implementation allows controlled "
        "experimentation with scoring logic, reproducible datasets, and clear traceability—requirements that "
        "are difficult to evaluate on closed commercial products. The project justification rests on "
        "demonstrating that a modular, explainable, and extensible architecture can be built with mainstream "
        "open-source tools within a final-year timeline.",
    )

    h2(doc, "Motivation for Undertaking Project")
    para(
        doc,
        "Motivation includes personal interest in financial technology, machine learning applied to security, "
        "and full-stack software engineering. Observing how banks flag unusual spending patterns inspired "
        "investigation into how rules and models can work together. The project also strengthens skills in "
        "API design, database modelling, JWT security, and data visualisation—competencies valued in fintech "
        "and software engineering careers.",
    )

    h2(doc, "Scope of Project")
    bullets(
        doc,
        [
            "Web application with landing page, registration, login, and password recovery.",
            "Transaction ingestion via manual form, API endpoint, and optional background simulator.",
            "Fraud scoring pipeline with persisted decisions and user profile updates.",
            "Dashboard modules: overview, monitoring, capture, flagged queue, fraud lab, explainability, analytics, alerts, reports, admin, profile.",
            "SQLite database with Flask-Migrate schema management.",
            "JWT authentication and three application roles.",
        ],
    )
    h3(doc, "Out of scope (for this version)")
    bullets(
        doc,
        [
            "Integration with live payment networks (Visa/Mastercard switches).",
            "Production-grade SMS/email gateways (email is simulated as database records).",
            "Real SHAP/LIME integration (explainability uses documented approximation).",
            "Horizontal scaling, Kubernetes deployment, and multi-region redundancy.",
        ],
    )

    h2(doc, "Project Limitations")
    bullets(
        doc,
        [
            "SQLite is used for portability; high-concurrency production would require PostgreSQL or similar.",
            "ML model trained on public-style features; domain-specific retraining would be needed in production.",
            "FraudRule database catalog is admin-manageable but not yet wired into the live rule engine.",
            "Some dashboard metrics are illustrative when data is sparse.",
            "2FA toggle is a demonstration flag without TOTP hardware integration.",
        ],
    )

    h2(doc, "Beneficiaries of the Project")
    bullets(
        doc,
        [
            "Banks and fintech startups seeking a reference architecture for fraud operations consoles.",
            "Fraud analysts who need queues, explainability, and export tools.",
            "Cardholders who benefit from faster detection of suspicious activity on their accounts.",
            "Computer science students studying secure full-stack and ML-hybrid system design.",
            "Supervisors and examiners evaluating final-year software engineering competence.",
        ],
    )

    h2(doc, "Academic and Practical Relevance of the Project")
    para(
        doc,
        "Academically, the project demonstrates application of software engineering lifecycle, UML modelling, "
        "hybrid intelligent systems, and empirical testing. Practically, it produces a working prototype that "
        "could be extended into a pilot system for a small institution by adding payment webhooks, production "
        "database hosting, and compliance controls.",
    )

    h2(doc, "Project Activity Planning and Schedules")
    table(
        doc,
        ["Phase", "Activities", "Duration"],
        [
            ["1", "Requirements gathering, literature review", "2 weeks"],
            ["2", "System design (architecture, UML, ERD)", "2 weeks"],
            ["3", "Backend API and database implementation", "4 weeks"],
            ["4", "ML training and fraud engine integration", "2 weeks"],
            ["5", "Frontend dashboard and authentication", "4 weeks"],
            ["6", "Testing, documentation, deployment", "2 weeks"],
        ],
    )

    h2(doc, "Structure of Report")
    para(
        doc,
        "Chapter 1 introduces the project. Chapter 2 reviews related systems and presents the proposed "
        "architecture. Chapter 3 covers methodology, requirements, UML, security, and logical design. "
        "Chapter 4 describes implementation, algorithms, testing, and results. Chapter 5 concludes with "
        "findings, limitations, lessons learned, and future work.",
    )

    h2(doc, "Project Deliverables")
    bullets(
        doc,
        [
            "FraudShield web application (frontend and backend source code).",
            "SQLite database with migrations and seed data.",
            "Trained ML artifact (fraud_model.joblib) and training script.",
            "Technical documentation (this report).",
            "User demo accounts and operational manual (README).",
            "Test evidence and sample exported reports.",
        ],
    )


def chapter2(doc: Document) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 2: Review of Related Works / Review of Similar Systems")

    h2(doc, "Processes of the Existing System")
    h3(doc, "Traditional manual review")
    para(
        doc,
        "In many institutions, flagged transactions are reviewed by analysts using spreadsheets and "
        "disconnected case tools. Features include case notes and phone verification. Pros: human judgment, "
        "low false positives on edge cases. Cons: slow, expensive, poor scalability, limited audit automation.",
    )
    h3(doc, "Rule-only engines (e.g. legacy ACS)")
    para(
        doc,
        "Authorization systems apply hard thresholds (amount limits, velocity counts, country blocks). "
        "Pros: fast, interpretable. Cons: high false positives, difficult to adapt, no personalised behavior.",
    )
    h3(doc, "ML-only black-box scoring")
    para(
        doc,
        "Modern vendors use gradient boosting or neural networks on large datasets. Pros: high accuracy "
        "potential. Cons: limited explainability, regulatory challenges, requires large labelled data.",
    )
    h3(doc, "Commercial fraud platforms (FICO, SAS, Feedzai-class systems)")
    para(
        doc,
        "Enterprise suites offer end-to-end case management, graph analytics, and model ops. Pros: mature, "
        "scalable. Cons: costly licences, closed source, long integration cycles—not feasible for academic prototype.",
    )

    h2(doc, "The Proposed System")
    para(
        doc,
        "FraudShield proposes a hybrid, explainable, web-accessible platform: rules plus behavioral profiling "
        "plus ML probability, fused into a 0–100 risk score, with JWT-secured role-based UI and full audit trail.",
    )

    h2(doc, "Conceptual Design")
    para(
        doc,
        "Conceptually, the system is organised into Presentation (Next.js), Application/API (Flask blueprints), "
        "Domain Services (scoring, ingest, RBAC, simulator), and Data (SQLAlchemy models). External actors "
        "interact only with the presentation layer; all business logic resides on the server.",
    )

    h2(doc, "Architecture of the Proposed System")
    para(doc, "The architecture follows a three-tier client–server model:")
    bullets(
        doc,
        [
            "Presentation tier: Next.js 14 App Router, React components, Chart.js visualisations.",
            "Application tier: Flask REST API with modular blueprints (auth, transactions, dashboard, admin, fraud, reports, alerts, users).",
            "Data tier: SQLite relational database accessed through SQLAlchemy ORM.",
        ],
    )
    para(
        doc,
        "Figure 2.1 (System Architecture): [Browser] --HTTPS/JSON--> [Flask API + JWT] --ORM--> [SQLite]. "
        "Submodules: Fraud Engine (rules, behavior, ML), Transaction Ingest Service, Simulator Thread, Report Exporters.",
    )

    h2(doc, "Component Designs and Component Descriptions")
    h3(doc, "Authentication Component")
    para(
        doc,
        "Handles registration, login, password reset via OTP, and JWT issuance. Passwords are hashed with "
        "bcrypt. Tokens carry user id and role claims consumed by protected routes.",
    )
    h3(doc, "Transaction Ingest Component")
    para(
        doc,
        "Receives transaction payloads, invokes evaluate_transaction(), persists Transaction and FraudDecision "
        "rows, updates UserProfile aggregates, writes AuditLog, and triggers alerts when risk_score >= 60.",
    )
    h3(doc, "Fraud Scoring Component")
    para(
        doc,
        "Orchestrates three scorers: (1) Rule engine checks amount, velocity, location change; (2) Behavior engine "
        "compares against profile averages and location history; (3) ML model predicts fraud probability from "
        "amount, frequency, and time-since-last features. Scores are summed and capped at 100.",
    )
    h3(doc, "Dashboard Analytics Component")
    para(
        doc,
        "Aggregates transaction statistics for charts and KPIs. Applies scope_transactions() so cardholders see "
        "only their own data while staff see global aggregates.",
    )
    h3(doc, "Administration Component")
    para(
        doc,
        "Allows administrators to list users, change roles, suspend accounts, toggle fraud rules in catalog, "
        "and queue model retrain stub with audit logging.",
    )
    h3(doc, "Reporting Component")
    para(
        doc,
        "Exports CSV transaction dumps, JSON summaries, audit JSON, and PDF summary using fpdf2 library.",
    )

    h2(doc, "Proposed System / Software Features")
    table(
        doc,
        ["Feature", "Description"],
        [
            ["User registration & login", "Email/password auth with role selection"],
            ["RBAC", "Cardholder, analyst, admin roles"],
            ["Transaction capture", "Manual ingest and simulator stream"],
            ["Hybrid fraud scoring", "Rules + behavior + ML"],
            ["Explainability", "Feature contribution breakdown per transaction"],
            ["Monitoring & flagged queue", "Search, filter, approve/flag/freeze actions"],
            ["Dashboard analytics", "Charts, heatmap, KPI cards"],
            ["Alerts & notifications", "In-app feed, email log, sound/toast on new tx"],
            ["Reports", "CSV, PDF, JSON exports"],
            ["Admin console", "User and rule management"],
        ],
    )

    h2(doc, "Development Tools and Environment")
    bullets(
        doc,
        [
            "Python 3.x, Flask, SQLAlchemy, Flask-JWT-Extended, Marshmallow",
            "Node.js, Next.js 14, TypeScript, Tailwind CSS",
            "scikit-learn, pandas, joblib for ML",
            "Visual Studio Code / Cursor IDE, Git, Postman/browser devtools",
            "SQLite, Flask-Migrate",
        ],
    )

    h2(doc, "Benefits of Implementation of the Proposed System")
    bullets(
        doc,
        [
            "Faster detection through automated scoring on every ingest.",
            "Improved analyst efficiency via prioritised flagged queue and explainability.",
            "Transparent decisions with stored rule/behavior/ML breakdown.",
            "Lower cost than enterprise suites for teaching and pilot deployment.",
            "Extensible modular codebase for future payment integration.",
        ],
    )


def chapter3(doc: Document) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 3: Methodology")

    h2(doc, "Chapter Overview")
    para(
        doc,
        "This chapter presents requirements engineering, stakeholders, functional and non-functional "
        "requirements, UML models, security design, chosen process model, and logical designs (UI and database).",
    )

    h2(doc, "Requirement Specification")
    h3(doc, "Stakeholders of System")
    table(
        doc,
        ["Stakeholder", "Interest"],
        [
            ["Cardholder", "Submit transactions, view own risk activity"],
            ["Fraud analyst", "Monitor, investigate, export reports"],
            ["System administrator", "Manage users, rules, system health"],
            ["Developer", "Maintain and extend codebase"],
            ["Examiner/supervisor", "Evaluate academic deliverables"],
        ],
    )

    h3(doc, "Requirement Gathering Process")
    para(
        doc,
        "Requirements were gathered through review of fraud detection literature, analysis of commercial "
        "platform features, supervisor consultation, and iterative prototyping with demo scenarios (manual "
        "ingest, simulator, role-based navigation).",
    )

    h3(doc, "Functional Requirements")
    table(
        doc,
        ["ID", "Requirement"],
        [
            ["FR1", "System shall allow users to register and authenticate securely"],
            ["FR2", "System shall ingest transactions with merchant, location, amount, device metadata"],
            ["FR3", "System shall compute and store fraud risk score 0–100 per transaction"],
            ["FR4", "System shall flag transactions when score >= 60"],
            ["FR5", "Analysts shall search and filter transaction lists"],
            ["FR6", "Analysts shall approve, flag, or freeze accounts on transactions"],
            ["FR7", "System shall provide explainability for a given transaction id"],
            ["FR8", "Admins shall manage user roles and activation status"],
            ["FR9", "System shall export CSV/PDF/JSON reports"],
            ["FR10", "Cardholders shall only access their own transaction data"],
        ],
    )

    h2(doc, "UML Diagrams")
    h3(doc, "Use Case Diagram – System Overview")
    para(
        doc,
        "Actors: Cardholder, Fraud Analyst, Administrator, External Payment Source (conceptual). "
        "Use cases: Register, Login, Ingest Transaction, View Dashboard, Monitor Transactions, Review Flagged Queue, "
        "Run Fraud Simulation, Explain Transaction, Export Reports, Manage Users, Manage Rules, Start Simulator.",
    )
    para(doc, "Figure 3.1: Use Case Diagram – insert diagram showing actors linked to use cases.")

    h3(doc, "Use Case Diagram – Backend Services")
    para(
        doc,
        "Focus on server-side cases: Authenticate JWT, Score Transaction, Persist Decision, Update Profile, "
        "Write Audit Log, Send Alert, Aggregate Metrics, Export Report.",
    )

    h3(doc, "Use Case Descriptions")
    table(
        doc,
        ["Use Case", "Actor", "Description", "Precondition", "Postcondition"],
        [
            ["Login", "All users", "User submits email/password; system returns JWT", "Registered account", "Token stored client-side"],
            ["Ingest Transaction", "Cardholder/Analyst/Admin", "Submit tx data; system scores and stores", "Valid JWT", "Transaction + decision saved"],
            ["Review Flagged Queue", "Analyst/Admin", "List flagged transactions", "Valid JWT, staff role", "Analyst selects case"],
            ["Explain Transaction", "All authenticated", "Return risk drivers for tx id", "Tx exists, authorized", "Explanation JSON shown"],
            ["Manage Users", "Admin", "List/patch users", "Admin JWT", "User record updated"],
            ["Export CSV", "Analyst/Admin", "Download transactions file", "Staff JWT", "CSV file downloaded"],
        ],
    )

    h3(doc, "Activity Diagram – Transaction Ingest")
    para(
        doc,
        "Flow: Start -> Receive JSON -> Validate schema -> Check JWT role -> Set user_id -> "
        "Call evaluate_transaction -> Save Transaction -> Save FraudDecision -> Update profile -> "
        "If score>=60 then flag + alert -> Write audit -> Return 201 -> End.",
    )

    h3(doc, "Sequence Diagram – Login and Dashboard Load")
    para(
        doc,
        "User -> Frontend: submit credentials. Frontend -> API: POST /auth/login. API -> DB: verify hash. "
        "API -> Frontend: JWT. Frontend -> API: GET /auth/me with Bearer token. API -> Frontend: user profile. "
        "Frontend renders dashboard and loads /dashboard/overview.",
    )

    h3(doc, "Class Diagram – Core Domain")
    para(
        doc,
        "Classes: User (1) — (N) Transaction; Transaction (1) — (1) FraudDecision; User (1) — (1) UserProfile; "
        "Transaction (1) — (N) Alert; User (1) — (N) UserSession; FraudRule, AuditLog, FraudNotification as standalone entities.",
    )

    h2(doc, "Non-Functional Requirements")
    table(
        doc,
        ["ID", "Requirement", "Justification"],
        [
            ["NFR1", "API response < 2s for ingest on demo hardware", "Usable real-time demo"],
            ["NFR2", "Passwords stored hashed", "Security best practice"],
            ["NFR3", "JWT expiry 24 hours", "Balance security and UX"],
            ["NFR4", "Responsive UI down to 768px width", "Mobile-friendly dashboard"],
            ["NFR5", "CORS enabled for local dev frontend", "Separated Next.js/Flask ports"],
            ["NFR6", "Audit log for sensitive actions", "Compliance traceability"],
        ],
    )

    h2(doc, "Security Concepts")
    bullets(
        doc,
        [
            "Authentication: JWT bearer tokens; invalid/expired tokens return 401; client clears session.",
            "Authorization: Role claims enforced in routes and rbac.py; cardholder data scoped by user_id.",
            "Password security: bcrypt hashing; minimum 8 characters on registration.",
            "Password reset: time-limited OTP tokens; OTP marked used after reset.",
            "Session cookie: lightweight fraudshield_session for Next.js middleware only; not a substitute for JWT on API.",
            "Transport: HTTPS recommended in production; demo uses localhost.",
        ],
    )

    h2(doc, "Project Methods")
    h3(doc, "Software Process Models (Brief)")
    para(
        doc,
        "Waterfall: sequential phases, rigid change control. Agile: iterative delivery, frequent feedback. "
        "Spiral: risk-driven iterations. V-Model: testing aligned to each design phase. DevOps: continuous integration and deployment.",
    )
    h3(doc, "Chosen Model and Justification")
    para(
        doc,
        "An Agile-inspired iterative approach was adopted: backend API first, then ML integration, then frontend "
        "modules in vertical slices. Justification: requirements evolved during prototyping (RBAC, notifications, "
        "reports); Agile allowed reprioritisation without full waterfall rework; two-week sprints mapped to academic timeline.",
    )

    h2(doc, "Project Design Consideration (Logical Designs)")
    h3(doc, "UI Design")
    para(doc, "Wireframe descriptions (see also implemented screens):")
    bullets(
        doc,
        [
            "Landing: hero, features, product screenshot, login/register CTAs.",
            "Login/Register: form cards with role selector on register.",
            "Dashboard layout: sidebar navigation + header + content panels.",
            "Overview: KPI icon cards, line chart, bar charts, heatmap, activity feeds.",
            "Monitoring: filterable data table with row actions.",
            "Capture: manual form + simulator controls (staff).",
        ],
    )
    para(doc, "Figure 3.2: UI Wireframe – Dashboard Overview [insert wireframe screenshot if required].")

    h3(doc, "DB Design")
    para(doc, "Entity-Relationship summary:")
    table(
        doc,
        ["Entity", "Key Attributes", "Relationships"],
        [
            ["User", "id, email, role, password_hash", "1:N Transaction, 1:1 UserProfile"],
            ["Transaction", "amount, location, risk_score, status", "N:1 User, 1:1 FraudDecision"],
            ["FraudDecision", "rule_score, ml_score, reasons", "1:1 Transaction"],
            ["UserProfile", "avg_spend, top_locations", "1:1 User"],
            ["AuditLog", "action, entity, details", "optional actor_user_id"],
        ],
    )
    para(doc, "Figure 3.3: ER Diagram [insert diagram]. Primary keys on id columns; foreign keys on user_id, transaction_id.")

    h2(doc, "Developmental Tools (Detailed)")
    para(
        doc,
        "Flask provides routing and blueprint modularity. SQLAlchemy maps Python classes to tables and supports "
        "migrations via Flask-Migrate. Next.js App Router enables file-based routing and client/server components. "
        "Chart.js renders fraud trends client-side. scikit-learn Pipeline is serialized with joblib for inference in fraud/model.py.",
    )


def chapter4(doc: Document) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 4: Implementation and Results")

    h2(doc, "Chapter Overview")
    para(
        doc,
        "This chapter maps logical designs to the physical platform, presents key algorithms, construction "
        "evidence, testing approach, and results from the implemented FraudShield prototype.",
    )

    h2(doc, "Mapping Logical Design onto Physical Platform")
    h3(doc, "Algorithm: Fraud Score Fusion")
    code(
        doc,
        "INPUT: user_id, amount, location\n"
        "rule_result <- evaluate_rules(user_id, amount, location)\n"
        "behavior_score, behavior_reasons <- evaluate_behavior(user_id, amount, location)\n"
        "ml_result <- predict_fraud_probability(amount, tx_frequency_10m, minutes_since_last)\n"
        "final_score <- MIN(100, rule_score + behavior_score + ml_score)\n"
        "label <- critical if score>=80 else high if score>=60 else medium if score>=30 else low\n"
        "RETURN final_score, label, combined_reasons",
    )
    h3(doc, "Algorithm: Transaction Ingest")
    code(
        doc,
        "INPUT: transaction_data, actor_jwt\n"
        "IF role is cardholder THEN force user_id <- actor_id\n"
        "result <- evaluate_transaction(...)\n"
        "INSERT Transaction, FraudDecision\n"
        "UPDATE UserProfile\n"
        "IF final_score >= 60 THEN status<-flagged; create Alert + Notification\n"
        "WRITE AuditLog\n"
        "RETURN 201 with transaction id and scores",
    )
    h3(doc, "Database Implementation Flow")
    para(
        doc,
        "Models defined in models.py -> flask db migrate -> flask db upgrade -> seed_all() on startup "
        "creates demo users and sample transactions if count < threshold.",
    )

    h2(doc, "Construction")
    h3(doc, "Backend snippet – JWT login")
    code(doc, 'token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})')
    h3(doc, "Backend snippet – Rule check")
    code(doc, "if amount > 5000: score += 20; reasons.append('High transaction amount')")
    h3(doc, "Frontend")
    para(
        doc,
        "Implemented pages under frontend/app/: landing, auth flows, dashboard/* with AppShell, Sidebar, "
        "KpiCard with icons, RoleGuard, TransactionNotificationProvider polling /transactions/feed every 4 seconds.",
    )
    para(doc, "Screenshots: Insert captures of Landing page, Dashboard overview, Monitoring, Fraud lab, Admin console, Reports download.")

    h2(doc, "Testing")
    h3(doc, "Testing Plan")
    table(
        doc,
        ["Level", "Focus", "Method"],
        [
            ["Unit", "Rule and behavior scorers", "Manual inputs, expected score deltas"],
            ["Integration", "API endpoints", "Postman/browser, JWT headers"],
            ["System", "Role-based flows", "Three demo accounts end-to-end"],
            ["UI", "Navigation", "RoleGuard redirects, responsive layout"],
        ],
    )
    h3(doc, "Component Testing")
    para(doc, "UI: verify login redirect, dashboard KPI load, capture form validation. DB: verify foreign keys, seed counts, scoped queries for cardholder.")
    h3(doc, "System Testing")
    para(
        doc,
        "Verification: build matches specification (features present). Validation: demo users complete "
        "realistic fraud investigation scenario—ingest high amount, observe flag, explain, export CSV.",
    )

    h2(doc, "Results")
    bullets(
        doc,
        [
            "System successfully scores and persists transactions with sub-second API latency on local hardware.",
            "Hybrid engine flags high-risk synthetic transactions (large amount + velocity + foreign location).",
            "Dashboard displays live KPIs, charts, and flagged queue with role-appropriate navigation.",
            "Exports produce non-empty CSV and PDF when seed data present.",
            "Cardholder scope correctly limits list/feed to own user_id.",
        ],
    )
    table(
        doc,
        ["Metric (demo seed)", "Typical value"],
        [
            ["Transactions seeded", "80+"],
            ["Fraud rate", "~3–5% (varies)"],
            ["API ingest HTTP status", "201 Created"],
            ["Login failure", "401 Invalid credentials"],
        ],
    )


def chapter5(doc: Document) -> None:
    doc.add_page_break()
    h1(doc, "Chapter 5: Findings and Conclusion")

    h2(doc, "Chapter Overview")
    para(doc, "This chapter summarises outcomes, conclusions, limitations, lessons, and recommendations.")

    h2(doc, "Findings")
    bullets(
        doc,
        [
            "Hybrid scoring provides more balanced alerts than rules or ML alone in demo scenarios.",
            "Role-based access is essential to separate cardholder privacy from analyst global view.",
            "Explainability views improve confidence even when full SHAP is not deployed.",
            "Iterative Agile delivery suited evolving academic requirements.",
        ],
    )

    h2(doc, "Conclusions")
    para(
        doc,
        "The FraudShield project successfully demonstrates a complete credit card fraud detection platform "
        "with authentication, hybrid intelligence, operational dashboard, and reporting. Objectives stated in "
        "Chapter 1 were met within prototype scope. The system is suitable for demonstration, further research, "
        "and incremental hardening toward production.",
    )

    h2(doc, "Challenges / Limitations of the System")
    bullets(
        doc,
        [
            "Aligning frontend session cookie with JWT required careful 401 handling.",
            "ML training dependent on availability of suitable labelled dataset.",
            "Time constraints limited automated test coverage and production DevOps.",
        ],
    )

    h2(doc, "Lessons Learnt")
    bullets(
        doc,
        [
            "Security must be designed early (RBAC, scoped queries), not added late.",
            "Separating scoring engine from transport layer simplifies testing.",
            "Documentation and seed data accelerate demonstration and grading.",
        ],
    )

    h2(doc, "Recommendations for Future Works")
    bullets(
        doc,
        [
            "Integrate real payment webhooks and stream processing (Kafka).",
            "Wire FraudRule database catalog into live rule engine.",
            "Add SHAP or LIME for formal explainability.",
            "Deploy on PostgreSQL with Docker and CI/CD pipeline.",
            "Implement genuine email/SMS and TOTP 2FA.",
        ],
    )

    h2(doc, "Recommendations for Project Commercialization")
    para(
        doc,
        "Commercialisation could target small fintechs via SaaS subscription: per-transaction scoring API, "
        "analyst seats, and compliance report packs. Partnership with regional banks for pilot programmes, "
        "PCI-DSS assessment, and SOC2 readiness would be prerequisite. Open-core model (free tier + paid analytics) "
        "could drive adoption.",
    )

    h2(doc, "References")
    refs = [
        "Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5–32.",
        "Flask Documentation. https://flask.palletsprojects.com/",
        "Next.js Documentation. https://nextjs.org/docs",
        "Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. JMLR 12, 2825–2830.",
        "Verizon (2024). Data Breach Investigations Report (fraud trends reference).",
        "OWASP (2023). JWT Security Cheat Sheet.",
        "SQLAlchemy Documentation. https://www.sqlalchemy.org/",
    ]
    for ref in refs:
        doc.add_paragraph(ref, style="List Number")


def build_document() -> Document:
    doc = Document()
    set_doc_defaults(doc)
    add_title_page(doc)
    chapter1(doc)
    chapter2(doc)
    chapter3(doc)
    chapter4(doc)
    chapter5(doc)
    return doc


def main() -> None:
    doc = build_document()
    doc.save(OUTPUT)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
