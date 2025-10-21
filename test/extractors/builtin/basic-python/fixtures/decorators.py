"""
Test fixture for decorator argument extraction.
Contains examples of decorators with various argument types.

@component DecoratorDemo
"""

from dataclasses import dataclass
from functools import lru_cache, wraps


# Flask-style route decorators
class app:
    """Mock Flask app for demonstration."""
    
    @staticmethod
    def route(path, methods=None):
        """Route decorator."""
        def decorator(f):
            return f
        return decorator
    
    @staticmethod
    def before_request(f):
        """Before request decorator."""
        return f


# Django-style decorators
def require_http_methods(methods):
    """Mock Django decorator."""
    def decorator(f):
        return f
    return decorator


# Dataclass with arguments
@dataclass(frozen=True, order=True)
class ImmutableUser:
    """Immutable user data."""
    username: str
    email: str
    age: int


# Simple dataclass
@dataclass
class MutableUser:
    """Mutable user data."""
    username: str
    email: str


# Function with multiple decorator arguments
@app.route('/api/users', methods=['GET', 'POST'])
def users_endpoint():
    """Handle user API requests."""
    pass


@app.route('/api/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
def user_detail_endpoint(user_id):
    """Handle individual user requests."""
    pass


# Django-style decorator
@require_http_methods(["GET", "HEAD"])
def index_view():
    """Index view."""
    pass


# lru_cache decorator with arguments
@lru_cache(maxsize=128, typed=True)
def expensive_computation(n: int) -> int:
    """Compute something expensive."""
    return n * n


# Custom decorator with multiple arguments
def retry(max_attempts=3, delay=1.0, backoff=2.0):
    """Retry decorator."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapper
    return decorator


@retry(max_attempts=5, delay=0.5)
async def fetch_data():
    """Fetch data with retries."""
    pass


# Multiple decorators
@app.before_request
@retry(max_attempts=3)
def auth_middleware():
    """Authentication middleware."""
    pass
