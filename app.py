# app.py
# This is the ENTRY POINT of the application.
# It creates the Flask app, configures it, and starts the server.

import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from models import db, User
from werkzeug.security import generate_password_hash
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

    # Database Configuration - Environment-based
    # Supports both environment variable and automatic environment detection
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # Get environment
    env = os.environ.get('FLASK_ENV', 'development')
    
    # Check if DATABASE_URL is set in environment
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Use DATABASE_URL from environment (production or custom)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print(f"📁 Database: Using DATABASE_URL (external/managed database)")
        if 'postgresql' in database_url.lower():
            print(f"   Type: PostgreSQL")
        elif 'mysql' in database_url.lower():
            print(f"   Type: MySQL")
        else:
            print(f"   Type: {database_url.split(':')[0]}")
    else:
        # Auto-detect environment and use appropriate database
        if env == 'production':
            # Production without DATABASE_URL: ERROR
            print(f"⚠️  WARNING: Production mode but no DATABASE_URL set!")
            print(f"   Using local SQLite (NOT RECOMMENDED for production)")
            print(f"   Please set DATABASE_URL to use PostgreSQL or managed database")
            db_file = 'production.db'
        else:
            # Development/Local: Use assets.db (development data)
            db_file = 'assets.db'
        
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, db_file)
        print(f"📁 Database: {db_file}")
        print(f"   Type: SQLite (local file)")
    
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

    # ── Create tables and seed sample data ────────────────────────────────────
    with app.app_context():
        db.create_all()          # creates all tables if they don't exist
        
        # Print environment information
        env = os.environ.get('FLASK_ENV', 'development')
        print(f"🌍 Environment: {env}")
        
        # Only seed in development, never in production
        if env == 'production':
            print("⚠️  PRODUCTION MODE: Seed data is DISABLED")
            print("   No sample assets will be created")
            print("   Use admin panel to add real production data")
        else:
            seed_data()  # insert sample data for testing (development only)

    return app

# ── Seed function: inserts demo data so you can test immediately ───────────────
def seed_data():
    """
    Seed sample data for DEVELOPMENT ONLY.
    This function is NEVER called in production (FLASK_ENV=production).
    """
    from models import User, Asset, ActivityLog
    from datetime import date, datetime

    # Only seed if the database is empty
    if User.query.first():
        print("✓ Database already contains data, skipping seed")
        return

    print("🌱 Seeding sample data (DEVELOPMENT ONLY)...")

    # Create admin user (password: admin123)
    admin = User(
        username='admin',
        email='admin@company.com',
        password_hash=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)

    # Create sample assets
    assets_data = [
        ('EMP001', 'Alice Johnson', '+1-555-0101', 'Dell Laptop XPS 15', 'Laptop', 'SN-DELL-001', 'XPS 15 9520', 'Windows 11', '22H2', '16GB', 'Bangalore Office', 'INV-2023-001', date(2023,1,15), date(2026,1,15), 'CHG-DELL-001', '', date(2023,1,20), '', 'Assigned for development', 'Assigned'),
        ('EMP002', 'Bob Williams', '+1-555-0102', 'HP EliteBook 840', 'Laptop', 'SN-HP-002', 'EliteBook 840 G9', 'Windows 11', '23H2', '32GB', 'Mumbai Office', 'INV-2023-002', date(2023,3,10), date(2026,3,10), 'CHG-HP-002', '', date(2023,3,15), '', 'Marketing team', 'Assigned'),
        ('', '', '', 'Lenovo ThinkPad X1', 'Laptop', 'SN-LEN-003', 'ThinkPad X1 Carbon Gen 10', 'Ubuntu 22.04', '22.04 LTS', '16GB', 'Delhi Office', 'INV-2023-003', date(2023,5,5), date(2026,5,5), 'CHG-LEN-003', 'EMP005', date(2023,5,10), 'SN-OLD-001', 'Available in stock', 'Available'),
        ('EMP004', 'David Brown', '+1-555-0104', 'Apple MacBook Pro', 'Laptop', 'SN-APL-004', 'MacBook Pro 14" M2', 'macOS Ventura', '13.2', '16GB', 'Hyderabad Office', 'INV-2023-004', date(2023,7,12), date(2026,7,12), 'CHG-APL-004', '', date(2023,7,20), '', 'Finance department', 'Assigned'),
        ('', '', '', 'Dell Monitor 27"', 'Monitor', 'SN-MON-005', 'UltraSharp U2723DE', '', '', '', 'Bangalore Office', 'INV-2022-005', date(2022,6,20), date(2025,6,20), '', '', date(2022,6,25), '', 'Spare monitor', 'Available'),
    ]
    
    for a in assets_data:
        obj = Asset(
            emp_id=a[0], employee_name=a[1], mobile_number=a[2],
            asset_name=a[3], category=a[4], serial_number=a[5],
            model_name=a[6], os=a[7], version=a[8], ram=a[9],
            location=a[10], invoice_number=a[11], invoice_date=a[12],
            warranty_date=a[13], charger_serial=a[14], old_user=a[15],
            date=a[16], old_device=a[17], comments=a[18], status=a[19]
        )
        db.session.add(obj)

    # Create activity logs
    logs = [
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added Dell Laptop XPS 15'),
        ActivityLog(user='admin', action='ASSIGN', module='Asset', description='Assigned Dell Laptop to Alice Johnson'),
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added HP EliteBook 840'),
    ]
    db.session.add_all(logs)
    db.session.commit()
    print("✅ Sample data seeded successfully!")

# ── Run the app ────────────────────────────────────────────────────────────────
app = create_app()

if __name__ == '__main__':
    # Serve on port 3000 - Frontend and Backend unified
    # debug=True means the server restarts when you change code (development only)
    app.run(debug=True, host='0.0.0.0', port=3000)
