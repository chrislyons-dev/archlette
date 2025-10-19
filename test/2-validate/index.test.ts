/**
 * Tests for validation stage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from '../../src/2-validate/index.js';
import type { PipelineContext } from '../../src/core/types.js';
import type { ResolvedAACConfig } from '../../src/core/types-aac.js';
import type { ArchletteIR } from '../../src/core/types-ir.js';
import * as stageModuleLoader from '../../src/core/stage-module-loader.js';
import * as pathResolver from '../../src/core/path-resolver.js';

// Mock dependencies
vi.mock('../../src/core/stage-module-loader.js');
vi.mock('../../src/core/path-resolver.js');

describe('validate stage', () => {
  let mockContext: PipelineContext;
  let mockLogger: any;
  let mockIR: ArchletteIR;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockIR = {
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const mockConfig: ResolvedAACConfig = {
      project: { name: 'test-project', props: {} },
      paths: {
        ir_out: 'output/ir.json',
        dsl_out: 'output/workspace.dsl',
        render_out: 'output/render',
        docs_out: 'output/docs',
      },
      defaults: {
        includes: [],
        excludes: [],
        props: {},
      },
      extractors: [],
      validators: [],
      generators: [],
      renderers: [],
      docs: [],
    };

    mockContext = {
      config: mockConfig,
      state: { aggregatedIR: mockIR },
      log: mockLogger,
    };

    // Default mocks
    vi.mocked(pathResolver.getCliDir).mockReturnValue('/cli');
    vi.mocked(pathResolver.resolveArchlettePath).mockReturnValue('/resolved/ir.json');
    vi.mocked(pathResolver.writeFile).mockImplementation(() => {});
  });

  it('should throw error if aggregated IR is missing', async () => {
    mockContext.state.aggregatedIR = undefined;

    await expect(run(mockContext)).rejects.toThrow('Missing aggregated IR');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Missing aggregated IR - extraction stage must run before validation',
      ),
    );
  });

  it('should handle empty validators configuration', async () => {
    await run(mockContext);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Validate: validating and transforming IR…',
    );
    expect(mockContext.state.validatedIR).toBe(mockIR);
    expect(pathResolver.writeFile).toHaveBeenCalledWith(
      '/resolved/ir.json',
      JSON.stringify(mockIR, null, 2),
    );
  });

  it('should load and execute validators successfully', async () => {
    const enrichedIR = {
      ...mockIR,
      actors: [
        { id: 'user', name: 'User', type: 'Person', tags: ['enriched'], targets: [] },
      ],
    };

    const mockValidator = vi.fn().mockResolvedValue(enrichedIR);
    vi.mocked(stageModuleLoader.loadValidatorModule).mockResolvedValue({
      entry: mockValidator,
      resolved: '/fake/validator.ts',
    });

    mockContext.config.validators = [
      {
        use: 'builtin/base-validator',
        name: 'test-validator',
        props: {},
        _effective: {
          includes: [],
          excludes: [],
        },
      },
    ];

    await run(mockContext);

    expect(stageModuleLoader.loadValidatorModule).toHaveBeenCalledWith(
      'builtin/base-validator',
    );
    expect(mockValidator).toHaveBeenCalledWith(mockIR);
    expect(mockContext.state.validatedIR).toBe(enrichedIR);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Validator builtin/base-validator completed.',
    );
  });

  it('should chain validators sequentially', async () => {
    const ir1 = {
      ...mockIR,
      actors: [{ id: 'a1', name: 'A1', type: 'Person', tags: ['v1'], targets: [] }],
    };
    const ir2 = {
      ...mockIR,
      actors: [
        { id: 'a1', name: 'A1', type: 'Person', tags: ['v1'], targets: [] },
        { id: 'a2', name: 'A2', type: 'Person', tags: ['v2'], targets: [] },
      ],
    };

    const validator1 = vi.fn().mockResolvedValue(ir1);
    const validator2 = vi.fn().mockResolvedValue(ir2);

    vi.mocked(stageModuleLoader.loadValidatorModule)
      .mockResolvedValueOnce({
        entry: validator1,
        resolved: '/fake/v1.ts',
      })
      .mockResolvedValueOnce({
        entry: validator2,
        resolved: '/fake/v2.ts',
      });

    mockContext.config.validators = [
      {
        use: 'validator1',
        name: 'v1',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
      {
        use: 'validator2',
        name: 'v2',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    // First validator receives original IR
    expect(validator1).toHaveBeenCalledWith(mockIR);
    // Second validator receives output of first validator
    expect(validator2).toHaveBeenCalledWith(ir1);
    // Final validated IR is output of last validator
    expect(mockContext.state.validatedIR).toBe(ir2);
  });

  it('should throw error if validator fails', async () => {
    const validatorError = new Error('Validation failed: missing required field');
    const failingValidator = vi.fn().mockRejectedValue(validatorError);

    vi.mocked(stageModuleLoader.loadValidatorModule).mockResolvedValue({
      entry: failingValidator,
      resolved: '/fake/failing-validator.ts',
    });

    mockContext.config.validators = [
      {
        use: 'builtin/failing',
        name: 'failing',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await expect(run(mockContext)).rejects.toThrow(
      'Validation failed: missing required field',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Validator builtin/failing failed:',
      validatorError,
    );
  });

  it('should write validated IR to configured output path', async () => {
    const validator = vi.fn().mockResolvedValue(mockIR);
    vi.mocked(stageModuleLoader.loadValidatorModule).mockResolvedValue({
      entry: validator,
      resolved: '/fake/validator.ts',
    });

    mockContext.config.validators = [
      {
        use: 'builtin/base-validator',
        name: 'test',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    expect(pathResolver.resolveArchlettePath).toHaveBeenCalledWith('output/ir.json', {
      cliDir: undefined,
    });
    expect(pathResolver.writeFile).toHaveBeenCalledWith(
      '/resolved/ir.json',
      JSON.stringify(mockIR, null, 2),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Validate: completed 1 validator(s). Validated IR written to /resolved/ir.json',
    );
  });

  it('should provide improved error messages for missing IR', async () => {
    mockContext.state.aggregatedIR = undefined;

    await expect(run(mockContext)).rejects.toThrow('Missing aggregated IR');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('extraction stage must run before validation'),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Ensure your config includes extractors before validators',
      ),
    );
  });
});
