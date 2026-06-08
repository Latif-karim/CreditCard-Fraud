"""Generate PNG diagrams for FraudShield project documentation."""

from __future__ import annotations

import textwrap
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

ASSETS_DIR = Path(__file__).resolve().parent / "doc_assets"

# Consistent styling
FONT = "DejaVu Sans"
TITLE_SIZE = 11
LABEL_SIZE = 8
SMALL_SIZE = 7
LINE_H = 0.22  # data-units per text line
PAD = 0.12


def _ensure_dir() -> Path:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    return ASSETS_DIR


def _save(fig, name: str) -> Path:
    path = _ensure_dir() / name
    fig.savefig(path, dpi=200, bbox_inches="tight", facecolor="white", pad_inches=0.25)
    plt.close(fig)
    return path


def _wrap(text: str, width: int = 22) -> list[str]:
    lines: list[str] = []
    for block in text.split("\n"):
        block = block.strip()
        if not block:
            continue
        wrapped = textwrap.wrap(block, width=width, break_long_words=False, break_on_hyphens=False)
        lines.extend(wrapped if wrapped else [block])
    return lines or [""]


def _box(
    ax,
    x: float,
    y: float,
    w: float,
    text: str,
    fc: str = "#E8F4FD",
    ec: str = "#1a5276",
    fontsize: int = LABEL_SIZE,
    wrap: int = 20,
    ha: str = "center",
) -> float:
    """Draw a rounded box; return height used."""
    lines = _wrap(text, wrap)
    h = PAD * 2 + len(lines) * LINE_H
    rect = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.015,rounding_size=0.06",
        linewidth=1.2,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(rect)
    ty = y + h - PAD - LINE_H * 0.15
    for line in lines:
        ax.text(
            x + w / 2 if ha == "center" else x + PAD,
            ty,
            line,
            ha=ha,
            va="top",
            fontsize=fontsize,
            fontfamily=FONT,
        )
        ty -= LINE_H
    return h


def _arrow(ax, x1, y1, x2, y2, label: str = ""):
    style = "-|>" if (x2 - x1) ** 2 + (y2 - y1) ** 2 > 0.01 else "-"
    arr = FancyArrowPatch(
        (x1, y1),
        (x2, y2),
        arrowstyle=style,
        mutation_scale=10,
        linewidth=1.0,
        color="#444",
        connectionstyle="arc3,rad=0.0",
    )
    ax.add_patch(arr)
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.06, label, ha="center", fontsize=SMALL_SIZE, color="#555", fontfamily=FONT)


def _title(ax, text: str):
    ax.set_title(text, fontsize=TITLE_SIZE, fontweight="bold", fontfamily=FONT, pad=12)


def draw_system_architecture() -> Path:
    fig, ax = plt.subplots(figsize=(11, 7.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8)
    ax.axis("off")
    _title(ax, "Figure 2.1: System architecture (three-tier)")

    h1 = _box(ax, 0.4, 6.5, 4.8, "Presentation tier\nNext.js, React, Tailwind", "#D5F5E3", wrap=24)
    h2 = _box(ax, 5.8, 6.5, 4.8, "Browser\nJWT auth, role-based UI", "#D5F5E3", wrap=24)

    _box(
        ax,
        0.8,
        4.0,
        9.4,
        "Application tier — Flask REST API\nAuth, transactions, dashboard, fraud, admin, reports",
        "#D6EAF8",
        wrap=42,
        fontsize=LABEL_SIZE,
    )

    _box(ax, 0.5, 1.2, 3.0, "Fraud engine\nRules, behaviour, ML", "#FCF3CF", wrap=16)
    _box(ax, 4.0, 1.2, 3.0, "ML model\nscikit-learn joblib", "#FCF3CF", wrap=16)
    _box(ax, 7.5, 1.2, 3.0, "Data tier\nPostgreSQL, SQLAlchemy", "#FADBD8", wrap=16)

    _arrow(ax, 5.5, 6.5, 5.5, 5.35, "HTTPS")
    _arrow(ax, 2.0, 4.0, 2.0, 2.55)
    _arrow(ax, 5.5, 4.0, 5.5, 2.55)
    _arrow(ax, 9.0, 4.0, 9.0, 2.55)
    return _save(fig, "fig_2_1_architecture.png")


def draw_component_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 9)
    ax.axis("off")
    _title(ax, "Figure 2.3: Component diagram")

    top = [
        (0.3, 7.0, "Authentication"),
        (2.6, 7.0, "Transaction ingest"),
        (4.9, 7.0, "Fraud scoring"),
        (7.2, 7.0, "Dashboard stats"),
    ]
    mid = [
        (0.3, 5.0, "Disputes"),
        (2.6, 5.0, "Reports"),
        (4.9, 5.0, "Admin console"),
        (7.2, 5.0, "Alerts"),
    ]
    for x, y, label in top + mid:
        _box(ax, x, y, 2.0, label, "#D5F5E3", wrap=14)

    _box(ax, 2.5, 2.8, 6.0, "Shared services: RBAC, audit log, cache, seed data", "#D6EAF8", wrap=38)
    _box(ax, 2.0, 0.5, 7.0, "PostgreSQL — users, transactions, decisions, disputes", "#FADBD8", wrap=38)

    for x in [1.3, 3.6, 5.9, 8.2]:
        _arrow(ax, x, 5.0, 5.5, 3.65)
    _arrow(ax, 5.5, 2.8, 5.5, 1.65)
    return _save(fig, "fig_2_2_components.png")


def draw_use_case() -> Path:
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    _title(ax, "Figure 3.1: Use case diagram")

    system = FancyBboxPatch(
        (3.0, 0.6),
        8.5,
        6.8,
        boxstyle="round,pad=0.04",
        linewidth=1.5,
        edgecolor="#1a5276",
        facecolor="#FAFAFA",
    )
    ax.add_patch(system)
    ax.text(7.25, 7.15, "FraudShield system boundary", ha="center", fontsize=LABEL_SIZE, fontweight="bold", fontfamily=FONT)

    cases = [
        (3.4, 5.8, "Register / login"),
        (5.9, 5.8, "Submit transaction"),
        (8.4, 5.8, "View dashboard"),
        (3.4, 4.0, "Monitor queue"),
        (5.9, 4.0, "Explain transaction"),
        (8.4, 4.0, "Resolve dispute"),
        (3.4, 2.2, "Export report"),
        (5.9, 2.2, "Manage users"),
        (8.4, 2.2, "Run simulator"),
    ]
    for x, y, label in cases:
        _box(ax, x, y, 2.1, label, "#EBF5FB", "#2874A6", wrap=14, fontsize=SMALL_SIZE)

    def stick_figure(ax, x, y, name):
        ax.plot(x, y + 0.35, "o", color="#333", markersize=7)
        ax.plot([x, x], [y + 0.2, y - 0.15], color="#333", lw=1.2)
        ax.plot([x - 0.18, x + 0.18], [y - 0.15, y - 0.15], color="#333", lw=1.2)
        ax.plot([x, x - 0.12], [y, y - 0.45], color="#333", lw=1.2)
        ax.plot([x, x + 0.12], [y, y - 0.45], color="#333", lw=1.2)
        ax.text(x, y - 0.65, name, ha="center", fontsize=SMALL_SIZE, fontfamily=FONT)

    stick_figure(ax, 1.2, 5.5, "Cardholder")
    stick_figure(ax, 1.2, 3.5, "Analyst")
    stick_figure(ax, 1.2, 1.5, "Admin")

    _arrow(ax, 1.6, 5.5, 3.4, 6.0)
    _arrow(ax, 1.6, 3.7, 3.4, 4.4)
    _arrow(ax, 1.6, 1.7, 5.9, 2.6)
    return _save(fig, "fig_3_1_use_case.png")


def draw_activity_ingest() -> Path:
    fig, ax = plt.subplots(figsize=(7, 13))
    ax.set_xlim(0, 7)
    ax.set_ylim(0, 15)
    ax.axis("off")
    _title(ax, "Figure 3.2: Activity diagram — transaction ingest")

    cx = 3.5
    y = 14.2
    gap = 0.35

    def oval(text, y_top):
        lines = _wrap(text, 16)
        h = 0.35 + len(lines) * 0.18
        cy = y_top - h / 2
        e = mpatches.Ellipse((cx, cy), 2.6, h, fc="#D5F5E3", ec="#333", lw=1.2)
        ax.add_patch(e)
        ax.text(cx, cy, text, ha="center", va="center", fontsize=SMALL_SIZE, fontfamily=FONT)
        return y_top - h

    def _measure_box(text):
        lines = _wrap(text, 26)
        return PAD * 2 + len(lines) * LINE_H

    def draw_step(text, box_top):
        h = _measure_box(text)
        _box(ax, 1.0, box_top - h, 5.0, text, "#EBF5FB", wrap=26, fontsize=SMALL_SIZE)
        return box_top - h

    def draw_decision(text, top_y):
        lines = _wrap(text, 8)
        radius = 0.38 + len(lines) * 0.07
        cy = top_y - radius
        d = mpatches.RegularPolygon(
            (cx, cy), 4, radius=radius, orientation=0.785, fc="#FCF3CF", ec="#333", lw=1.2
        )
        ax.add_patch(d)
        ty = cy + (len(lines) - 1) * 0.07
        for line in lines:
            ax.text(cx, ty, line, ha="center", va="center", fontsize=6.5, fontfamily=FONT)
            ty -= 0.14
        return cy - radius

    steps = [
        "Receive POST /transactions/ingest",
        "Validate input and JWT",
        "Cardholder: scope to own user_id",
        "Run hybrid scorer\n(rules + behaviour + ML)",
        "Save transaction and decision",
        "Update user profile",
        "Broadcast SSE to dashboards",
    ]

    y_conn = oval("Start", y)
    for text in steps:
        box_top = y_conn - gap
        _arrow(ax, cx, y_conn, cx, box_top)
        y_conn = draw_step(text, box_top)

    dec_top = y_conn - gap
    _arrow(ax, cx, y_conn, cx, dec_top)
    dec_bottom = draw_decision("Score\n>= 60?", dec_top)

    branch_top = dec_bottom - gap
    left_text = "Flag tx\nCreate alert"
    right_text = "Mark approved"
    left_h = _measure_box(left_text)
    right_h = _measure_box(right_text)
    _box(ax, 0.15, branch_top - left_h, 2.5, left_text, "#FADBD8", wrap=12, fontsize=SMALL_SIZE)
    _box(ax, 4.35, branch_top - right_h, 2.5, right_text, "#D5F5E3", wrap=12, fontsize=SMALL_SIZE)
    _arrow(ax, cx - 0.45, dec_bottom, 1.4, branch_top, "Yes")
    _arrow(ax, cx + 0.45, dec_bottom, 5.6, branch_top, "No")

    branch_bottom = branch_top - max(left_h, right_h)
    merge_top = branch_bottom - gap
    audit_text = "Write audit log\nReturn scores to client"
    audit_h = _measure_box(audit_text)
    _box(ax, 1.0, merge_top - audit_h, 5.0, audit_text, "#EBF5FB", wrap=26, fontsize=SMALL_SIZE)
    _arrow(ax, 1.4, branch_top - left_h, cx, merge_top)
    _arrow(ax, 5.6, branch_top - right_h, cx, merge_top)

    end_anchor = merge_top - audit_h - gap
    _arrow(ax, cx, merge_top - audit_h, cx, end_anchor)
    oval("End", end_anchor)

    return _save(fig, "fig_3_2_activity_ingest.png")


def draw_sequence_login() -> Path:
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 9)
    ax.axis("off")
    _title(ax, "Figure 3.3: Sequence diagram — login and dashboard")

    cols = [("User", 1.0), ("Browser", 3.2), ("API", 6.0), ("Database", 9.0)]
    for name, x in cols:
        ax.text(x, 8.3, name, ha="center", fontsize=LABEL_SIZE, fontweight="bold", fontfamily=FONT)
        ax.plot([x, x], [0.8, 7.9], "--", color="#AAA", lw=0.9)

    msgs = [
        (1.0, 3.2, 7.5, "Enter credentials"),
        (3.2, 6.0, 7.1, "POST /auth/login"),
        (6.0, 9.0, 6.7, "Verify password"),
        (9.0, 6.0, 6.4, "User row"),
        (6.0, 3.2, 6.1, "JWT token"),
        (3.2, 1.0, 5.8, "Store session"),
        (3.2, 6.0, 5.5, "GET /auth/me"),
        (6.0, 9.0, 5.2, "Load profile"),
        (6.0, 3.2, 4.9, "User JSON"),
        (3.2, 6.0, 4.6, "GET /dashboard/overview"),
        (6.0, 9.0, 4.3, "Query stats"),
        (9.0, 6.0, 4.0, "Rows"),
        (6.0, 3.2, 3.7, "Dashboard data"),
        (3.2, 1.0, 3.4, "Render UI"),
    ]
    for i, (x1, x2, y, label) in enumerate(msgs):
        _arrow(ax, x1, y, x2, y)
        ax.text(5.5, y + 0.07, f"{i + 1}. {label}", ha="center", fontsize=6.5, fontfamily=FONT, color="#333")
    return _save(fig, "fig_3_3_sequence_login.png")


def draw_class_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(12, 8.5))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8.5)
    ax.axis("off")
    _title(ax, "Figure 3.4: Class diagram — core entities")

    def uml_class(x, y, w, name, attrs):
        attr_lines = []
        for a in attrs:
            attr_lines.extend(_wrap(a, 22))
        h = 0.38 + len(attr_lines) * 0.22 + 0.12
        ax.add_patch(
            FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01", fc="#EBF5FB", ec="#2874A6", lw=1.2)
        )
        ax.text(x + w / 2, y + h - 0.18, name, ha="center", fontweight="bold", fontsize=LABEL_SIZE, fontfamily=FONT)
        ty = y + h - 0.42
        for a in attr_lines:
            ax.text(x + 0.08, ty, a, fontsize=6.5, fontfamily="DejaVu Sans Mono")
            ty -= 0.22
        return h

    specs = [
        (0.2, 5.8, 2.6, "User", ["id", "email", "role", "password_hash"]),
        (3.1, 5.8, 2.6, "Transaction", ["id", "user_id", "amount", "risk_score", "status"]),
        (6.0, 5.8, 2.6, "FraudDecision", ["transaction_id", "rule_score", "ml_score"]),
        (8.9, 5.8, 2.6, "UserProfile", ["user_id", "avg_spend", "tx_count"]),
        (0.2, 2.5, 2.6, "DisputeCase", ["transaction_id", "status", "reason"]),
        (3.1, 2.5, 2.6, "FraudRule", ["name", "enabled", "priority"]),
        (6.0, 2.5, 2.6, "AuditLog", ["action", "entity", "details"]),
        (8.9, 2.5, 2.6, "Notification", ["title", "severity", "read"]),
    ]
    for x, y, w, name, attrs in specs:
        uml_class(x, y, w, name, attrs)

    ax.annotate("", xy=(3.1, 6.5), xytext=(2.8, 6.5), arrowprops=dict(arrowstyle="-", lw=1))
    ax.text(2.95, 6.65, "1..*", ha="center", fontsize=SMALL_SIZE, fontfamily=FONT)
    ax.annotate("", xy=(6.0, 6.5), xytext=(5.7, 6.5), arrowprops=dict(arrowstyle="-", lw=1))
    ax.text(5.85, 6.65, "1", ha="center", fontsize=SMALL_SIZE, fontfamily=FONT)
    ax.annotate("", xy=(3.1, 3.2), xytext=(4.5, 5.8), arrowprops=dict(arrowstyle="-", lw=0.9, linestyle="dashed"))
    ax.text(3.5, 4.6, "0..1", fontsize=SMALL_SIZE, fontfamily=FONT)
    return _save(fig, "fig_3_4_class_diagram.png")


def draw_er_diagram() -> Path:
    fig, ax = plt.subplots(figsize=(12, 8.5))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8.5)
    ax.axis("off")
    _title(ax, "Figure 3.5: Entity-relationship diagram")

    entities = [
        (0.3, 6.0, "USER", ["PK id", "email", "role"]),
        (3.2, 6.0, "TRANSACTION", ["PK id", "FK user_id", "amount", "status"]),
        (6.4, 6.0, "FRAUD_DECISION", ["PK id", "FK tx_id", "ml_score"]),
        (9.0, 6.0, "USER_PROFILE", ["PK id", "FK user_id"]),
        (1.5, 2.5, "DISPUTE", ["PK id", "FK tx_id", "status"]),
        (4.8, 2.5, "FRAUD_RULE", ["PK id", "name", "enabled"]),
        (7.5, 2.5, "AUDIT_LOG", ["PK id", "action"]),
        (9.5, 2.5, "ALERT", ["PK id", "FK tx_id"]),
    ]
    for x, y, name, attrs in entities:
        body = name + "\n" + "\n".join(attrs)
        _box(ax, x, y, 2.4, body, "#FEF9E7", "#B7950B", wrap=16, fontsize=SMALL_SIZE)

    _arrow(ax, 2.7, 6.5, 3.2, 6.5, "1:N")
    _arrow(ax, 5.6, 6.5, 6.4, 6.5, "1:1")
    _arrow(ax, 2.0, 6.0, 9.8, 6.5, "1:1")
    _arrow(ax, 4.5, 6.0, 2.5, 3.5, "0..1")
    return _save(fig, "fig_3_5_er_diagram.png")


def draw_fraud_flowchart() -> Path:
    fig, ax = plt.subplots(figsize=(7, 10))
    ax.set_xlim(0, 7)
    ax.set_ylim(0, 11)
    ax.axis("off")
    _title(ax, "Figure 4.1: Fraud scoring flowchart")

    cx = 3.5
    y = 10.2
    steps = [
        "Input: user, amount, location",
        "Rule engine",
        "Behaviour engine",
        "ML probability",
        "Sum scores (cap at 100)",
        "Assign risk label",
        "Store reasons",
    ]
    for i, text in enumerate(steps):
        h = _box(ax, 1.2, y - 0.75, 4.6, text, "#EBF5FB", wrap=24, fontsize=SMALL_SIZE)
        if i == 0:
            y -= h + 0.25
            continue
        _arrow(ax, cx, y + 0.05, cx, y - 0.75 + h + 0.05)
        y -= h + 0.25

    e = mpatches.Ellipse((cx, y - 0.3), 3.0, 0.55, fc="#D5F5E3", ec="#333", lw=1.2)
    ax.add_patch(e)
    ax.text(cx, y - 0.3, "Return result", ha="center", va="center", fontsize=SMALL_SIZE, fontfamily=FONT)
    _arrow(ax, cx, y + 0.05, cx, y)
    return _save(fig, "fig_4_1_fraud_flowchart.png")


def draw_agile_process() -> Path:
    fig, ax = plt.subplots(figsize=(11, 3.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 3.5)
    ax.axis("off")
    _title(ax, "Figure 3.6: Development approach (iterative)")

    phases = ["Plan", "Design", "Build", "Test", "Demo"]
    x = 0.4
    for i, p in enumerate(phases):
        w = 1.7
        _box(ax, x, 1.4, w, p, "#D6EAF8", wrap=10)
        if i < len(phases) - 1:
            _arrow(ax, x + w, 1.85, x + w + 0.25, 1.85)
        x += w + 0.25

    ax.annotate("", xy=(10.5, 0.7), xytext=(0.5, 0.7), arrowprops=dict(arrowstyle="-|>", color="#C0392B", lw=1.2))
    ax.text(5.5, 0.45, "Feedback from supervisor and testing", ha="center", fontsize=SMALL_SIZE, color="#C0392B", fontfamily=FONT)
    return _save(fig, "fig_3_6_agile_process.png")


def draw_ui_wireframe() -> Path:
    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    _title(ax, "Figure 3.7: Dashboard wireframe")

    _box(ax, 0.2, 0.3, 2.0, "Sidebar\nOverview\nMonitoring\nCapture\nReports", "#E8F8F5", "#117A65", wrap=12, fontsize=SMALL_SIZE)
    _box(ax, 2.4, 5.2, 8.3, "Header — search, alerts, account", "#F4F6F7", wrap=30, fontsize=SMALL_SIZE)
    for i, x in enumerate([2.4, 4.5, 6.6, 8.5]):
        _box(ax, x, 3.9, 1.8, f"KPI {i + 1}", "#D6EAF8", wrap=8)
    _box(ax, 2.4, 0.5, 5.5, "Charts area", "#FCF3CF", wrap=12)
    _box(ax, 8.1, 0.5, 2.6, "Activity feed", "#FADBD8", wrap=12)
    return _save(fig, "fig_3_7_ui_wireframe.png")


def draw_data_flow() -> Path:
    fig, ax = plt.subplots(figsize=(11, 4))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 4)
    ax.axis("off")
    _title(ax, "Figure 2.2: Transaction data flow")

    labels = ["Capture", "Ingest", "Scoring", "Database", "Dashboard", "Review"]
    x = 0.3
    for i, label in enumerate(labels):
        w = 1.55
        _box(ax, x, 1.6, w, label, "#EBF5FB", wrap=10)
        if i < len(labels) - 1:
            _arrow(ax, x + w, 2.05, x + w + 0.2, 2.05)
        x += w + 0.2
    ax.text(5.5, 0.9, "Alerts and audit log written at ingest step", ha="center", fontsize=SMALL_SIZE, fontfamily=FONT, style="italic")
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
    for k, p in generate_all_diagrams().items():
        print(f"{k}: {p}")
