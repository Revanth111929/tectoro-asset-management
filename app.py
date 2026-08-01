# app.py
# This is the ENTRY POINT of the application.
# It creates the Flask app, configures it, and starts the server.

import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from models import db, User
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Create the Flask application ──────────────────────────────────────────────
def create_app():
    app = Flask(__name__)
    from flask_cors import CORS
    CORS(app)  # Enable CORS for React frontend

    # Secret key is used to sign session cookies (keep this secret in production!)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'assetmgmt-super-secret-2024')

    # Database Configuration - strictly isolated per environment.
    # APP_ENV must be 'office' (local office app -> office_assets.db) or
    # 'render' (public Render deployment -> demo_assets.db). No default,
    # no fallback between the two — see db_config.py.
    basedir = os.path.abspath(os.path.dirname(__file__))

    from db_config import resolve_database_uri, is_render_env, DatabaseConfigError
    try:
        db_uri, app_env = resolve_database_uri(basedir)
    except DatabaseConfigError as exc:
        raise SystemExit(str(exc))

    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['APP_ENV'] = app_env
    print(f"🌍 APP_ENV: {app_env}")
    print(f"📁 Database: {db_uri}")

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False   # saves memory

    # Folder where uploaded QR code images will be stored
    app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'static', 'qrcodes')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Initialise extensions ──────────────────────────────────────────────────
    db.init_app(app)
    CORS(app)          # connect SQLAlchemy to this app

    # Flask-Login manages user sessions (who is logged in)
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'          # redirect here if not logged in
    login_manager.login_message_category = 'warning'

    # Flask-Login calls this function to load a user from the database by id
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ── Register Blueprints (route groups) ────────────────────────────────────
    from routes import auth_bp, main_bp, asset_bp, report_bp, api_bp
    from api_lifecycle import lifecycle_bp
    from flask import send_from_directory

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # Don't intercept API routes or static files
        if path and (path.startswith('api/') or path.startswith('static/qrcodes')):
            from flask import abort
            abort(404)
        build_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'build')
        if path and os.path.exists(os.path.join(build_dir, path)):
            return send_from_directory(build_dir, path)
        return send_from_directory(build_dir, 'index.html')

    @app.route('/static/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'static', 'js'), filename)

    @app.route('/static/css/<path:filename>')
    def serve_css(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'static', 'css'), filename)

    @app.route('/static/media/<path:filename>')
    def serve_media(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'static', 'media'), filename)

    app.register_blueprint(api_bp)
    app.register_blueprint(lifecycle_bp)  # Lifecycle tracking API

    # ── Create tables and seed demo data (public Render deployment only) ──────
    with app.app_context():
        db.create_all()          # creates all tables if they don't exist

        if is_render_env(app_env):
            from demo_seed import seed_demo_data
            if seed_demo_data(db):
                print("🌱 Demo database was empty — seeded with synthetic demo data")
            else:
                print("✓ Demo database already has data — skipped seeding")
        else:
            print("🔒 Office database — seeding never runs, real office data only")

    return app

# ── Run the app ────────────────────────────────────────────────────────────────
app = create_app()

if __name__ == '__main__':
    # Serve on port 3000 - Frontend and Backend unified
    # debug=True means the server restarts when you change code (development only)
    app.run(debug=True, host='0.0.0.0', port=3000)
