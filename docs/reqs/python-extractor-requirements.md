# Python Extractor Requirements

**Document Version:** 1.0  
**Date:** October 21, 2025  
**Status:** Draft

---

## Overview

This document specifies requirements for a Python extractor (`basic-python`) that provides feature parity with the existing TypeScript/JavaScript extractor (`basic-node`). The extractor will analyze Python source code to extract architectural information through docstring annotations, producing ArchletteIR output.

---

## Goals

1. **Feature Parity**: Match all extraction capabilities of `basic-node`
2. **Pythonic Approach**: Use Python-native conventions (docstrings, type hints, decorators)
3. **Standard Compliance**: Support standard Python documentation practices (PEP 257, Google/NumPy/Sphinx docstring formats)
4. **Framework Agnostic**: Work with any Python codebase (Django, Flask, FastAPI, vanilla Python)
5. **Type Safety**: Leverage Python type hints for enhanced extraction

---

## Architecture Alignment

### Reference Implementation

The Python extractor mirrors the structure of `basic-node`:

```
src/extractors/builtin/basic-python/
├── basic-python.ts          # Main entry point (implements ArchletteExtractor)
├── file-finder.ts           # Glob pattern file discovery (reuse from basic-node)
├── file-parser.ts           # Python AST parsing orchestrator
├── component-detector.ts    # Extract @module, @actor, @uses from docstrings
├── class-extractor.ts       # Extract Python classes
├── function-extractor.ts    # Extract Python functions/methods
├── type-extractor.ts        # Extract type aliases, TypedDict, Protocol
├── import-extractor.ts      # Extract import statements
├── to-ir-mapper.ts          # Map extractions to ArchletteIR
└── types.ts                 # Internal types
```

### Output Format

Produces `ArchletteIR` matching the Zod schema in `src/core/types-ir.ts`:

- System metadata
- Actors (users, external systems)
- Containers (optional, from package structure)
- Components (modules, packages)
- Code items (classes, functions, methods)
- Relationships (component dependencies, actor interactions)

---

## Functional Requirements

### FR-1: File Discovery

**Requirement**: Support glob patterns for Python file discovery.

**Details**:

- Match patterns: `*.py`, `**/*.py`
- Exclude patterns: `**/__pycache__/**`, `**/tests/**`, `**/*.pyc`, `**/venv/**`, `**/.venv/**`
- Reuse `file-finder.ts` from `basic-node` (already language-agnostic)

**Example Configuration**:

```yaml
extractors:
  - use: extractors/builtin/basic-python
    inputs:
      include: ['src/**/*.py', 'lib/**/*.py']
      exclude: ['**/__pycache__/**', '**/tests/**', '**/test_*.py']
```

---

### FR-2: Component Detection

**Requirement**: Extract architectural components from Python docstrings.

#### Supported Annotations

Support custom docstring tags matching JSDoc semantics:

| Tag          | Purpose                        | JSDoc Equivalent |
| ------------ | ------------------------------ | ---------------- |
| `@module`    | Define architectural component | `@module`        |
| `@component` | Define component (alias)       | `@component`     |
| `@namespace` | Define namespace               | `@namespace`     |
| `@actor`     | Define external actor          | `@actor`         |
| `@uses`      | Define component dependency    | `@uses`          |

#### Python Docstring Formats

Support all standard Python docstring styles:

1. **Google Style** (preferred for new code):

```python
"""Payment processing service.

This module handles credit card transactions and refunds.

@module PaymentService
@actor Customer {Person} {in} End user making purchases
@actor StripeAPI {System} {out} Third-party payment processor
@uses Database Stores transaction records
@uses NotificationService Sends payment confirmations

Args:
    None

Returns:
    None
"""
```

2. **NumPy Style**:

```python
"""Payment processing service.

This module handles credit card transactions and refunds.

@module PaymentService
@actor Customer {Person} {in} End user making purchases
@uses Database Stores transaction records

Parameters
----------
None

Returns
-------
None
"""
```

3. **Sphinx/reStructuredText Style**:

```python
"""Payment processing service.

This module handles credit card transactions and refunds.

:module: PaymentService
:actor Customer: {Person} {in} End user making purchases
:uses Database: Stores transaction records
"""
```

4. **Simple Style** (for backward compatibility):

```python
"""
@module PaymentService
@description Payment processing service
@actor Customer {Person} {in} End user making purchases
@uses Database Stores transaction records
"""
```

#### Detection Logic

1. **File-Level Docstrings**: Check module-level docstring (first statement after optional encoding/shebang)
2. **Tag Priority**: `@component` > `@module` > `@namespace` (same as `basic-node`)
3. **Multi-File Components**: Multiple files can declare the same component (deduplicated by aggregator)
4. **Component ID Generation**: Use `nameToId()` from `src/core/constants.js` (lowercase, dashes for spaces/slashes)

**Examples**:

```python
# src/payments/processor.py
"""
Payment processing module.

@module PaymentService
@description Handles credit card transactions and refunds
"""

class PaymentProcessor:
    """Process payments."""
    def process_payment(self, order):
        pass
```

Component extracted:

- ID: `paymentservice`
- Name: `PaymentService`
- Description: `Handles credit card transactions and refunds`
- Code items: `PaymentProcessor` class, `process_payment` method

---

### FR-3: Actor Detection

**Requirement**: Extract actors (users, external systems) from docstrings.

**Format** (identical to JSDoc):

```
@actor ActorName {Person|System} {in|out|both} Description
```

**Python Examples**:

```python
"""
User authentication module.

@module Authentication
@actor User {Person} {in} End user logging into the system
@actor LDAP {System} {out} Corporate directory service
@actor AuditLog {System} {out} Security audit logging system
"""
```

**Behavior**:

- Creates bidirectional relationships automatically (Actor ↔ Component)
- Direction `{in}`: Actor uses component
- Direction `{out}`: Component uses actor
- Direction `{both}`: Bidirectional usage (default if omitted)
- Actor ID generated via `nameToId()`

---

### FR-4: Relationship Detection

**Requirement**: Extract component dependencies from `@uses` tags.

**Format**:

```
@uses TargetComponent Description
```

**Python Example**:

```python
"""
Order management service.

@module OrderService
@uses PaymentService Processes payments for orders
@uses InventoryService Checks stock availability
@uses NotificationService Sends order confirmations
"""
```

**Behavior**:

- Creates Component → Component relationships
- Source component inferred from file's component declaration
- Target resolved by name (case-insensitive matching)
- Description stored in relationship

---

### FR-5: Class Extraction

**Requirement**: Extract all Python class definitions.

**Details**:

Extract for each class:

- Name
- Base classes (inheritance)
- Decorators (e.g., `@dataclass`, `@abstractmethod`)
- Docstring (summary, details, examples)
- Visibility (public `ClassName`, private `_ClassName`, protected `__ClassName`)
- Location (file path, line number)
- Methods (see FR-6)
- Properties (see FR-7)
- Type hints (class variables, return types)

**Example**:

```python
from dataclasses import dataclass
from abc import ABC, abstractmethod

@dataclass
class PaymentRequest:
    """Payment request data.

    Attributes:
        amount: Payment amount in cents
        currency: ISO currency code (e.g., 'USD')
        customer_id: Customer identifier
    """
    amount: int
    currency: str
    customer_id: str

class PaymentProcessor(ABC):
    """Abstract payment processor.

    All payment processors must implement process_payment().
    """

    @abstractmethod
    def process_payment(self, request: PaymentRequest) -> PaymentResult:
        """Process a payment request.

        Args:
            request: Payment request details

        Returns:
            PaymentResult: Result of the payment operation

        Raises:
            PaymentError: If payment processing fails
        """
        pass
```

**Extracted**:

- `PaymentRequest` class (dataclass decorator, attributes with types)
- `PaymentProcessor` class (abstract base class, extends ABC)
- Method: `process_payment` (abstract, parameters with types, return type)

---

### FR-6: Method/Function Extraction

**Requirement**: Extract all functions and methods from Python code.

**Extraction Targets**:

1. **Module-Level Functions**:

```python
def validate_card(card_number: str) -> bool:
    """Validate credit card number using Luhn algorithm.

    Args:
        card_number: Credit card number as string

    Returns:
        bool: True if valid, False otherwise
    """
    return True
```

2. **Class Methods**:

```python
class PaymentService:
    def process(self, amount: int) -> Result:
        """Process payment."""
        pass

    @classmethod
    def from_config(cls, config: dict) -> 'PaymentService':
        """Create service from configuration."""
        pass

    @staticmethod
    def format_amount(cents: int) -> str:
        """Format amount for display."""
        pass

    async def process_async(self, amount: int) -> Result:
        """Process payment asynchronously."""
        pass
```

3. **Lambda Functions** (assigned to variables):

```python
# Extract if assigned to module-level variable
square = lambda x: x * x
```

**Extract for Each Function/Method**:

- Name
- Visibility (`public`, `_protected`, `__private`)
- Modifiers: `async`, `@staticmethod`, `@classmethod`, `@abstractmethod`
- Decorators (all applied decorators)
- Parameters (name, type hint, default value, description from docstring)
- Return type (from type hint)
- Return description (from docstring)
- Docstring (parsed summary, details, args, returns, raises)
- Location (file, line number)

**Docstring Parsing**:

Support Google, NumPy, and Sphinx styles:

**Google Style**:

```python
def create_payment(customer_id: str, amount: int, currency: str = 'USD') -> Payment:
    """Create a new payment.

    Args:
        customer_id: Unique customer identifier
        amount: Payment amount in cents
        currency: ISO currency code (default: 'USD')

    Returns:
        Payment: Created payment object

    Raises:
        ValueError: If amount is negative
        CustomerNotFoundError: If customer doesn't exist
    """
    pass
```

**NumPy Style**:

```python
def create_payment(customer_id, amount, currency='USD'):
    """Create a new payment.

    Parameters
    ----------
    customer_id : str
        Unique customer identifier
    amount : int
        Payment amount in cents
    currency : str, optional
        ISO currency code (default: 'USD')

    Returns
    -------
    Payment
        Created payment object

    Raises
    ------
    ValueError
        If amount is negative
    CustomerNotFoundError
        If customer doesn't exist
    """
    pass
```

---

### FR-7: Property/Attribute Extraction

**Requirement**: Extract class properties and attributes.

**Targets**:

1. **Class Variables with Type Hints**:

```python
class Config:
    """Application configuration."""

    debug: bool = False
    max_retries: int = 3
    timeout: float = 30.0
```

2. **Properties** (using `@property` decorator):

```python
class User:
    def __init__(self, first_name: str, last_name: str):
        self._first_name = first_name
        self._last_name = last_name

    @property
    def full_name(self) -> str:
        """Full name of the user."""
        return f"{self._first_name} {self._last_name}"

    @property
    def email(self) -> str:
        """User email address."""
        return self._email

    @email.setter
    def email(self, value: str) -> None:
        """Set user email."""
        self._email = value
```

3. **Dataclass Fields**:

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    """Product information."""

    id: str
    name: str
    price: float
    tags: list[str] = field(default_factory=list)
```

**Extract**:

- Name
- Type (from type hint)
- Visibility (`public`, `_protected`, `__private`)
- Default value
- Decorator type (`@property`, `@email.setter`, etc.)
- Readonly status (properties without setters)
- Docstring

---

### FR-8: Type Extraction

**Requirement**: Extract Python type definitions for architectural documentation.

**Targets**:

1. **Type Aliases**:

```python
from typing import Union, Optional, Dict, List

UserId = str
PaymentResult = Union[Success, Failure]
ConfigDict = Dict[str, Union[str, int, bool]]
```

2. **TypedDict**:

```python
from typing import TypedDict

class PaymentData(TypedDict):
    """Payment transaction data."""
    amount: int
    currency: str
    customer_id: str
    metadata: Optional[dict]
```

3. **Protocol** (structural subtyping):

```python
from typing import Protocol

class Processor(Protocol):
    """Payment processor protocol."""

    def process(self, amount: int) -> Result:
        """Process payment."""
        ...
```

4. **Enum**:

```python
from enum import Enum, auto

class PaymentStatus(Enum):
    """Payment status enumeration."""

    PENDING = auto()
    PROCESSING = auto()
    COMPLETED = auto()
    FAILED = auto()
```

5. **NewType**:

```python
from typing import NewType

UserId = NewType('UserId', str)
ProductId = NewType('ProductId', int)
```

**Extract**:

- Name
- Type category (TypeAlias, TypedDict, Protocol, Enum, NewType)
- Definition/structure
- Docstring
- Location

---

### FR-9: Import Analysis

**Requirement**: Extract import statements for dependency analysis.

**Targets**:

```python
# Standard library
import os
import sys
from pathlib import Path
from typing import Optional, List

# Third-party
import requests
from flask import Flask, jsonify
from sqlalchemy import create_engine

# Local imports
from .models import User, Payment
from ..utils import validate_email
from payment_service import processor
```

**Extract**:

- Import source (module path)
- Imported names (symbols)
- Import type (`import`, `from...import`, `from...import *`)
- Relative vs absolute import

**Use Case**:

- Infer component relationships from imports
- Map module dependencies
- Detect external dependencies (third-party packages)

---

### FR-10: Decorator Recognition

**Requirement**: Recognize and extract Python decorators.

**Common Decorators**:

1. **Built-in**:
   - `@property`, `@staticmethod`, `@classmethod`
   - `@abstractmethod` (from `abc`)

2. **Framework-Specific**:
   - Django: `@login_required`, `@permission_required`
   - Flask: `@app.route()`, `@blueprint.route()`
   - FastAPI: `@app.get()`, `@app.post()`
   - pytest: `@pytest.fixture`, `@pytest.mark.parametrize`

3. **Data Classes**:
   - `@dataclass` (from `dataclasses`)
   - `@attrs.define` (from `attrs`)

**Extract**:

- Decorator name
- Arguments (if any)
- Location (which class/method/function)

**Use Case**:

- Tag components by framework (e.g., tag with "FastAPI" if `@app.get()` found)
- Identify API endpoints
- Detect architectural patterns (e.g., REST controllers, dependency injection)

---

### FR-11: Package Structure Detection

**Requirement**: Infer containers from Python package structure.

**Logic**:

1. **Top-Level Packages**: Each top-level package becomes a Container
2. **Nested Packages**: Subpackages become Components within parent Container
3. **Single File Projects**: No container created (components only)

**Example**:

```
myproject/
├── services/
│   ├── __init__.py          # Container: "services"
│   ├── payments/
│   │   ├── __init__.py      # Component: "payments"
│   │   └── processor.py
│   └── notifications/
│       ├── __init__.py      # Component: "notifications"
│       └── email.py
├── models/
│   ├── __init__.py          # Container: "models"
│   ├── user.py
│   └── payment.py
└── utils/
    ├── __init__.py          # Container: "utils"
    └── validators.py
```

**Result**:

- 3 Containers: `services`, `models`, `utils`
- Components: `payments`, `notifications`, `user`, `payment`, `validators`

**Configuration Override**:

Allow explicit container naming:

```yaml
extractors:
  - use: extractors/builtin/basic-python
    name: payment-service # Override container name
    inputs:
      include: ['services/payments/**/*.py']
```

---

### FR-12: Django Support

**Requirement**: Enhanced extraction for Django projects.

**Django-Specific Detection**:

1. **Models** (architectural components):

```python
from django.db import models

class User(models.Model):
    """User account model.

    @component UserModel
    """
    username = models.CharField(max_length=150)
    email = models.EmailField()
```

2. **Views** (API endpoints):

```python
from django.views import View
from django.http import JsonResponse

class PaymentView(View):
    """Payment processing view.

    @component PaymentEndpoint
    @uses PaymentService Processes payments
    """
    def post(self, request):
        pass
```

3. **Serializers** (data transformation):

```python
from rest_framework import serializers

class PaymentSerializer(serializers.ModelSerializer):
    """Payment serialization.

    @component PaymentSerializer
    """
    class Meta:
        model = Payment
```

**Behavior**:

- Detect Django base classes (`models.Model`, `View`, `APIView`, etc.)
- Tag with "Django" framework
- Extract model relationships (ForeignKey, ManyToMany) as dependencies

---

### FR-13: Flask Support

**Requirement**: Enhanced extraction for Flask applications.

**Flask-Specific Detection**:

```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/payments', methods=['POST'])
def create_payment():
    """Create payment endpoint.

    @component PaymentEndpoint
    @uses PaymentService Processes payments
    @actor Customer {Person} {in} User creating payment
    """
    pass

@app.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get payment endpoint.

    @component PaymentEndpoint
    """
    pass
```

**Behavior**:

- Detect `@app.route()` decorators
- Extract route paths and HTTP methods
- Tag with "Flask" framework
- Create component from route handler

---

### FR-14: FastAPI Support

**Requirement**: Enhanced extraction for FastAPI applications.

**FastAPI-Specific Detection**:

```python
from fastapi import FastAPI, Depends
from pydantic import BaseModel

app = FastAPI()

class PaymentRequest(BaseModel):
    """Payment request model.

    @component PaymentRequest
    """
    amount: int
    currency: str

@app.post("/payments")
async def create_payment(request: PaymentRequest):
    """Create payment endpoint.

    @component PaymentEndpoint
    @uses PaymentService Processes payments
    @actor Customer {Person} {in} User creating payment
    """
    pass
```

**Behavior**:

- Detect FastAPI route decorators (`@app.get()`, `@app.post()`, etc.)
- Extract Pydantic models as components
- Tag with "FastAPI" framework
- Recognize async endpoints

---

### FR-15: AST Parsing Implementation

**Requirement**: Use Python AST for code analysis.

**Implementation Approach**:

```typescript
// file-parser.ts
import { spawn } from 'child_process';
import { PythonShell } from 'python-shell';

/**
 * Parse Python files using Python's ast module
 *
 * Options:
 * 1. Shell out to Python script that uses ast.parse()
 * 2. Use python-shell npm package
 * 3. Use py-ast-parser (if suitable)
 */
export async function parseFiles(filePaths: string[]): Promise<FileExtraction[]> {
  // Call Python script: scripts/python-ast-parser.py
  // Python script returns JSON with extracted data
  // Map JSON to FileExtraction[] type
}
```

**Python AST Parser Script** (new file: `scripts/python-ast-parser.py`):

```python
"""Python AST parser for Archlette.

Parses Python source files and extracts:
- Module-level docstrings (for @module, @actor, @uses)
- Classes (with methods, properties)
- Functions (with parameters, return types)
- Type definitions (TypedDict, Protocol, Enum)
- Imports
"""

import ast
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

def parse_file(file_path: str) -> Dict[str, Any]:
    """Parse a Python file and extract architecture info."""
    with open(file_path, 'r', encoding='utf-8') as f:
        source = f.read()

    tree = ast.parse(source, filename=file_path)

    return {
        'filePath': file_path,
        'language': 'python',
        'component': extract_component(tree),
        'actors': extract_actors(tree),
        'relationships': extract_relationships(tree),
        'classes': extract_classes(tree),
        'functions': extract_functions(tree),
        'types': extract_types(tree),
        'imports': extract_imports(tree),
    }

def extract_component(tree: ast.Module) -> Dict[str, Any] | None:
    """Extract @module/@component from module docstring."""
    docstring = ast.get_docstring(tree)
    if not docstring:
        return None

    # Parse docstring for @module, @component, @namespace tags
    # Return: { id, name, description }
    pass

# ... more extraction functions
```

**Alternative**: Use existing Python AST libraries in TypeScript (if available and suitable).

---

## Non-Functional Requirements

### NFR-1: Performance

- Parse 1000 Python files in < 10 seconds
- Memory usage < 500MB for typical projects (10K files)
- Support incremental parsing (cache results)

### NFR-2: Error Handling

- Gracefully handle syntax errors (log and continue)
- Report parse errors with file path and line number
- Don't fail entire extraction if one file fails

### NFR-3: Compatibility

- Support Python 2.7+ and Python 3.6+ syntax
- Handle encoding declarations (UTF-8, Latin-1)
- Support both Unix and Windows line endings

### NFR-4: Maintainability

- Use same architecture as `basic-node`
- Reuse utilities from `core/` module
- Write unit tests matching `basic-node` coverage (80%+)
- Document with JSDoc comments

---

## Configuration Schema

**YAML Configuration**:

```yaml
extractors:
  - use: extractors/builtin/basic-python
    name: my-python-service # Optional container name
    inputs:
      include:
        - 'src/**/*.py'
        - 'lib/**/*.py'
      exclude:
        - '**/__pycache__/**'
        - '**/tests/**'
        - '**/*.pyc'
        - '**/venv/**'
        - '**/.venv/**'
    props:
      pythonPath: '/usr/bin/python3' # Optional Python interpreter
      detectFramework: true # Auto-detect Django/Flask/FastAPI
      includePrivate: false # Include _private members
      includeTests: false # Include test files
```

---

## Testing Requirements

### Test Coverage

Match `basic-node` test structure:

```
test/extractors/builtin/basic-python/
├── basic-python.test.ts          # Main extractor tests
├── component-detector.test.ts    # Component/actor/relationship detection
├── class-extractor.test.ts       # Class extraction
├── function-extractor.test.ts    # Function extraction
├── type-extractor.test.ts        # Type extraction
├── import-extractor.test.ts      # Import analysis
├── to-ir-mapper.test.ts          # IR mapping
└── fixtures/
    ├── simple.py                 # Basic Python file
    ├── django_models.py          # Django example
    ├── flask_app.py              # Flask example
    ├── fastapi_app.py            # FastAPI example
    └── type_definitions.py       # Type aliases, TypedDict, etc.
```

### Test Scenarios

1. **Component Detection**:
   - Single file with `@module`
   - Multiple files with same component
   - Files without annotations
   - Multiple annotation styles (Google, NumPy, Sphinx)

2. **Actor Detection**:
   - Person actors with `{in}` direction
   - System actors with `{out}` direction
   - Multiple actors in one file

3. **Relationship Detection**:
   - `@uses` tags
   - Inferred from imports

4. **Class Extraction**:
   - Simple classes
   - Classes with inheritance
   - Abstract classes
   - Dataclasses
   - Classes with decorators

5. **Function Extraction**:
   - Module functions
   - Class methods (instance, static, class)
   - Async functions
   - Functions with decorators
   - Lambda functions

6. **Type Extraction**:
   - Type aliases
   - TypedDict
   - Protocol
   - Enum
   - NewType

7. **Framework Detection**:
   - Django models and views
   - Flask routes
   - FastAPI endpoints

8. **Error Handling**:
   - Syntax errors
   - Missing files
   - Invalid encodings

---

## Implementation Phases

### Phase 1: Core Extraction (MVP)

- File discovery (reuse `file-finder.ts`)
- Python AST parsing (via Python script or library)
- Component detection (`@module`, `@actor`, `@uses`)
- Class extraction (basic)
- Function extraction (basic)
- IR mapping

**Deliverable**: Basic Python extractor that matches `basic-node` minimal functionality.

### Phase 2: Enhanced Extraction

- Docstring parsing (Google, NumPy, Sphinx styles)
- Method/property extraction (detailed)
- Type extraction (TypedDict, Protocol, Enum)
- Import analysis
- Decorator recognition

**Deliverable**: Feature parity with `basic-node`.

### Phase 3: Framework Support

- Django detection (models, views, serializers)
- Flask detection (routes, blueprints)
- FastAPI detection (endpoints, Pydantic models)
- Package structure inference (containers)

**Deliverable**: Framework-aware extraction with automatic tagging.

### Phase 4: Advanced Features

- Incremental parsing (caching)
- Performance optimization
- Custom docstring tag support
- Integration with type checkers (mypy, pyright)

**Deliverable**: Production-ready extractor with advanced features.

---

## Success Criteria

1. **Functional Completeness**: Extracts all data types supported by `basic-node`
2. **Test Coverage**: ≥80% code coverage with comprehensive test suite
3. **Documentation**: Complete user documentation matching `basic-node.md`
4. **Performance**: Processes 1000 files in <10 seconds
5. **Integration**: Works seamlessly in existing Archlette pipeline
6. **Examples**: Working examples for Django, Flask, FastAPI projects

---

## Documentation Deliverables

1. **User Documentation**:
   - `docs/extractors/basic-python.md` (user guide)
   - Code examples (Django, Flask, FastAPI)
   - Troubleshooting guide

2. **Developer Documentation**:
   - Architecture overview
   - AST parsing approach
   - Extension points

3. **API Reference**:
   - JSDoc comments in source code
   - Type definitions

---

## Open Questions

1. **Python AST Parser**: Use Python script via subprocess or find suitable TypeScript library? Use python script
2. **Type Hints**: How deep to extract type information? Full type resolution or surface-level only?
3. **Virtual Environments**: Should extractor auto-detect and use project's venv? No
4. **Docstring Standards**: Prefer one style (Google) or support all equally? Support several, listed above.
5. **Framework Detection**: Auto-detect or require explicit configuration? Save for a future release. YAGNI

---

## References

- **Existing Implementation**: `src/extractors/builtin/basic-node/`
- **Documentation**: `docs/extractors/basic-node.md`, `docs/extractors/component-detection.md`
- **IR Schema**: `src/core/types-ir.ts`
- **Quick Start**: `notes/quick-start-guide.md`
- **PEP 257**: Python Docstring Conventions - https://peps.python.org/pep-0257/
- **Google Style Guide**: https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings
- **NumPy Style Guide**: https://numpydoc.readthedocs.io/en/latest/format.html
- **Sphinx Documentation**: https://www.sphinx-doc.org/en/master/usage/restructuredtext/domains.html#the-python-domain

---

## Revision History

| Version | Date       | Author  | Changes                       |
| ------- | ---------- | ------- | ----------------------------- |
| 1.0     | 2025-10-21 | Initial | Initial requirements document |
