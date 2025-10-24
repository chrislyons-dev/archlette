"""Payment processing service with Google-style docstrings.

This module demonstrates Google-style docstring parsing.

@module PaymentProcessor
@actor Customer {Person} {in} End user making purchases
@uses Database Stores payment records
"""

from typing import Optional
from dataclasses import dataclass


@dataclass
class PaymentRequest:
    """Payment request data.
    
    Attributes:
        amount: Payment amount in cents (must be positive)
        currency: ISO 4217 currency code
        customer_id: Unique customer identifier
        description: Optional payment description
    """
    amount: int
    currency: str
    customer_id: str
    description: Optional[str] = None


class PaymentProcessor:
    """Process payment transactions.
    
    This class handles payment processing including validation,
    authorization, and settlement.
    """
    
    def __init__(self, api_key: str):
        """Initialize payment processor.
        
        Args:
            api_key: API key for payment gateway authentication
        
        Raises:
            ValueError: If API key is empty or invalid
        """
        self.api_key = api_key
    
    def validate_payment(self, request: PaymentRequest) -> bool:
        """Validate payment request before processing.
        
        Performs validation checks on the payment request including:
        - Amount is positive
        - Currency is valid ISO code
        - Customer exists in database
        
        Args:
            request: The payment request to validate
        
        Returns:
            bool: True if payment is valid, False otherwise
        
        Raises:
            ValueError: If request is None or invalid
        """
        return request.amount > 0
    
    async def process_payment(
        self,
        request: PaymentRequest,
        timeout: int = 30
    ) -> dict:
        """Process a payment request asynchronously.
        
        Args:
            request: Payment request containing transaction details
            timeout: Maximum time in seconds to wait for response (default: 30)
        
        Returns:
            dict: Payment result with keys:
                - transaction_id (str): Unique transaction identifier
                - status (str): Payment status ('success', 'failed', 'pending')
                - message (str): Human-readable status message
        
        Raises:
            PaymentError: If payment processing fails
            TimeoutError: If processing exceeds timeout duration
        
        Example:
            >>> processor = PaymentProcessor('api_key')
            >>> request = PaymentRequest(1000, 'USD', 'cust_123')
            >>> result = await processor.process_payment(request)
            >>> print(result['status'])
            'success'
        """
        return {'transaction_id': '123', 'status': 'success', 'message': 'Payment processed'}
    
    @staticmethod
    def format_amount(cents: int, currency: str = 'USD') -> str:
        """Format amount for display.
        
        Args:
            cents: Amount in cents
            currency: Currency code for formatting
        
        Returns:
            str: Formatted amount string (e.g., '$10.00')
        """
        return f"${cents / 100:.2f}"
    
    @classmethod
    def from_config(cls, config: dict) -> 'PaymentProcessor':
        """Create processor from configuration dictionary.
        
        Args:
            config: Configuration dict with 'api_key' field
        
        Returns:
            PaymentProcessor: New processor instance
        
        Raises:
            KeyError: If 'api_key' is missing from config
        """
        return cls(config['api_key'])


def calculate_tax(amount: int, rate: float = 0.08) -> int:
    """Calculate tax on payment amount.
    
    Args:
        amount: Payment amount in cents
        rate: Tax rate as decimal (default: 0.08 for 8%)
    
    Returns:
        int: Tax amount in cents, rounded to nearest cent
    
    Example:
        >>> calculate_tax(1000, 0.08)
        80
    """
    return int(amount * rate)
