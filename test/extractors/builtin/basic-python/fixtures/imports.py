"""
Test fixture for import categorization.
Contains examples of stdlib, third-party, and local imports.

@component ImportTest
"""

# ruff: noqa: F401
# pyright: reportUnusedImport=false
# All imports intentionally unused - this is a test fixture for import categorization

# Standard library imports
import os
import sys
import json
from pathlib import Path
from typing import Dict, List
from collections import defaultdict
import datetime
from dataclasses import dataclass

# Third-party imports (examples - won't actually be installed)
import requests  # type: ignore[import-not-found, import-untyped]
import numpy as np  # type: ignore[import-not-found]
from flask import Flask, request  # type: ignore[import-not-found]
from django.db import models  # type: ignore[import-not-found]
import pytest  # type: ignore[import-not-found]

# Local relative imports (will fail - no parent module, but tests import extraction)
# Wrapped in try/except to avoid runtime errors during direct execution
# The AST parser will still extract these imports for testing
try:
    from .models import User  # type: ignore[import-not-found]  # pyright: ignore[reportGeneralTypeIssues]
    from ..services import payment_service  # type: ignore[import-not-found,misc]  # pyright: ignore[reportGeneralTypeIssues]
    from ...core.db import connection  # type: ignore[import-not-found,misc]  # pyright: ignore[reportGeneralTypeIssues]
except ImportError:
    pass  # Expected - no parent module when run as standalone file

# Local absolute imports (treated as third-party in absence of package info)
from my_package.utils import helper  # type: ignore[import-not-found]
from my_package.models.user import UserModel  # type: ignore[import-not-found]


def process_data(data: Dict) -> List:
    """Process some data using various imports.
    
    This function demonstrates that imports are parsed correctly.
    The actual import objects are not used here.
    """
    # Use stdlib
    result = json.dumps(data)
    _ = Path(result)  # Assign to _ to indicate intentional non-use
    
    # Use third-party (example)
    # response = requests.get("https://api.example.com")
    
    # Use local
    # user = User.from_dict(data)
    
    return []
