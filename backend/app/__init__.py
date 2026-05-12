from flask import Flask, jsonify
from flask_migrate import Migrate

from .auth.routes import auth_bp
from .config import Config
from .dashboard.routes import dashboard_bp
from .extensions import bcrypt, db, jwt
from .transactions.routes import transactions_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app
from flask import Flask, jsonify
from flask_migrate import Migrate

from .auth.routes import auth_bp
from .config import Config
from .dashboard.routes import dashboard_bp
from .extensions import bcrypt, db, jwt
from .transactions.routes import transactions_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    Migrate(app, db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app
