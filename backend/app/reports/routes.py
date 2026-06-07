import csv
import io
import json
from datetime import datetime

from flask import Blueprint, Response, jsonify
from flask_jwt_extended import jwt_required

from ..models import AuditLog, Transaction
from ..services.dashboard_stats import compute_overview_stats
from ..services.rbac import is_staff, scope_transactions
from ..services.seed_data import seed_all

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")


@reports_bp.get("/transactions.csv")
@jwt_required()
def export_transactions_csv():
    rows = scope_transactions(Transaction.query).order_by(Transaction.created_at.desc()).limit(5000).all()
    buf = io.StringIO()
    # UTF-8 BOM helps Excel open the file correctly on Windows
    buf.write("\ufeff")
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "user_id",
            "amount",
            "location",
            "country",
            "merchant",
            "merchant_category",
            "card_last4",
            "card_type",
            "status",
            "risk_score",
            "confidence",
            "created_at",
        ]
    )
    for tx in rows:
        writer.writerow(
            [
                tx.id,
                tx.user_id,
                tx.amount,
                tx.location,
                tx.country or "",
                tx.merchant or "",
                tx.merchant_category or "",
                tx.card_last4 or "",
                tx.card_type or "",
                tx.status,
                tx.risk_score,
                tx.confidence if tx.confidence is not None else "",
                tx.created_at.isoformat() if tx.created_at else "",
            ]
        )
    body = buf.getvalue()
    return Response(
        body,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=fraudshield-transactions.csv"},
    )


@reports_bp.get("/summary.json")
@jwt_required()
def summary_json():
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    stats = compute_overview_stats()
    return (
        jsonify(
            {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                **stats,
                "total_volume_usd": stats["total_volume"],
            }
        ),
        200,
    )


@reports_bp.get("/audit-export.json")
@jwt_required()
def audit_export():
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(500).all()
    payload = [
        {
            "id": l.id,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]
    return Response(
        json.dumps(payload, indent=2),
        mimetype="application/json",
        headers={"Content-Disposition": "attachment; filename=fraudshield-audit.json"},
    )


@reports_bp.get("/summary.pdf")
@jwt_required()
def summary_pdf():
    if not is_staff():
        return jsonify({"error": "Staff role required"}), 403
    try:
        from fpdf import FPDF
    except ImportError:
        return jsonify({"error": "PDF export is temporarily unavailable. Contact your administrator."}), 503

    stats = compute_overview_stats()
    total = stats["total_transactions"]
    flagged = stats["flagged_transactions"]
    approved = stats["approved_transactions"]
    volume = stats["total_volume"]
    fraud_rate = stats["fraud_rate"] * 100

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "FraudShield - Fraud Summary Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(
        0,
        6,
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Key metrics", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    for line in [
        f"Total transactions monitored: {total:,}",
        f"Flagged (investigation queue): {flagged:,}",
        f"Auto-approved: {approved:,}",
        f"Fraud rate: {fraud_rate:.2f}%",
        f"Total volume (USD): ${volume:,.2f}",
    ]:
        pdf.cell(0, 7, line, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        0,
        5,
        "Confidential — FraudShield fraud summary report. For authorized use only.",
    )

    raw = pdf.output()
    if isinstance(raw, str):
        raw = raw.encode("latin-1", errors="replace")
    elif isinstance(raw, bytearray):
        raw = bytes(raw)

    return Response(
        raw,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=fraudshield-summary.pdf"},
    )


@reports_bp.post("/seed")
@jwt_required()
def force_seed():
    if not is_staff():
        return jsonify({"error": "Forbidden"}), 403
    payload = seed_all(min_transactions=80)
    return jsonify({"message": "ok", **payload}), 200
