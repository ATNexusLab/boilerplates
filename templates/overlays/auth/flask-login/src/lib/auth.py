from flask_login import LoginManager

login_manager = LoginManager()


def init_auth(app):
    """Initialize Flask-Login with the Flask app."""
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"


@login_manager.user_loader
def load_user(user_id):
    # TODO: Replace with your user model lookup
    # from src.db.models import User
    # return User.query.get(int(user_id))
    return None
