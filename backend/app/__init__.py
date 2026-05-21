from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from marshmallow import ValidationError

from .admin.routes import admin_bp
from .alerts.routes import alerts_bp
from .auth.oauth_routes import init_oauth, oauth_bp
from .auth.routes import auth_bp
from .config import Config
from .dashboard.routes import dashboard_bp
from .extensions import bcrypt, db, jwt
from .fraud.routes import fraud_bp
from .reports.routes import reports_bp
from .transactions.routes import transactions_bp
from .users.routes import users_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)
    CORS(app, resources={r"/*": {"origins": "*"}})
    init_oauth(app)

    @app.errorhandler(ValidationError)
    def handle_validation_error(err):
        return jsonify({"error": "Validation failed", "details": err.messages}), 400

    app.register_blueprint(auth_bp)
    app.register_blueprint(oauth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(fraud_bp)
    app.register_blueprint(users_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    with app.app_context():
        from .services.seed_data import seed_all

        try:
            seed_all(min_transactions=80)
        except Exception:
            pass

    return app
