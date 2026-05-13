import csv
import io
import json
from datetime import datetime

from flask import Blueprint, Response, jsonify
from flask_jwt_extended import jwt_required

from ..models import AuditLog, Transaction

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")


@reports_bp.get("/transactions.csv")
@jwt_required()
def export_transactions_csv():
    rows = Transaction.query.order_by(Transaction.created_at.desc()).limit(5000).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "id",
            "user_id",
            "amount",
            "location",
            "country",
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
                tx.status,
                tx.risk_score,
                tx.confidence or "",
                tx.created_at.isoformat(),
            ]
        )
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@reports_bp.get("/summary.json")
@jwt_required()
def summary_json():
    total = Transaction.query.count()
    flagged = Transaction.query.filter_by(status="flagged").count()
    return (
        jsonify(
            {
                "generated_at": datetime.utcnow().isoformat(),
                "total_transactions": total,
                "flagged": flagged,
                "fraud_rate": (flagged / total) if total else 0,
            }
        ),
        200,
    )


@reports_bp.get("/audit-export.json")
@jwt_required()
def audit_export():
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
    return Response(json.dumps(payload, indent=2), mimetype="application/json")


@reports_bp.get("/summary.pdf")
@jwt_required()
def summary_pdf_stub():
    return (
        jsonify(
            {
                "format": "pdf",
                "status": "stub",
                "message": "PDF generation is not wired yet. Use CSV export or summary.json for now.",
            }
        ),
        200,
    )
