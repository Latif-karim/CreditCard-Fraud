from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    role = fields.String(load_default="user", validate=validate.OneOf(["user", "analyst"]))
    full_name = fields.String(load_default="")


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class TransactionIngestSchema(Schema):
    user_id = fields.Integer(required=True)
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
