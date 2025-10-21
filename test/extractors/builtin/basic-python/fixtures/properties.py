"""Property extraction test fixture.

Demonstrates various property patterns in Python.

@module PropertyDemo
"""

from dataclasses import dataclass
from typing import Optional


class User:
    """User class with properties and class variables.
    
    Demonstrates:
    - Class variables with type hints
    - @property decorators (getter/setter)
    - Read-only properties
    """
    
    # Class variable with type hint
    max_login_attempts: int = 5
    default_role: str = 'user'
    
    def __init__(self, first_name: str, last_name: str, email: str):
        """Initialize user.
        
        Args:
            first_name: User's first name
            last_name: User's last name
            email: User's email address
        """
        self._first_name = first_name
        self._last_name = last_name
        self._email = email
        self._login_count = 0
    
    @property
    def full_name(self) -> str:
        """User's full name (read-only).
        
        Returns:
            str: Full name combining first and last name
        """
        return f"{self._first_name} {self._last_name}"
    
    @property
    def email(self) -> str:
        """User's email address.
        
        Returns:
            str: Email address
        """
        return self._email
    
    @email.setter
    def email(self, value: str) -> None:
        """Set user's email address.
        
        Args:
            value: New email address
        
        Raises:
            ValueError: If email is invalid
        """
        if '@' not in value:
            raise ValueError("Invalid email")
        self._email = value
    
    @property
    def login_count(self) -> int:
        """Number of times user has logged in.
        
        Returns:
            int: Login count
        """
        return self._login_count
    
    @login_count.setter
    def login_count(self, value: int) -> None:
        """Set login count.
        
        Args:
            value: New login count
        """
        self._login_count = value
    
    @login_count.deleter
    def login_count(self) -> None:
        """Reset login count to zero."""
        self._login_count = 0


@dataclass
class Product:
    """Product with dataclass fields.
    
    Demonstrates dataclass field extraction.
    """
    
    id: str
    name: str
    price: float
    description: Optional[str] = None
    in_stock: bool = True
    
    @property
    def display_price(self) -> str:
        """Formatted price for display.
        
        Returns:
            str: Price formatted as currency
        """
        return f"${self.price:.2f}"


class Rectangle:
    """Rectangle with computed properties."""
    
    def __init__(self, width: float, height: float):
        """Initialize rectangle.
        
        Args:
            width: Rectangle width
            height: Rectangle height
        """
        self._width = width
        self._height = height
    
    @property
    def width(self) -> float:
        """Rectangle width."""
        return self._width
    
    @width.setter
    def width(self, value: float) -> None:
        """Set rectangle width."""
        if value <= 0:
            raise ValueError("Width must be positive")
        self._width = value
    
    @property
    def height(self) -> float:
        """Rectangle height."""
        return self._height
    
    @height.setter
    def height(self, value: float) -> None:
        """Set rectangle height."""
        if value <= 0:
            raise ValueError("Height must be positive")
        self._height = value
    
    @property
    def area(self) -> float:
        """Rectangle area (read-only).
        
        Returns:
            float: Area calculated as width * height
        """
        return self._width * self._height
    
    @property
    def perimeter(self) -> float:
        """Rectangle perimeter (read-only).
        
        Returns:
            float: Perimeter calculated as 2 * (width + height)
        """
        return 2 * (self._width + self._height)
