"""
Test fixture for import categorization.
Contains examples of stdlib, third-party, and local imports.

@component ImportTest
"""

# Standard library imports
import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict
import datetime
from dataclasses import dataclass

# Third-party imports (examples - won't actually be installed)
import requests
import numpy as np
from flask import Flask, request
from django.db import models
import pytest

# Local relative imports
from . import utils
from .models import User
from ..services import payment_service
from ...core.db import connection

# Local absolute imports (treated as third-party in absence of package info)
from my_package.utils import helper
from my_package.models.user import UserModel


def process_data(data: Dict) -> List:
    """Process some data using various imports."""
    # Use stdlib
    result = json.dumps(data)
    path = Path(result)
    
    # Use third-party (example)
    # response = requests.get("https://api.example.com")
    
    # Use local
    # user = User.from_dict(data)
    
    return []
