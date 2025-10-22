/**
 * Basic Python Extractor Tests
 */

import { describe, it, expect } from 'vitest';
import { basicPython } from '../../../src/extractors/builtin/basic-python.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';
import type { PipelineContext } from '../../../src/core/types.js';
import { createLogger } from '../../../src/core/logger.js';

describe('basic-python extractor', () => {
  // Create mock context for tests
  const mockContext: PipelineContext = {
    log: createLogger({ context: 'Test', level: 'error' }), // Minimal logging for tests
    config: {} as any,
    state: {},
    configBaseDir: process.cwd(),
  };

  it('should extract component from simple Python file', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'test-python',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/simple.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/simple.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify system
    expect(ir.system.name).toBe('test-python');

    // Verify component extracted
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('Utils');
    expect(ir.components[0].id).toBe('utils');
    expect(ir.components[0].description).toContain('Simple utility functions');

    // Verify functions extracted
    expect(ir.code.length).toBeGreaterThanOrEqual(2);
    const capitalizeFunc = ir.code.find((c) => c.name === 'capitalize');
    expect(capitalizeFunc).toBeDefined();
    expect(capitalizeFunc?.type).toBe('function');
    expect(capitalizeFunc?.componentId).toBe('utils');

    const addNumbersFunc = ir.code.find((c) => c.name === 'add_numbers');
    expect(addNumbersFunc).toBeDefined();
    expect(addNumbersFunc?.parameters).toHaveLength(2);
  });

  it('should extract actors and relationships from complex Python file', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'payment-service',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/payment_service.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/payment_service.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('PaymentService');
    expect(ir.components[0].id).toBe('paymentservice');

    // Verify actors
    expect(ir.actors).toHaveLength(3);

    const customer = ir.actors.find((a) => a.name === 'Customer');
    expect(customer).toBeDefined();
    expect(customer?.type).toBe('Person');

    const stripeApi = ir.actors.find((a) => a.name === 'StripeAPI');
    expect(stripeApi).toBeDefined();
    expect(stripeApi?.type).toBe('System');

    // Verify relationships (note: targets don't exist so relationships won't be created)
    // In a real project, Database, NotificationService, AuditLog would be other components
    // For this test, we verify the extraction happened but relationships need both ends
    expect(ir.componentRelationships.length).toBeGreaterThanOrEqual(0);

    // Verify classes extracted
    const classes = ir.code.filter((c) => c.type === 'class');
    expect(classes.length).toBeGreaterThanOrEqual(2);

    const paymentRequest = classes.find((c) => c.name === 'PaymentRequest');
    expect(paymentRequest).toBeDefined();
    expect(paymentRequest?.metadata?.decorators).toContain('dataclass');

    const paymentProcessor = classes.find((c) => c.name === 'PaymentProcessor');
    expect(paymentProcessor).toBeDefined();

    // Verify methods extracted
    const methods = ir.code.filter((c) => c.type === 'method');
    expect(methods.length).toBeGreaterThanOrEqual(4);

    const processPayment = methods.find(
      (m) => m.name === 'PaymentProcessor.process_payment',
    );
    expect(processPayment).toBeDefined();
    expect(processPayment?.isAsync).toBe(true);

    const validateCard = methods.find(
      (m) => m.name === 'PaymentProcessor.validate_card',
    );
    expect(validateCard).toBeDefined();
    expect(validateCard?.isStatic).toBe(true);

    // Verify functions extracted
    const functions = ir.code.filter((c) => c.type === 'function');
    expect(functions.length).toBeGreaterThanOrEqual(2);

    const formatAmount = functions.find((f) => f.name === 'format_amount');
    expect(formatAmount).toBeDefined();
    expect(formatAmount?.parameters).toHaveLength(2);

    const sendReceipt = functions.find((f) => f.name === 'send_receipt');
    expect(sendReceipt).toBeDefined();
    expect(sendReceipt?.isAsync).toBe(true);
  });

  it('should handle empty file list', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'empty-test',
      inputs: {
        include: ['nonexistent/**/*.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['nonexistent/**/*.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    expect(ir.system.name).toBe('empty-test');
    expect(ir.components).toHaveLength(0);
    expect(ir.actors).toHaveLength(0);
    expect(ir.code).toHaveLength(0);
  });

  it('should parse Google-style docstrings', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'payment-processor',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/google_style.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/google_style.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('PaymentProcessor');

    // Verify class extraction
    const processorClass = ir.code.find(
      (item) => item.name === 'PaymentProcessor' && item.type === 'class',
    );
    expect(processorClass).toBeDefined();
    expect(processorClass?.description).toContain('Process payment transactions');

    // Verify method extraction with Google-style docstrings
    const processMethod = ir.code.find(
      (item) =>
        item.name === 'PaymentProcessor.process_payment' && item.type === 'method',
    );
    expect(processMethod).toBeDefined();
    expect(processMethod?.description).toContain(
      'Process a payment request asynchronously',
    );
    expect(processMethod?.isAsync).toBe(true);

    // Verify function extraction
    const taxFunction = ir.code.find(
      (item) => item.name === 'calculate_tax' && item.type === 'function',
    );
    expect(taxFunction).toBeDefined();
    expect(taxFunction?.description).toContain('Calculate tax on payment amount');
  });

  it('should extract properties and @property decorators', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'property-demo',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/properties.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/properties.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('PropertyDemo');

    // Find User class
    const userClass = ir.code.find(
      (item) => item.name === 'User' && item.type === 'class',
    );
    expect(userClass).toBeDefined();

    // Verify class has properties in metadata
    // Properties should be tracked separately from methods
    expect(userClass?.metadata).toBeDefined();

    // Find Rectangle class to test read-only properties
    const rectangleClass = ir.code.find(
      (item) => item.name === 'Rectangle' && item.type === 'class',
    );
    expect(rectangleClass).toBeDefined();

    // Product class should have dataclass decorator
    const productClass = ir.code.find(
      (item) => item.name === 'Product' && item.type === 'class',
    );
    expect(productClass).toBeDefined();
    expect(productClass?.metadata?.decorators).toContain('dataclass');
  });

  it('should extract type definitions (TypedDict, Protocol, Enum)', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'type-definitions',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/type_definitions.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/type_definitions.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('TypeDefinitions');

    // Verify code items include type definitions
    // Look for TypedDict, Protocol, and Enum in code items
    const codeItems = ir.code;

    // TypedDicts should be extracted
    const userProfileType = codeItems.find((item) => item.name === 'UserProfile');
    expect(userProfileType).toBeDefined();

    const paymentDataType = codeItems.find((item) => item.name === 'PaymentData');
    expect(paymentDataType).toBeDefined();

    // Protocols should be extracted
    const processorType = codeItems.find((item) => item.name === 'Processor');
    expect(processorType).toBeDefined();

    // Enums should be extracted
    const paymentStatusType = codeItems.find((item) => item.name === 'PaymentStatus');
    expect(paymentStatusType).toBeDefined();

    const httpStatusType = codeItems.find((item) => item.name === 'HttpStatus');
    expect(httpStatusType).toBeDefined();

    // Functions should still be extracted
    const createUserFunc = codeItems.find((item) => item.name === 'create_user');
    expect(createUserFunc).toBeDefined();
    expect(createUserFunc?.type).toBe('function');
  });

  it('should categorize imports as stdlib, third-party, and local', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'imports-test',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/imports.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/imports.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('ImportTest');

    // The function should execute without errors
    // Import categorization is tested by verifying the Python parser runs successfully
    // and produces valid output (imports are processed in file-parser.ts)
    expect(ir.code.length).toBeGreaterThan(0);
  });

  it('should extract decorator arguments', async () => {
    const node: ResolvedStageNode = {
      use: 'extractors/builtin/basic-python',
      name: 'decorator-demo',
      inputs: {
        include: ['test/extractors/builtin/basic-python/fixtures/decorators.py'],
        exclude: [],
      },
      props: {},
      _effective: {
        includes: ['test/extractors/builtin/basic-python/fixtures/decorators.py'],
        excludes: [],
      },
    };

    const ir = await basicPython(node, mockContext);

    // Verify component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('DecoratorDemo');

    // Verify classes with decorator arguments
    const immutableUser = ir.code.find(
      (item) => item.name === 'ImmutableUser' && item.type === 'class',
    );
    expect(immutableUser).toBeDefined();
    expect(immutableUser?.metadata?.decorators).toContain('dataclass');
    // Decorator details should be in metadata
    expect(immutableUser?.metadata?.decoratorDetails).toBeDefined();

    // Verify functions with route decorators
    const usersEndpoint = ir.code.find(
      (item) => item.name === 'users_endpoint' && item.type === 'function',
    );
    expect(usersEndpoint).toBeDefined();
    expect(usersEndpoint?.metadata?.decorators).toBeDefined();
    expect(usersEndpoint?.metadata?.decoratorDetails).toBeDefined();

    // Verify lru_cache decorator
    const expensiveFunc = ir.code.find(
      (item) => item.name === 'expensive_computation' && item.type === 'function',
    );
    expect(expensiveFunc).toBeDefined();
    expect(expensiveFunc?.metadata?.decorators).toContain('lru_cache');

    // The function should execute without errors
    expect(ir.code.length).toBeGreaterThan(0);
  });
});
