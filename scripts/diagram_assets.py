"""Generate PNG diagrams for FraudShield project documentation."""

from __future__ import annotations

from pathlib import Path

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

ASSETS_DIR = Path(__file__).resolve().parent / "doc_assets"


def _ensure_dir() -> Path:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    return ASSETS_DIR


def _save(fig, name: str) -> Path:
    path = _ensure_dir() / name
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return path


def _box(ax, x, y, w, h, text, fc="#E8F4FD", ec="#1a5276", fontsize=9):
    rect = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.02",
        linewidth=1.5,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fontsize, wrap=True)


def _arrow(ax, x1, y1, x2, y2, label: str = ""):
    arr = FancyArrowPatch(
        (x1, y1),
        (x2, y2),
        arrowstyle="-|>",
        mutation_scale=12,
        linewidth=1.2,
        color="#333",
    )
    ax.add_patch(arr)
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.08, label, ha="center", fontsize=7, color="#555")


def draw_system_architecture() -> Path:
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Figure 2.1: FraudShield System Architecture (Three-Tier)", fontsize=12, fontweight="bold")

    _box(ax, 0.5, 5.2, 2.8, 1.0, "Presentation Tier\nNext.js 14 + React\nTailwind CSS, Chart.js", "#D5F5E3")
    _box(ax, 3.6, 5.2, 2.8, 1.0, "Browser Client\nJWT + Session Cookie\nRole-based UI", "#D5F5E3")

    _box(ax, 1.5, 3.0, 7.0, 1.4, "Application Tier — Flask REST API\nBlueprints: auth, transactions, dashboard, fraud, admin, reports, alerts, disputes\nServices: ingest, scoring engine, RBAC, cache, audit, simulator", "#D6EAF8")

    _box(ax, 0.8, 0.8, 2.5, 1.2, "Fraud Engine\nRules + Behavior + ML", "#FCF3CF")
    _box(ax, 3.7, 0.8, 2.5, 1.2, "ML Model\nscikit-learn\n(joblib artifact)", "#FCF3CF")
    _box(ax, 6.6, 0.8, 2.5, 1.2, "Data Tier\nPostgreSQL (Neon)\nSQLAlchemy ORM", "#FADBD8")

    _arrow(ax, 3.3, 5.2, 5.0, 4.4, "HTTPS/JSON")
    _arrow(ax, 5.0, 3.0, 2.0, 2.0)
    _arrow(ax, 5.0, 3.0, 5.0, 2.0)
    _arrow(ax, 5.0, 3.0, 7.8, 2.0, "ORM")
    return _save(fig, "fig_2_1_architecture.png")


def draw_component_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Figure 2.2: Component Diagram", fontsize=12, fontweight="bold")

    comps = [
        (0.3, 6.5, "Auth\nComponent", "#D5F5E3"),
        (2.5, 6.5, "Transaction\nIngest", "#D5F5E3"),
        (4.7, 6.5, "Fraud\nScoring", "#D5F5E3"),
        (6.9, 6.5, "Dashboard\nAnalytics", "#D5F5E3"),
        (0.3, 4.5, "Disputes\nWorkflow", "#D5F5E3"),
        (2.5, 4.5, "Reports\nExporter", "#D5F5E3"),
        (4.7, 4.5, "Admin\nConsole", "#D5F5E3"),
        (6.9, 4.5, "Alerts &\nNotifications", "#D5F5E3"),
        (2.0, 2.0, "Shared Services\nRBAC · Audit · Cache · Seed", "#D6EAF8"),
        (4.5, 0.5, "PostgreSQL Database\nUsers · Transactions · Decisions · Disputes", "#FADBD8"),
    ]
    for x, y, t, c in comps:
        _box(ax, x, y, 1.8, 1.2, t, c)

    for x in [1.2, 3.4, 5.6, 7.8]:
        _arrow(ax, x, 4.5, 3.5, 3.2)
    _arrow(ax, 3.5, 2.0, 5.0, 1.7)
    return _save(fig, "fig_2_2_components.png")


def draw_use_case() -> Path:
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Figure 3.1: Use Case Diagram — FraudShield", fontsize=12, fontweight="bold")

    system = FancyBboxPatch(
        (2.5, 0.5), 7.5, 6.0, boxstyle="round,pad=0.05", linewidth=2, edgecolor="#1a5276", facecolor="#FAFAFA"
    )
    ax.add_patch(system)
    ax.text(6.25, 6.3, "FraudShield System", ha="center", fontsize=10, fontweight="bold")

    cases = [
        (3.2, 5.0, "Register / Login"),
        (5.5, 5.0, "Ingest Transaction"),
        (7.8, 5.0, "View Dashboard"),
        (3.2, 3.5, "Monitor & Flag Queue"),
        (5.5, 3.5, "Explain Transaction"),
        (7.8, 3.5, "Resolve Disputes"),
        (3.2, 2.0, "Export Reports"),
        (5.5, 2.0, "Manage Users/Rules"),
        (7.8, 2.0, "Live Simulator"),
    ]
    for x, y, t in cases:
        e = mpatches.Ellipse((x + 0.9, y + 0.25), 1.8, 0.55, fc="#EBF5FB", ec="#2874A6")
        ax.add_patch(e)
        ax.text(x + 0.9, y + 0.25, t, ha="center", va="center", fontsize=7)

    actors = [
        (0.8, 5.0, "Cardholder"),
        (0.8, 3.0, "Fraud\nAnalyst"),
        (0.8, 1.0, "Administrator"),
    ]
    for x, y, t in actors:
        ax.plot(x, y + 0.5, marker="o", markersize=8, color="#333")
        ax.plot([x, x], [y + 0.5, y - 0.3], color="#333")
        ax.plot([x - 0.2, x + 0.2], [y - 0.3, y - 0.3], color="#333")
        ax.plot([x, x - 0.15], [y - 0.15, y - 0.55], color="#333")
        ax.plot([x, x + 0.15], [y - 0.15, y - 0.55], color="#333")
        ax.text(x, y - 0.85, t, ha="center", fontsize=8)

    _arrow(ax, 1.1, 5.0, 3.2, 5.2)
    _arrow(ax, 1.1, 3.2, 3.2, 3.7)
    _arrow(ax, 1.1, 1.2, 5.5, 2.2)
    return _save(fig, "fig_3_1_use_case.png")


def draw_activity_ingest() -> Path:
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 12)
    ax.axis("off")
    ax.set_title("Figure 3.2: Activity Diagram — Transaction Ingest", fontsize=12, fontweight="bold")

    steps = [
        (2.5, 11.0, "Start", "ellipse"),
        (1.5, 9.8, "Receive JSON payload\n(POST /transactions/ingest)", "box"),
        (1.5, 8.6, "Validate schema & JWT", "box"),
        (1.5, 7.4, "Scope user_id\n(cardholder → self only)", "box"),
        (1.5, 6.2, "evaluate_transaction()\nRules + Behavior + ML", "box"),
        (1.5, 5.0, "Persist Transaction\n& FraudDecision", "box"),
        (1.5, 3.8, "Update UserProfile", "box"),
        (3.8, 2.8, "score >= 60?", "diamond"),
        (0.5, 1.6, "Flag tx, create\nAlert & Notification", "box"),
        (4.5, 1.6, "Status = approved", "box"),
        (1.5, 0.4, "Write AuditLog,\nreturn 201 + scores", "box"),
    ]
    y_prev = 11.0
    for item in steps:
        x, y, t, kind = item
        if kind == "ellipse":
            e = mpatches.Ellipse((x + 1.5, y), 3.0, 0.6, fc="#D5F5E3", ec="#333")
            ax.add_patch(e)
        elif kind == "diamond":
            d = mpatches.RegularPolygon((x + 1.0, y), 4, radius=0.7, orientation=0.785, fc="#FCF3CF", ec="#333")
            ax.add_patch(d)
        else:
            _box(ax, x, y - 0.35, 3.0, 0.7, t, "#EBF5FB", "#2874A6", 7)
        if y != 11.0 and kind != "diamond":
            _arrow(ax, x + 1.5, y_prev - 0.4, x + 1.5, y + 0.35)
        y_prev = y

    _arrow(ax, 3.0, 6.2, 3.0, 5.35)
    _arrow(ax, 4.8, 2.8, 2.0, 1.95)
    _arrow(ax, 4.8, 2.8, 5.5, 1.95)
    _arrow(ax, 2.0, 1.25, 3.0, 0.75)
    _arrow(ax, 5.5, 1.25, 3.0, 0.75)
    return _save(fig, "fig_3_2_activity_ingest.png")


def draw_sequence_login() -> Path:
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Figure 3.3: Sequence Diagram — Login & Dashboard Load", fontsize=12, fontweight="bold")

    actors = [("User", 1), ("Frontend\n(Next.js)", 3.5), ("Flask API", 6), ("PostgreSQL", 8.5)]
    for name, x in actors:
        ax.text(x, 7.5, name, ha="center", fontsize=9, fontweight="bold")
        ax.plot([x, x], [0.5, 7.0], "--", color="#999")

    msgs = [
        (1, 3.5, 6.8, "1. Submit email/password"),
        (3.5, 6, 6.5, "2. POST /auth/login"),
        (6, 8.5, 6.2, "3. Verify bcrypt hash"),
        (8.5, 6, 5.9, "4. User record"),
        (6, 3.5, 5.6, "5. JWT + role claims"),
        (3.5, 1, 5.3, "6. Store token, set session cookie"),
        (3.5, 6, 5.0, "7. GET /auth/me (Bearer)"),
        (6, 8.5, 4.7, "8. Load profile"),
        (6, 3.5, 4.4, "9. User JSON"),
        (3.5, 6, 4.1, "10. GET /dashboard/overview"),
        (6, 8.5, 3.8, "11. Aggregate KPIs (scoped RBAC)"),
        (8.5, 6, 3.5, "12. Stats rows"),
        (6, 3.5, 3.2, "13. Dashboard JSON"),
        (3.5, 1, 2.9, "14. Render charts & KPI cards"),
    ]
    for x1, x2, y, label in msgs:
        style = "-|>" if x1 < x2 else "<|-"
        arr = FancyArrowPatch((x1, y), (x2, y), arrowstyle=style, mutation_scale=10, color="#333")
        ax.add_patch(arr)
        ax.text(5, y + 0.08, label, ha="center", fontsize=7)
    return _save(fig, "fig_3_3_sequence_login.png")


def draw_class_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Figure 3.4: Class Diagram — Core Domain Model", fontsize=12, fontweight="bold")

    classes = [
        (0.3, 5.5, "User", ["+id: int", "+email: str", "+role: str", "+password_hash", "+is_active"]),
        (3.0, 5.5, "Transaction", ["+id, user_id", "+amount, location", "+risk_score", "+status"]),
        (5.7, 5.5, "FraudDecision", ["+rule_score", "+behavior_score", "+ml_score", "+reasons"]),
        (8.4, 5.5, "UserProfile", ["+avg_spend", "+top_locations", "+tx_count"]),
        (0.3, 2.5, "DisputeCase", ["+reason, status", "+customer_note", "+resolution_note"]),
        (3.0, 2.5, "FraudRule", ["+name, enabled", "+priority"]),
        (5.7, 2.5, "AuditLog", ["+action, entity", "+details"]),
        (8.4, 2.5, "FraudNotification", ["+title, severity", "+read: bool"]),
    ]
    for x, y, name, attrs in classes:
        h = 0.35 + len(attrs) * 0.28
        rect = FancyBboxPatch((x, y), 2.2, h, boxstyle="round,pad=0.02", fc="#EBF5FB", ec="#2874A6")
        ax.add_patch(rect)
        ax.text(x + 1.1, y + h - 0.2, name, ha="center", fontweight="bold", fontsize=9)
        for i, a in enumerate(attrs):
            ax.text(x + 0.1, y + h - 0.5 - i * 0.28, a, fontsize=7, family="monospace")

    ax.text(2.5, 6.3, "1", ha="center", fontsize=8)
    ax.text(2.5, 6.0, "*", ha="center", fontsize=10)
    ax.text(4.0, 6.0, "transactions", ha="center", fontsize=7)
    ax.text(5.2, 6.3, "1", ha="center", fontsize=8)
    ax.text(5.2, 6.0, "1", ha="center", fontsize=10)
    ax.text(5.2, 5.9, "decision", ha="center", fontsize=7)
    ax.text(2.5, 3.8, "1", ha="center", fontsize=8)
    ax.text(2.5, 3.5, "0..1", ha="center", fontsize=10)
    ax.text(1.5, 3.5, "dispute", ha="center", fontsize=7)
    return _save(fig, "fig_3_4_class_diagram.png")


def draw_er_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Figure 3.5: Entity-Relationship Diagram", fontsize=12, fontweight="bold")

    entities = [
        (0.5, 5.5, "USER", ["PK id", "email", "role", "password_hash"]),
        (3.5, 5.5, "TRANSACTION", ["PK id", "FK user_id", "amount", "risk_score", "status"]),
        (6.5, 5.5, "FRAUD_DECISION", ["PK id", "FK transaction_id", "rule_score", "ml_score"]),
        (9.0, 5.5, "USER_PROFILE", ["PK id", "FK user_id", "avg_spend"]),
        (2.0, 2.0, "DISPUTE_CASE", ["PK id", "FK transaction_id", "status"]),
        (5.0, 2.0, "FRAUD_RULE", ["PK id", "name", "enabled"]),
        (7.5, 2.0, "AUDIT_LOG", ["PK id", "action", "entity_id"]),
        (9.5, 2.0, "ALERT", ["PK id", "FK transaction_id"]),
    ]
    for x, y, name, attrs in entities:
        _box(ax, x, y, 2.0, 0.45 + len(attrs) * 0.22, f"{name}\n" + "\n".join(attrs), "#FEF9E7", "#B7950B", 7)

    _arrow(ax, 2.5, 5.8, 3.5, 5.8, "1:N")
    _arrow(ax, 5.5, 5.8, 6.5, 5.8, "1:1")
    _arrow(ax, 1.5, 5.5, 9.5, 5.8, "1:1 profile")
    _arrow(ax, 4.5, 5.5, 3.0, 2.5, "1:0..1")
    _arrow(ax, 5.5, 5.5, 9.5, 2.5, "1:N alerts")
    return _save(fig, "fig_3_5_er_diagram.png")


def draw_fraud_flowchart() -> Path:
    fig, ax = plt.subplots(figsize=(8, 9))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 10)
    ax.axis("off")
    ax.set_title("Figure 4.1: Fraud Scoring Algorithm Flowchart", fontsize=12, fontweight="bold")

    nodes = [
        (2.0, 9.0, "INPUT: user_id, amount, location", "box"),
        (2.0, 7.8, "Rule Engine\n(amount, velocity, geo)", "box"),
        (2.0, 6.6, "Behavior Engine\n(profile drift, locations)", "box"),
        (2.0, 5.4, "ML Model\n(amount, freq_10m, time_since_last)", "box"),
        (2.0, 4.2, "final_score = MIN(100,\nrule + behavior + ml)", "box"),
        (2.0, 3.0, "Assign label:\ncritical/high/medium/low", "box"),
        (2.0, 1.8, "Merge reason strings", "box"),
        (2.0, 0.6, "RETURN FraudResult", "ellipse"),
    ]
    prev_y = 9.0
    for x, y, t, kind in nodes:
        if kind == "ellipse":
            e = mpatches.Ellipse((x + 2, y), 3.5, 0.65, fc="#D5F5E3", ec="#333")
            ax.add_patch(e)
            ax.text(x + 2, y, t, ha="center", va="center", fontsize=8)
        else:
            _box(ax, x, y - 0.35, 4.0, 0.75, t, "#EBF5FB", "#2874A6", 8)
        if y != 9.0:
            _arrow(ax, x + 2, prev_y - 0.4, x + 2, y + 0.38)
        prev_y = y
    return _save(fig, "fig_4_1_fraud_flowchart.png")


def draw_agile_process() -> Path:
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4)
    ax.axis("off")
    ax.set_title("Figure 3.6: Agile Iterative Development Process", fontsize=12, fontweight="bold")

    phases = ["Requirements", "Design", "Implement", "Test", "Review", "Deploy Demo"]
    for i, p in enumerate(phases):
        x = 0.3 + i * 1.55
        _box(ax, x, 1.5, 1.35, 0.9, p, "#D6EAF8", "#1a5276", 8)
        if i < len(phases) - 1:
            _arrow(ax, x + 1.35, 1.95, x + 1.55, 1.95)
    ax.annotate("", xy=(9.5, 0.8), xytext=(0.5, 0.8), arrowprops=dict(arrowstyle="-|>", color="#C0392B"))
    ax.text(5, 0.5, "Feedback loop — reprioritise backlog each sprint", ha="center", fontsize=8, color="#C0392B")
    return _save(fig, "fig_3_6_agile_process.png")


def draw_ui_wireframe() -> Path:
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Figure 3.7: UI Wireframe — Dashboard Layout", fontsize=12, fontweight="bold")

    _box(ax, 0.2, 0.2, 1.8, 5.6, "Sidebar\n· Overview\n· Monitoring\n· Capture\n· Flagged\n· Disputes\n· Admin", "#E8F8F5", "#117A65", 8)
    _box(ax, 2.2, 5.0, 7.6, 0.8, "Header — Search · Notifications · Account", "#F4F6F7", "#566573", 8)
    _box(ax, 2.2, 3.8, 1.8, 1.0, "KPI Card", "#D6EAF8", "#2874A6", 8)
    _box(ax, 4.2, 3.8, 1.8, 1.0, "KPI Card", "#D6EAF8", "#2874A6", 8)
    _box(ax, 6.2, 3.8, 1.8, 1.0, "KPI Card", "#D6EAF8", "#2874A6", 8)
    _box(ax, 8.2, 3.8, 1.6, 1.0, "KPI Card", "#D6EAF8", "#2874A6", 8)
    _box(ax, 2.2, 0.4, 4.8, 3.2, "Charts — Line / Bar / Heatmap", "#FCF3CF", "#B7950B", 9)
    _box(ax, 7.2, 0.4, 2.6, 3.2, "Activity Feed\nRecent alerts", "#FADBD8", "#922B21", 8)
    return _save(fig, "fig_3_7_ui_wireframe.png")


def draw_data_flow() -> Path:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Figure 2.3: Data Flow — Transaction Lifecycle", fontsize=12, fontweight="bold")

    flow = ["Capture / API", "Ingest Service", "Fraud Engine", "Database", "Dashboard", "Analyst Action"]
    for i, f in enumerate(flow):
        x = 0.3 + i * 1.55
        _box(ax, x, 2.0, 1.35, 0.9, f, "#EBF5FB", "#2874A6", 8)
        if i < len(flow) - 1:
            _arrow(ax, x + 1.35, 2.45, x + 1.55, 2.45)
    ax.text(5, 1.2, "Audit log & notifications branch from Ingest Service", ha="center", fontsize=8, style="italic")
    return _save(fig, "fig_2_3_data_flow.png")


def generate_all_diagrams() -> dict[str, Path]:
    return {
        "architecture": draw_system_architecture(),
        "components": draw_component_diagram(),
        "data_flow": draw_data_flow(),
        "use_case": draw_use_case(),
        "activity": draw_activity_ingest(),
        "sequence": draw_sequence_login(),
        "class_diagram": draw_class_diagram(),
        "er_diagram": draw_er_diagram(),
        "agile": draw_agile_process(),
        "wireframe": draw_ui_wireframe(),
        "fraud_flow": draw_fraud_flowchart(),
    }


if __name__ == "__main__":
    paths = generate_all_diagrams()
    for k, p in paths.items():
        print(f"{k}: {p}")
