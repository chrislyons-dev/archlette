/**
 * Tests for stage module loaders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as moduleLoader from '../../src/core/module-loader.js';
import * as stageEntry from '../../src/core/stage-entry.js';
import {
  loadExtractorModule,
  loadValidatorModule,
  loadGeneratorModule,
} from '../../src/core/stage-module-loader.js';

// Mock the dependencies
vi.mock('../../src/core/module-loader.js');
vi.mock('../../src/core/stage-entry.js');

describe('stage-module-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadExtractorModule', () => {
    it('should load an extractor with default export', async () => {
      const mockExtractor = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { default: mockExtractor },
        path: '/fake/extractor.ts',
        url: 'file:///fake/extractor.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      const result = await loadExtractorModule('builtin/test-extractor');

      expect(result.entry).toBe(mockExtractor);
      expect(result.resolved).toBe('/fake/extractor.ts');
      expect(moduleLoader.loadModuleFromPath).toHaveBeenCalledWith(
        'builtin/test-extractor',
      );
    });

    it('should load an extractor with run export', async () => {
      const mockRun = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { run: mockRun },
        path: '/fake/extractor.ts',
        url: 'file:///fake/extractor.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      const result = await loadExtractorModule('builtin/test-extractor');

      expect(result.entry).toBe(mockRun);
      expect(result.resolved).toBe('/fake/extractor.ts');
    });

    it('should prioritize getStageEntry result over default', async () => {
      const mockStageEntry = vi.fn();
      const mockDefault = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { default: mockDefault, run: vi.fn() },
        path: '/fake/extractor.ts',
        url: 'file:///fake/extractor.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(mockStageEntry);

      const result = await loadExtractorModule('builtin/test-extractor');

      expect(result.entry).toBe(mockStageEntry);
    });

    it('should throw error if no callable entry is found', async () => {
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { someOtherExport: 'not a function' },
        path: '/fake/extractor.ts',
        url: 'file:///fake/extractor.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      await expect(loadExtractorModule('builtin/test-extractor')).rejects.toThrow(
        /does not export a callable entry/,
      );
    });

    it('should throw error if entry is not a function', async () => {
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { default: 'not a function' },
        path: '/fake/extractor.ts',
        url: 'file:///fake/extractor.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      await expect(loadExtractorModule('builtin/test-extractor')).rejects.toThrow(
        /does not export a callable entry/,
      );
    });
  });

  describe('loadValidatorModule', () => {
    it('should load a validator with default export', async () => {
      const mockValidator = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { default: mockValidator },
        path: '/fake/validator.ts',
        url: 'file:///fake/validator.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      const result = await loadValidatorModule('builtin/test-validator');

      expect(result.entry).toBe(mockValidator);
      expect(result.resolved).toBe('/fake/validator.ts');
    });

    it('should throw error if no callable entry is found', async () => {
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: {},
        path: '/fake/validator.ts',
        url: 'file:///fake/validator.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      await expect(loadValidatorModule('builtin/test-validator')).rejects.toThrow(
        /does not export a callable entry/,
      );
    });
  });

  describe('loadGeneratorModule', () => {
    it('should load a generator with default export', async () => {
      const mockGenerator = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { default: mockGenerator },
        path: '/fake/generator.ts',
        url: 'file:///fake/generator.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      const result = await loadGeneratorModule('builtin/test-generator');

      expect(result.entry).toBe(mockGenerator);
      expect(result.resolved).toBe('/fake/generator.ts');
    });

    it('should load a generator with run export', async () => {
      const mockRun = vi.fn();
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { run: mockRun },
        path: '/fake/generator.ts',
        url: 'file:///fake/generator.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      const result = await loadGeneratorModule('builtin/test-generator');

      expect(result.entry).toBe(mockRun);
    });

    it('should throw error if no callable entry is found', async () => {
      vi.mocked(moduleLoader.loadModuleFromPath).mockResolvedValue({
        module: { notAFunction: 123 },
        path: '/fake/generator.ts',
        url: 'file:///fake/generator.ts',
      });
      vi.mocked(stageEntry.getStageEntry).mockReturnValue(null);

      await expect(loadGeneratorModule('builtin/test-generator')).rejects.toThrow(
        /does not export a callable entry/,
      );
    });
  });
});
