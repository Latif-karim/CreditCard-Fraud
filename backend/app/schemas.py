import re

from marshmallow import Schema, ValidationError, fields, validate

# Accept demo TLDs (e.g. user@fraudshield.demo) that strict Email() rejects.
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class LenientEmail(fields.String):
    """Email field that allows non-IANA TLDs used in demo accounts."""

    default_error_messages = {"invalid": "Not a valid email address."}

    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        if value is None:
            return value
        value = str(value).strip().lower()
        if not _EMAIL_RE.match(value):
            raise ValidationError(self.error_messages["invalid"])
        return value


class RegisterSchema(Schema):
    email = LenientEmail(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    role = fields.String(load_default="user", validate=validate.OneOf(["user", "analyst"]))
    full_name = fields.String(load_default="")


class LoginSchema(Schema):
    email = LenientEmail(required=True)
    password = fields.String(required=True)


class TransactionIngestSchema(Schema):
    user_id = fields.Integer(required=False, allow_none=True)
    amount = fields.Float(required=True)
    location = fields.String(required=True)
    merchant = fields.String(load_default="")
    card_last4 = fields.String(load_default="")
    country = fields.String(load_default="")
    card_type = fields.String(load_default="")
    merchant_category = fields.String(load_default="")
    ip_address = fields.String(load_default="")
    device_id = fields.String(load_default="")


class DecisionSchema(Schema):
    rule_score = fields.Float()
    behavior_score = fields.Float()
    ml_score = fields.Float()
    ml_probability = fields.Float()
    reasons = fields.List(fields.String())
    final_label = fields.String()


class TransactionOutSchema(Schema):
    id = fields.Integer()
    user_id = fields.Integer()
    amount = fields.Float()
    location = fields.String()
    status = fields.String()
    risk_score = fields.Float()
    created_at = fields.DateTime()
