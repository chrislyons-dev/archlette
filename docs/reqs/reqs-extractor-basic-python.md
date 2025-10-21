# Python Code Extractor Requirements

## Overview

The basic-python extractor analyzes Python codebases using **AST-based static analysis**, producing comprehensive ArchletteIR containing code elements, components, relationships, and functional purity metadata. It focuses on **code-level architecture** through Python's `ast` module, extracting both object-oriented and functional programming constructs.

---

## Core Principles

1. **AST-driven**: Parse source files with Python's `ast` module for precise structural analysis
2. **Docstring-based components**: Use annotations (`@service`, `@component`, `@endpoint`) in docstrings
3. **pyproject.toml-aware**: Map files to Python packages via `pyproject.toml` for container boundaries
4. **Purity classification**: Analyze functions for side effects (pure vs. effectful)
5. **Type annotation support**: Extract type hints from function signatures and class attributes
6. **Multi-level extraction**: Functions/Classes → Components → Containers (packages) → System

---

## What to Extract

### 1. System Information

From `pyproject.toml` and configuration:

```toml
[project]
name = "bond-math"
version = "1.0.0"
description = "Fixed income analytics platform"
readme = "README.md"

[tool.poetry]
name = "bond-math"
authors = ["Team <team@example.com>"]
```

**Source**: Primary pyproject.toml at workspace root, or from extractor configuration

**Metadata extracted**:

- Project name from `[project].name` or `[tool.poetry].name`
- Version from `[project].version` or `[tool.poetry].version`
- Description from `[project].description` or `[tool.poetry].description`
- Repository from `[project.urls]` if available

---

### 2. Containers (Package Level)

Create one container per `pyproject.toml` found:

```typescript
{
  id: "bond-valuation",
  name: "bond-valuation",
  type: "Python Package",
  technology: "Python 3.11",
  description: "Bond valuation service with pricing models",
  version: "1.0.0",
  tags: ["python-package", "cloudflare-worker"]
}
```

**Metadata extracted**:

- Name, version, description from pyproject.toml
- Entry point from `[project.scripts]` or `[tool.poetry.scripts]`
- Python version from `[project].requires-python` or `[tool.poetry].python`
- Dependencies (dev/optional/prod) for relationship mapping

**Discovery strategy**:

- Traverse directory tree from workspace root
- Identify each pyproject.toml as container boundary
- Map source files to nearest parent container
- Support monorepos with multiple pyproject.toml files

---

### 3. Services (Module Level)

Identified via **module-level docstring annotations**:

```python
"""
Bond Valuation Service

@service bond-valuation
@type cloudflare-worker-python
@layer business-logic
@description Provides bond pricing and analytics
@owner fixed-income-team
@internal-routes /health, /metrics
@public-routes /v1/bonds/price, /v1/bonds/yield
@security-model jwt-bearer
@sla-tier tier-1
"""
```

**Supported tags**:

- `@service service-name` - Service identifier (kebab-case)
- `@type` - Service type (e.g., cloudflare-worker-python, lambda, fastapi)
- `@layer` - Architectural layer (presentation, business-logic, data-access)
- `@description` - Service purpose and responsibilities
- `@owner` - Team or person responsible
- `@internal-routes` - Comma-separated internal endpoints
- `@public-routes` - Comma-separated public API paths
- `@dependencies` - Comma-separated service dependencies
- `@security-model` - Authentication/authorization approach
- `@sla-tier` - Performance tier (tier-1, tier-2, tier-3)

**Service structure**:

```typescript
{
  id: "bond-valuation",
  name: "Bond Valuation",
  type: "cloudflare-worker-python",
  layer: "business-logic",
  description: "Provides bond pricing and analytics",
  owner: "fixed-income-team",
  sourcePath: "services/bond-valuation/src",
  internalRoutes: ["/health", "/metrics"],
  publicRoutes: ["/v1/bonds/price", "/v1/bonds/yield"],
  dependencies: ["daycount", "pricing"],
  securityModel: "jwt-bearer",
  slaTier: "tier-1",
  endpoints: []  // Populated from @endpoint annotations
}
```

**Rules**:

- Check module-level docstring (first string literal at file scope)
- All classes and functions in file belong to this service
- Service metadata applies to entire module

---

### 4. Components (Class Level)

Classes become components automatically:

```python
from dataclasses import dataclass

@dataclass
class BondCashflow:
    """
    Represents a single cash flow from a bond

    @exclude-from-diagram
    """
    date: str
    amount: float
    type: str
```

**Component structure**:

```typescript
{
  id: "bond-valuation.BondCashflow",
  name: "BondCashflow",
  serviceId: "bond-valuation",
  type: "class",
  stereotype: "immutable",  // Detected from @dataclass decorator
  description: "Represents a single cash flow from a bond",
  excludeFromDiagram: true,
  properties: [
    { name: "date", type: "str", isOptional: false, isReadonly: false },
    { name: "amount", type: "float", isOptional: false, isReadonly: false },
    { name: "type", type: "str", isOptional: false, isReadonly: false }
  ],
  methods: []
}
```

**Stereotype detection**:

- `@dataclass` decorator → `"immutable"`
- No decorator or plain class → no stereotype

**Supported docstring tags**:

- `@exclude-from-diagram` - Hide from architecture diagrams

**Rules**:

- Extract all public classes (not starting with `_`)
- Component ID: `{serviceId}.{ClassName}`
- Skip `__init__` and dunder methods from method extraction
- Properties from annotated class attributes (`name: type`)
- Methods from public class methods (not starting with `__`)

---

### 5. Module Components (File Level)

Top-level functions become module components:

```python
"""
@service bond-valuation
@description Bond pricing functions
"""

def calculate_bond_price(
    face_value: float,
    coupon_rate: float,
    yield_rate: float,
    years: int
) -> float:
    """Calculate present value of bond cash flows"""
    # Pure computation
    return face_value / ((1 + yield_rate) ** years)

async def fetch_market_data(symbol: str) -> dict:
    """Retrieve current market data for bond"""
    # Effectful I/O operation
    response = await http.get(f"/market/{symbol}")
    return response.json()
```

**Module component structure**:

```typescript
{
  id: "bond-valuation.pricing",
  name: "pricing",
  serviceId: "bond-valuation",
  type: "module",
  stereotype: "effectful",  // Has at least one effectful function
  description: "Module: pricing",
  excludeFromDiagram: false,
  functions: [
    {
      name: "calculate_bond_price",
      returnType: "float",
      parameters: [
        { name: "face_value", type: "float", isOptional: false },
        { name: "coupon_rate", type: "float", isOptional: false },
        { name: "yield_rate", type: "float", isOptional: false },
        { name: "years", type: "int", isOptional: false }
      ],
      isAsync: false,
      isExported: true,
      stereotype: "pure"
    },
    {
      name: "fetch_market_data",
      returnType: "dict",
      parameters: [
        { name: "symbol", type: "str", isOptional: false }
      ],
      isAsync: true,
      isExported: true,
      stereotype: "effectful"
    }
  ]
}
```

**Rules**:

- Create module component if file has public top-level functions
- Module ID: `{serviceId}.{filename}` (without .py extension)
- Module stereotype: `"effectful"` if any function is effectful, else `"pure"`
- Skip private functions (starting with `_`)
- Extract function signatures with type annotations

---

### 6. Code Elements (Functions & Methods)

Extract all public functions and methods with full signatures:

**Function metadata**:

- Name, parameters, return type, async flag
- Purity classification (pure vs. effectful)
- Visibility (public/private based on naming)
- Optional parameters (have default values)

**Type annotation extraction**:

- Simple types: `str`, `int`, `float`, `bool`, `None`
- Generic types: `List[str]`, `Dict[str, int]`, `Optional[float]`
- Union types: `str | int` (Python 3.10+), `Union[str, int]`
- Module types: `datetime.datetime`, `pathlib.Path`
- Custom types: User-defined classes

**Example method extraction**:

```python
class BondAnalyzer:
    def calculate_duration(
        self,
        cashflows: List[float],
        discount_rate: float = 0.05
    ) -> float:
        """Calculate Macaulay duration"""
        return sum(cf * t for t, cf in enumerate(cashflows))
```

**Extracted method**:

```typescript
{
  name: "calculate_duration",
  returnType: "float",
  parameters: [
    { name: "cashflows", type: "List[float]", isOptional: false },
    { name: "discount_rate", type: "float", isOptional: true }  // Has default
  ],
  isAsync: false,
  stereotype: "pure",
  visibility: "public"
}
```

**Rules**:

- Filter out `self` parameter from instance methods
- Mark parameters with defaults as optional
- Private methods (start with `_`): `visibility: "private"`
- Public methods (no `_` prefix): `visibility: "public"`

---

### 7. Purity Classification

Classify every function and method as **pure** or **effectful**:

**Pure function characteristics**:

- No I/O operations (file, network, database)
- No global state modifications
- No random number generation
- No system calls
- Deterministic output for same input
- Only performs computation

**Effectful function indicators**:

1. **Async functions**: `async def` → always effectful
2. **Return types**: `Coroutine`, `Awaitable`, `Generator`, `AsyncGenerator`, `Iterator`
3. **Body patterns**: `print(`, `open(`, `requests.`, `datetime.now`, `random.`, `os.`, `sys.`, `socket.`, database terms
4. **Function calls**: `print`, `open`, `input`, `exec`, `eval`
5. **Method calls**: `.write(`, `.read(`, `.query(`, `.execute(`, `.commit(`
6. **AST nodes**: `ast.Global`, `ast.Nonlocal` (global variable modifications)

**Classification algorithm**:

```python
def classify_function_purity(node: ast.FunctionDef, body_text: str) -> str:
    # 1. Check if async
    if isinstance(node, ast.AsyncFunctionDef):
        return "effectful"

    # 2. Check return type
    if node.returns and has_effectful_return_type(node.returns):
        return "effectful"

    # 3. Check body text for patterns
    if has_effectful_patterns(body_text):
        return "effectful"

    # 4. Walk AST for effectful operations
    for child in ast.walk(node):
        if is_effectful_call(child) or is_global_modification(child):
            return "effectful"

    return "pure"
```

**Module stereotype propagation**:

- Module is `"effectful"` if **any** function is effectful
- Module is `"pure"` only if **all** functions are pure

---

### 8. Endpoints (Route Level)

Extract HTTP endpoint metadata from function docstrings:

```python
@app.post("/v1/bonds/price")
async def price_bond(request: Request) -> Response:
    """
    Calculate bond price using yield-to-maturity

    @endpoint POST /v1/bonds/price
    @gateway-route /api/bonds/price
    @authentication jwt-bearer
    @scope bonds:read
    @rate-limit 100/minute
    @cacheable true
    @cache-ttl 300
    """
    # Implementation
```

**Endpoint structure**:

```typescript
{
  method: "POST",
  path: "/v1/bonds/price",
  gatewayRoute: "/api/bonds/price",
  authentication: "jwt-bearer",
  scope: "bonds:read",
  rateLimit: "100/minute",
  cacheable: true,
  cacheTtl: 300  // seconds
}
```

**Supported tags**:

- `@endpoint METHOD /path` - HTTP method and path (required)
- `@gateway-route /path` - External API gateway path
- `@authentication scheme` - Auth mechanism (jwt-bearer, api-key, oauth2)
- `@scope permission` - Required permission scope
- `@rate-limit requests/period` - Rate limiting configuration
- `@cacheable true|false` - Whether response is cacheable
- `@cache-ttl seconds` - Cache time-to-live in seconds

**Rules**:

- Endpoints attach to the service (added to `service.endpoints` array)
- Must have both method and path in `@endpoint` tag
- All other tags are optional
- Parse docstrings of all functions (not just decorated ones)

---

### 9. Actors

Extract actor declarations from docstrings:

```python
"""
@service bond-valuation
@description Bond pricing service

Actors:
@actor BondTrader {External} {in}
@actor RiskSystem {System} {out}
@actor PricingEngine {Component} {both}
"""
```

**Actor structure**:

```typescript
{
  id: "bond-trader",
  name: "BondTrader",
  type: "External",  // External, System, Component, Person
  description: "",
  tags: []
}
```

**Direction semantics** (similar to Node extractor):

- `{in}` - Actor → Service (actor calls service)
- `{out}` - Service → Actor (service calls actor)
- `{both}` - Bidirectional communication (default if omitted)

**Parsing format**:

- `@actor Name {Type} {Direction}`
- Type: `External`, `System`, `Component`, `Person`
- Direction: `in`, `out`, `both` (optional, defaults to `both`)

**Rules**:

- Actors declared at service (module) level
- ID normalized to kebab-case: `BondTrader` → `bond-trader`
- Relationships created based on direction
- Deduplicated across files (same ID merges)

---

### 10. Relationships

Extract relationships from multiple sources:

**Import relationships**:

```python
from pricing_models import BlackScholesModel
from daycount import calculate_accrued_interest
import requests
```

**Relationship types**:

- Local imports → Component-to-component relationships
- External packages → Container dependencies
- Standard library → No relationship (filtered)

**Docstring relationships**:

```python
"""
@uses pricing-service
@uses risk-calculator
@target data-warehouse
"""
```

**Relationship structure**:

```typescript
{
  sourceId: "bond-valuation",
  sourceType: "container",
  targetId: "pricing-service",
  targetType: "container",
  relationshipType: "uses",
  technology: "HTTP",
  description: "Retrieves pricing models",
  tags: []
}
```

**Supported docstring tags**:

- `@uses target` - Service uses another service
- `@target destination` - Service sends data to target
- `@service-binding name` - Cloudflare Worker service binding

**Rules**:

- Create relationships during AST walk
- Import analysis for code-level dependencies
- Docstring tags for service-level integration
- Deduplicate by source-target-type tuple

---

## Configuration

### Extractor Options

```typescript
interface PythonExtractorOptions {
  // Required
  workspaceRoot: string; // Workspace root directory

  // Optional
  includePatterns?: string[]; // Glob patterns for Python files
  excludePatterns?: string[]; // Glob patterns to exclude
  pythonVersion?: string; // Target Python version (3.10, 3.11, 3.12)
  followImports?: boolean; // Analyze imported modules
  extractPrivate?: boolean; // Include private (_prefixed) members

  // Package discovery
  findPackages?: boolean; // Auto-discover pyproject.toml files
  packagePaths?: string[]; // Explicit package directories

  // Purity analysis
  enablePurityCheck?: boolean; // Perform purity classification
  customEffectfulPatterns?: string[]; // Additional effectful patterns

  // Output control
  includeStandardLibrary?: boolean; // Include stdlib in relationships
  mergeDuplicates?: boolean; // Deduplicate components/actors
}
```

### Default Configuration

```typescript
{
  includePatterns: ["**/*.py"],
  excludePatterns: [
    "**/node_modules/**",
    "**/__pycache__/**",
    "**/venv/**",
    "**/.venv/**",
    "**/dist/**",
    "**/build/**",
    "**/.pytest_cache/**",
    "**/test_*.py",
    "**/*_test.py"
  ],
  pythonVersion: "3.11",
  followImports: false,
  extractPrivate: false,
  findPackages: true,
  enablePurityCheck: true,
  includeStandardLibrary: false,
  mergeDuplicates: true
}
```

---

## Docstring Parsing

### Annotation Format

Annotations use `@tag value` format in module or function docstrings:

```python
"""
Brief description on first line

Longer description can span multiple lines and provides
detailed context about the component.

@tag-name value
@another-tag value with spaces
@list-tag item1, item2, item3
"""
```

**Parsing rules**:

1. Extract all lines matching `@tag value` pattern
2. Convert kebab-case tags to camelCase: `@gateway-route` → `gatewayRoute`
3. Split comma-separated values for list fields
4. Parse boolean values: `true`/`false` (case-insensitive)
5. Parse numeric values for TTL and limits
6. First non-tag line is description

**Supported locations**:

- Module docstring (first string literal in file)
- Class docstring (first string in class body)
- Function docstring (first string in function body)

---

## ID Normalization

Convert Python names to architecture identifiers:

```python
def sanitize_id(name: str) -> str:
    """Convert name to valid architecture ID"""
    # Remove special characters
    normalized = re.sub(r'[^a-zA-Z0-9_-]', '_', name)

    # Convert to kebab-case
    normalized = re.sub(r'([a-z])([A-Z])', r'\1-\2', normalized)
    normalized = normalized.lower()

    # Remove consecutive separators
    normalized = re.sub(r'[-_]+', '-', normalized)

    return normalized.strip('-_')
```

**Examples**:

- `BondPricingService` → `bond-pricing-service`
- `pricing_models.py` → `pricing-models`
- `__init__.py` → `init` (special case)
- `HTTPClient` → `http-client`

**Hierarchical IDs**:

- Service: `{package-name}`
- Component (class): `{service}.{ClassName}`
- Module component: `{service}.{filename}`
- Code element: `{componentId}::{functionName}`

---

## Deduplication

Handle multiple files declaring same component or actor:

**Strategy**:

1. Components and actors identified by unique ID
2. First declaration wins for structure (properties, methods)
3. Descriptions merge into a Set (unique values)
4. Tags merge into a Set (unique values)
5. Relationships deduplicate by (source, target, type) tuple

**Example**:

File 1:

```python
"""@actor BondTrader {External} {in}"""
```

File 2:

```python
"""@actor BondTrader {External} {in}"""
```

Result: Single actor with ID `bond-trader`

---

## Error Handling

### Syntax Errors

```python
try:
    tree = ast.parse(source, filename=str(file_path))
except SyntaxError as e:
    print(f"[ERROR] Syntax error in {file_path}:{e.lineno}: {e.msg}", file=sys.stderr)
    return {"services": [], "components": []}  # Return empty, continue
```

**Strategy**: Log error, skip file, continue extraction

### File Access Errors

```python
try:
    with open(file_path, "r", encoding="utf-8") as f:
        source = f.read()
except IOError as e:
    raise IOError(f"Failed to read {file_path}: {e}")
except UnicodeDecodeError as e:
    raise ValueError(f"File encoding error in {file_path}: {e}")
```

**Strategy**: Raise exception for file system issues, fail extraction

### Invalid Annotations

```python
# Silently skip malformed annotations
match = re.match(r"^@([\w-]+)\s+(.+)$", line)
if not match:
    continue  # Skip this line
```

**Strategy**: Ignore malformed annotations, extract what's valid

---

## Output: ArchletteIR

### Complete IR Structure

```typescript
{
  system: {
    id: "bond-math",
    name: "Bond Math",
    description: "Fixed income analytics platform",
    version: "1.0.0"
  },

  containers: [
    {
      id: "bond-valuation",
      name: "bond-valuation",
      type: "Python Package",
      technology: "Python 3.11",
      description: "Bond valuation service",
      version: "1.0.0",
      tags: ["python-package"]
    }
  ],

  components: [
    {
      id: "bond-valuation.BondCashflow",
      name: "BondCashflow",
      containerId: "bond-valuation",
      type: "class",
      stereotype: "immutable",
      description: "Represents bond cash flow",
      properties: [...],
      methods: []
    },
    {
      id: "bond-valuation.pricing",
      name: "pricing",
      containerId: "bond-valuation",
      type: "module",
      stereotype: "effectful",
      description: "Module: pricing",
      functions: [...]
    }
  ],

  code: [
    {
      id: "bond-valuation.pricing::calculate_bond_price",
      componentId: "bond-valuation.pricing",
      name: "calculate_bond_price",
      type: "function",
      stereotype: "pure",
      returnType: "float",
      parameters: [...],
      isAsync: false,
      isExported: true,
      description: "Calculate present value of bond cash flows"
    }
  ],

  actors: [
    {
      id: "bond-trader",
      name: "BondTrader",
      type: "External",
      description: "Bond trading system",
      tags: []
    }
  ],

  relationships: [
    {
      sourceId: "bond-valuation",
      sourceType: "container",
      targetId: "pricing-models",
      targetType: "container",
      relationshipType: "uses",
      technology: "Python import",
      description: "",
      tags: []
    }
  ],

  deployments: [],
  deploymentRelationships: []
}
```

---

## Integration Points

### 1. TypeScript Orchestrator

Python extractor called via Node.js spawn:

```typescript
const proc = spawn('python3', ['-3', 'python-extractor.py', mainFilePath, serviceId], {
  cwd: servicePath,
});

// Parse JSON output from stdout
const result: PartialIR = JSON.parse(stdout);
```

**Contract**:

- Input: File path, service ID (command-line arguments)
- Output: JSON on stdout (PartialIR format)
- Errors: Logged to stderr, non-zero exit code

### 2. IR Aggregator

Python extractor output merged with other extractors:

```typescript
// Merge multiple PartialIR results
const aggregatedIR = aggregator.merge([nodeIR, pythonIR, wranglerIR]);
```

**Responsibilities**:

- Deduplicate components across languages
- Merge relationships from multiple sources
- Resolve container boundaries (Node vs. Python packages)

### 3. Configuration System

Load extractor settings from archlette.config.yaml:

```yaml
extractors:
  - name: basic-python
    enabled: true
    options:
      includePatterns: ['services/**/src/**/*.py']
      excludePatterns: ['**/test_*.py']
      pythonVersion: '3.11'
      enablePurityCheck: true
```

---

## Success Criteria

### Functional Requirements

- ✅ Extract all services from module-level `@service` docstrings
- ✅ Extract all classes as components with properties and methods
- ✅ Extract all top-level functions as module components
- ✅ Classify function purity (pure vs. effectful) accurately
- ✅ Parse type annotations from function signatures
- ✅ Extract HTTP endpoints from `@endpoint` docstrings
- ✅ Discover containers from pyproject.toml files
- ✅ Map source files to nearest parent package
- ✅ Create relationships from import statements
- ✅ Parse actor declarations with direction semantics
- ✅ Handle syntax errors gracefully (skip file, continue)
- ✅ Deduplicate components and actors by ID

### Quality Requirements

- **Accuracy**: Parse 100% of valid Python syntax (Python 3.8+)
- **Completeness**: Extract all public classes, functions, and docstrings
- **Precision**: Purity classification >95% accurate on common patterns
- **Robustness**: Handle malformed docstrings without crashing
- **Performance**: Process 1000 Python files in <10 seconds

### Non-Functional Requirements

- **Maintainability**: Clear separation between parsing, classification, and output
- **Testability**: Unit tests for each classification rule and parsing function
- **Extensibility**: Easy to add new docstring tags or purity patterns
- **Documentation**: Inline comments explaining classification heuristics

---

## Performance Considerations

### Optimization Strategies

1. **Lazy AST walking**: Only parse files matching include patterns
2. **Caching**: Cache parsed AST for files that haven't changed
3. **Parallel processing**: Process multiple files concurrently (future)
4. **Selective extraction**: Skip test files and excluded patterns early
5. **Incremental updates**: Re-parse only changed files (future)

### Expected Performance

- **Small project** (<50 files): <1 second
- **Medium project** (50-500 files): 1-5 seconds
- **Large project** (500-2000 files): 5-15 seconds
- **Monorepo** (2000+ files): 15-30 seconds with proper exclusions

---

## Future Enhancements

### Phase 2: Advanced Analysis

- Extract decorators as stereotypes (`@lru_cache` → `cached`, `@property` → `computed`)
- Analyze function call graphs for implicit dependencies
- Detect design patterns (Factory, Strategy, Observer)
- Extract exception handling and error flows
- Support Pydantic models with validation rules

### Phase 3: Runtime Integration

- Parse FastAPI/Flask route decorators for endpoints
- Extract SQLAlchemy models as data components
- Analyze async task queues (Celery, RQ)
- Detect external service calls (boto3, requests)
- Profile actual purity via runtime instrumentation

### Phase 4: Documentation Generation

- Generate Sphinx documentation from ArchletteIR
- Create interactive API docs from endpoints
- Generate UML sequence diagrams from purity analysis
- Export to OpenAPI/Swagger specifications

---

## Testing Strategy

### Unit Tests

Test individual functions in isolation:

```python
def test_classify_function_purity_async():
    """Async functions are always effectful"""
    code = "async def fetch(): pass"
    tree = ast.parse(code)
    node = tree.body[0]
    assert classify_function_purity(node, code) == "effectful"

def test_parse_annotations_service():
    """Parse @service annotation"""
    docstring = "@service bond-valuation\n@description Pricing service"
    result = parse_annotations(docstring)
    assert result["service"] == "bond-valuation"
    assert result["description"] == "Pricing service"
```

### Integration Tests

Test complete file extraction:

```python
def test_extract_python_file_with_class():
    """Extract class component with methods"""
    file_path = Path("test_fixtures/bond_model.py")
    result = extract_from_python_file(file_path, "test-service")

    assert len(result["components"]) == 1
    component = result["components"][0]
    assert component["name"] == "BondModel"
    assert len(component["methods"]) > 0
```

### Fixtures

Create representative Python files covering:

- Service declarations with all tags
- Classes with dataclass decorator
- Module with pure and effectful functions
- Endpoint declarations
- Actor declarations
- Import relationships
- Malformed docstrings (error handling)
- Syntax errors (graceful failure)

### Coverage Goals

- **Line coverage**: >90%
- **Branch coverage**: >85%
- **Function coverage**: 100% (all exported functions tested)
- **Edge cases**: Malformed input, missing files, invalid syntax

---

## Examples

### Complete Service Extraction

**Input: `services/bond-valuation/src/main.py`**

```python
"""
Bond Valuation Service

@service bond-valuation
@type cloudflare-worker-python
@layer business-logic
@description Provides bond pricing and yield calculations
@owner fixed-income-team
@internal-routes /health, /metrics
@public-routes /v1/bonds/price, /v1/bonds/yield
@dependencies daycount, pricing-models
@security-model jwt-bearer
@sla-tier tier-1

@actor BondTrader {External} {in}
@actor RiskSystem {System} {out}
"""

from dataclasses import dataclass
from typing import List

@dataclass
class BondCashflow:
    """
    Represents a single cash flow from a bond

    @exclude-from-diagram
    """
    date: str
    amount: float
    type: str

class BondPricer:
    """Calculate bond prices and yields"""

    def price_bond(
        self,
        cashflows: List[BondCashflow],
        discount_rate: float = 0.05
    ) -> float:
        """Calculate present value of cash flows"""
        return sum(cf.amount / (1 + discount_rate)**i
                   for i, cf in enumerate(cashflows))

    async def fetch_market_yield(self, symbol: str) -> float:
        """Retrieve current market yield for bond"""
        response = await http.get(f"/market/{symbol}")
        return response.json()["yield"]

def calculate_accrued_interest(
    coupon_rate: float,
    days_since_payment: int,
    days_in_period: int
) -> float:
    """Calculate accrued interest using actual/actual convention"""
    return coupon_rate * (days_since_payment / days_in_period)

async def price_bond_endpoint(request: Request) -> Response:
    """
    Price a bond using yield-to-maturity

    @endpoint POST /v1/bonds/price
    @gateway-route /api/bonds/price
    @authentication jwt-bearer
    @scope bonds:read
    @rate-limit 100/minute
    @cacheable false
    """
    # Implementation
```

**Output: ArchletteIR (excerpt)**

```typescript
{
  services: [{
    id: "bond-valuation",
    name: "Bond Valuation",
    type: "cloudflare-worker-python",
    layer: "business-logic",
    description: "Provides bond pricing and yield calculations",
    owner: "fixed-income-team",
    internalRoutes: ["/health", "/metrics"],
    publicRoutes: ["/v1/bonds/price", "/v1/bonds/yield"],
    dependencies: ["daycount", "pricing-models"],
    securityModel: "jwt-bearer",
    slaTier: "tier-1",
    endpoints: [{
      method: "POST",
      path: "/v1/bonds/price",
      gatewayRoute: "/api/bonds/price",
      authentication: "jwt-bearer",
      scope: "bonds:read",
      rateLimit: "100/minute",
      cacheable: false
    }]
  }],

  components: [
    {
      id: "bond-valuation.BondCashflow",
      name: "BondCashflow",
      serviceId: "bond-valuation",
      type: "class",
      stereotype: "immutable",
      description: "Represents a single cash flow from a bond",
      excludeFromDiagram: true,
      properties: [
        { name: "date", type: "str", isOptional: false, isReadonly: false },
        { name: "amount", type: "float", isOptional: false, isReadonly: false },
        { name: "type", type: "str", isOptional: false, isReadonly: false }
      ],
      methods: []
    },
    {
      id: "bond-valuation.BondPricer",
      name: "BondPricer",
      serviceId: "bond-valuation",
      type: "class",
      description: "Calculate bond prices and yields",
      properties: [],
      methods: [
        {
          name: "price_bond",
          returnType: "float",
          parameters: [
            { name: "cashflows", type: "List[BondCashflow]", isOptional: false },
            { name: "discount_rate", type: "float", isOptional: true }
          ],
          isAsync: false,
          stereotype: "pure",
          visibility: "public"
        },
        {
          name: "fetch_market_yield",
          returnType: "float",
          parameters: [
            { name: "symbol", type: "str", isOptional: false }
          ],
          isAsync: true,
          stereotype: "effectful",
          visibility: "public"
        }
      ]
    },
    {
      id: "bond-valuation.main",
      name: "main",
      serviceId: "bond-valuation",
      type: "module",
      stereotype: "effectful",
      description: "Module: main",
      functions: [
        {
          name: "calculate_accrued_interest",
          returnType: "float",
          parameters: [
            { name: "coupon_rate", type: "float", isOptional: false },
            { name: "days_since_payment", type: "int", isOptional: false },
            { name: "days_in_period", type: "int", isOptional: false }
          ],
          isAsync: false,
          isExported: true,
          stereotype: "pure"
        },
        {
          name: "price_bond_endpoint",
          returnType: "Response",
          parameters: [
            { name: "request", type: "Request", isOptional: false }
          ],
          isAsync: true,
          isExported: true,
          stereotype: "effectful"
        }
      ]
    }
  ],

  actors: [
    { id: "bond-trader", name: "BondTrader", type: "External" },
    { id: "risk-system", name: "RiskSystem", type: "System" }
  ],

  relationships: [
    {
      sourceId: "bond-trader",
      sourceType: "actor",
      targetId: "bond-valuation",
      targetType: "service",
      relationshipType: "uses",
      description: "Bond trader calls service"
    },
    {
      sourceId: "bond-valuation",
      sourceType: "service",
      targetId: "risk-system",
      targetType: "actor",
      relationshipType: "uses",
      description: "Service sends data to risk system"
    },
    {
      sourceId: "bond-valuation",
      sourceType: "container",
      targetId: "daycount",
      targetType: "container",
      relationshipType: "uses",
      technology: "service dependency"
    }
  ]
}
```

---

## Open Questions

1. **Multiple Python files per service**: Should each .py file be a separate service, or should directory structure determine service boundaries?
   - **Current approach**: One service per module-level `@service` docstring
2. **Private member extraction**: Should private methods/functions (starting with `_`) be included in components?
   - **Current approach**: Excluded by default, configurable via `extractPrivate` option
3. **Type stub files**: Should .pyi stub files be analyzed separately or merged with .py files?
   - **Future consideration**: Merge type information from stubs into component metadata
4. **Inheritance relationships**: Should class inheritance be tracked as explicit relationships?
   - **Future enhancement**: Add `extends` relationship type for class hierarchies
5. **Dynamic imports**: How to handle `importlib.import_module()` and `__import__()`?
   - **Current limitation**: Only static imports analyzed

---

## References

- [Python AST Module Documentation](https://docs.python.org/3/library/ast.html)
- [PEP 257 - Docstring Conventions](https://www.python.org/dev/peps/pep-0257/)
- [PEP 484 - Type Hints](https://www.python.org/dev/peps/pep-0484/)
- [PEP 518 - pyproject.toml](https://www.python.org/dev/peps/pep-0518/)
- [ArchletteIR Schema](../../schemas/aac-ir.json)
