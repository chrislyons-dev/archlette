"""Type extraction test fixture.

Demonstrates Python type definitions including TypeAlias, TypedDict, Protocol, Enum, NewType.

@module TypeDefinitions
"""

from typing import TypedDict, Protocol, NewType, TypeAlias, Optional, Dict, List
from enum import Enum, IntEnum, auto


# Type Aliases
UserId = NewType('UserId', str)
ProductId = NewType('ProductId', int)

# Simple type alias (PEP 613 style)
UserName: TypeAlias = str
EmailAddress: TypeAlias = str

# Complex type aliases
ConfigDict: TypeAlias = Dict[str, str | int | bool]
# Forward reference for demonstration (actual User class would be defined elsewhere)
UserList: TypeAlias = List['UserProfile']  # Using UserProfile as a stand-in


# TypedDict definitions
class UserProfile(TypedDict):
    """User profile data structure.
    
    TypedDict for structured user data with type checking.
    """
    id: str
    username: str
    email: str
    age: int
    is_active: bool


class PaymentData(TypedDict):
    """Payment transaction data."""
    amount: int
    currency: str
    customer_id: str
    metadata: Optional[Dict[str, str]]


# Protocol definitions
class Processor(Protocol):
    """Payment processor protocol.
    
    Defines the interface for payment processors.
    """
    
    def process(self, amount: int) -> bool:
        """Process payment."""
        ...
    
    def refund(self, transaction_id: str) -> bool:
        """Refund payment."""
        ...


class Validator(Protocol):
    """Data validator protocol."""
    
    def validate(self, data: Dict) -> bool:
        """Validate data."""
        ...
    
    async def validate_async(self, data: Dict) -> bool:
        """Validate data asynchronously."""
        ...


# Enum definitions
class PaymentStatus(Enum):
    """Payment status enumeration.
    
    Represents the various states a payment can be in.
    """
    PENDING = auto()
    PROCESSING = auto()
    COMPLETED = auto()
    FAILED = auto()
    REFUNDED = auto()


class UserRole(Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class HttpStatus(IntEnum):
    """HTTP status codes."""
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    NOT_FOUND = 404
    SERVER_ERROR = 500


# Usage example
def create_user(user_id: UserId, username: UserName, email: EmailAddress) -> UserProfile:
    """Create a user profile.
    
    Args:
        user_id: Unique user identifier
        username: User's username
        email: User's email address
    
    Returns:
        UserProfile: Complete user profile data
    """
    return {
        'id': user_id,
        'username': username,
        'email': email,
        'age': 0,
        'is_active': True,
    }


def process_payment(processor: Processor, amount: int) -> PaymentStatus:
    """Process a payment using a processor.
    
    Args:
        processor: Payment processor implementing Processor protocol
        amount: Payment amount in cents
    
    Returns:
        PaymentStatus: Result of payment processing
    """
    if processor.process(amount):
        return PaymentStatus.COMPLETED
    return PaymentStatus.FAILED
