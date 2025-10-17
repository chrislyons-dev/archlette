/**
 * Unit tests for tool-manager
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as toolManager from '../../src/core/tool-manager.js';

// Mock node modules
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:os');
vi.mock('node:https');
vi.mock('node:child_process');

describe('tool-manager', () => {
  let mockFs: any;
  let mockPath: any;
  let mockOs: any;
  let mockHttps: any;
  let mockChildProcess: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import mocked modules
    mockFs = await import('node:fs');
    mockPath = await import('node:path');
    mockOs = await import('node:os');
    mockHttps = await import('node:https');
    mockChildProcess = await import('node:child_process');

    // Setup default mock implementations
    mockOs.homedir = vi.fn(() => '/home/testuser');
    mockPath.join = vi.fn((...args: string[]) => args.join('/'));
    mockFs.existsSync = vi.fn(() => false);
    mockFs.mkdirSync = vi.fn();
    mockFs.unlinkSync = vi.fn();
    mockFs.chmodSync = vi.fn();

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Mock process.platform as 'linux' by default
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getCacheDir', () => {
    it('returns cache directory path in user home', () => {
      const cacheDir = toolManager.getCacheDir();

      expect(mockOs.homedir).toHaveBeenCalled();
      expect(mockPath.join).toHaveBeenCalledWith(
        '/home/testuser',
        '.archlette',
        'tools',
      );
      expect(cacheDir).toBe('/home/testuser/.archlette/tools');
    });
  });

  describe('checkJava', () => {
    it('returns version string when Java is available', () => {
      mockChildProcess.execSync = vi.fn(() => 'openjdk version "17.0.1" 2021-10-19');

      const result = toolManager.checkJava();

      expect(result).toContain('openjdk');
      expect(mockChildProcess.execSync).toHaveBeenCalledWith('java -version 2>&1', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    });

    it('returns version string for Oracle Java', () => {
      mockChildProcess.execSync = vi.fn(() => 'java version "11.0.12" 2021-07-20');

      const result = toolManager.checkJava();

      expect(result).toContain('version');
    });

    it('returns null when Java is not available', () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Command not found');
      });

      const result = toolManager.checkJava();

      expect(result).toBeNull();
    });

    it('returns null when execSync throws', () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = toolManager.checkJava();

      expect(result).toBeNull();
    });

    it('returns null when output is empty', () => {
      mockChildProcess.execSync = vi.fn(() => '');

      const result = toolManager.checkJava();

      expect(result).toBeNull();
    });
  });

  describe('requireJava', () => {
    it('does not throw when Java is available', () => {
      mockChildProcess.execSync = vi.fn(() => 'openjdk version "17.0.1"');

      expect(() => toolManager.requireJava()).not.toThrow();
    });

    it('throws error with installation instructions when Java is not available', () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Command not found');
      });

      expect(() => toolManager.requireJava()).toThrow(/Java runtime not found/);
      expect(() => toolManager.requireJava()).toThrow(/brew install openjdk/);
      expect(() => toolManager.requireJava()).toThrow(/sudo apt-get install/);
      expect(() => toolManager.requireJava()).toThrow(/adoptium.net/);
    });
  });

  describe('findStructurizrCLI', () => {
    it('returns system PATH location when found', async () => {
      mockChildProcess.execSync = vi.fn(() => '/usr/local/bin/structurizr.sh\n');

      const result = await toolManager.findStructurizrCLI(mockLogger);

      expect(result).toBe('/usr/local/bin/structurizr.sh');
      expect(mockLogger.debug).toHaveBeenCalledWith('Looking for Structurizr CLI...');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found Structurizr CLI in PATH'),
      );
    });

    it('uses structurizr.bat on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      mockChildProcess.execSync = vi.fn((cmd: string) => {
        if (cmd.includes('where')) {
          return 'C:\\Tools\\structurizr.bat\n';
        }
        throw new Error('Not found');
      });

      const result = await toolManager.findStructurizrCLI(mockLogger);

      expect(result).toBe('C:\\Tools\\structurizr.bat');
      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining('where'),
        expect.any(Object),
      );
    });

    it('returns cached location when found in cache', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not in PATH');
      });
      mockFs.existsSync = vi.fn((p: string) => {
        // Cache directory exists and cached script exists
        return p.includes('structurizr') && p.endsWith('.sh');
      });
      mockFs.mkdirSync = vi.fn();

      const result = await toolManager.findStructurizrCLI(mockLogger);

      expect(result).toContain('structurizr.sh');
      expect(result).toContain('.archlette/tools');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found Structurizr CLI in cache'),
      );
    });

    it('downloads when not found in PATH or cache', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();
      mockFs.unlinkSync = vi.fn();
      mockFs.chmodSync = vi.fn();

      // Mock HTTPS download
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn((stream: any) => stream),
        headers: {},
      };
      const mockRequest = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'error') {
            // Don't trigger error
          }
          return mockRequest;
        }),
      };
      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return mockRequest;
      });

      // Mock createWriteStream
      const mockWriteStream = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'finish') {
            // Trigger finish immediately
            setTimeout(() => _handler(), 0);
          }
          return mockWriteStream;
        }),
        close: vi.fn(),
      };
      mockFs.createWriteStream = vi.fn(() => mockWriteStream);

      // Mock unzip command
      mockChildProcess.execSync = vi.fn((cmd: string) => {
        if (cmd.includes('which') || cmd.includes('where')) {
          throw new Error('Not found');
        }
        // Allow unzip command to succeed
        return '';
      });

      // Mock that the extracted script exists after extraction
      let callCount = 0;
      mockFs.existsSync = vi.fn(() => {
        callCount++;
        // First calls (cache check) return false, later calls (after extraction) return true
        return callCount > 2;
      });

      const result = await toolManager.findStructurizrCLI(mockLogger);

      expect(result).toContain('structurizr.sh');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Downloading Structurizr CLI'),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('✓ Structurizr CLI installed'),
      );
    });

    it('handles download failures gracefully', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();

      // Mock HTTPS download failure
      const mockRequest = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'error') {
            setTimeout(() => _handler(new Error('Network error')), 0);
          }
          return mockRequest;
        }),
      };
      mockHttps.get = vi.fn(() => mockRequest);

      await expect(toolManager.findStructurizrCLI(mockLogger)).rejects.toThrow(
        /Structurizr CLI download failed/,
      );
    });
  });

  describe('findPlantUML', () => {
    it('returns system PATH location when found', async () => {
      mockChildProcess.execSync = vi.fn(() => '/usr/local/bin/plantuml\n');

      const result = await toolManager.findPlantUML(mockLogger);

      expect(result).toBe('/usr/local/bin/plantuml');
      expect(mockLogger.debug).toHaveBeenCalledWith('Looking for PlantUML...');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found PlantUML in PATH'),
      );
    });

    it('returns cached JAR location when found in cache', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not in PATH');
      });
      mockFs.existsSync = vi.fn(
        (p: string) => p.includes('plantuml') && p.endsWith('.jar'),
      );
      mockFs.mkdirSync = vi.fn();

      const result = await toolManager.findPlantUML(mockLogger);

      expect(result).toContain('plantuml');
      expect(result).toContain('.jar');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found PlantUML in cache'),
      );
    });

    it('downloads when not found in PATH or cache', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });

      // Always return false to force download
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();

      // Mock HTTPS download
      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn((stream: any) => stream),
        headers: {},
      };
      const mockRequest = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'error') {
            // Don't trigger error
          }
          return mockRequest;
        }),
      };
      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return mockRequest;
      });

      const mockWriteStream = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'finish') {
            setTimeout(() => _handler(), 0);
          }
          return mockWriteStream;
        }),
        close: vi.fn(),
      };
      mockFs.createWriteStream = vi.fn(() => mockWriteStream);

      const result = await toolManager.findPlantUML(mockLogger);

      expect(result).toContain('plantuml');
      expect(result).toContain('.jar');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Downloading PlantUML'),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('✓ PlantUML installed'),
      );
    });

    it('skips download if JAR already exists in cache', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => true);
      mockFs.mkdirSync = vi.fn();

      const result = await toolManager.findPlantUML(mockLogger);

      expect(result).toContain('plantuml');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found PlantUML in cache'),
      );
    });

    it('handles download failures gracefully', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();

      // Mock HTTPS download failure
      const mockRequest = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'error') {
            setTimeout(() => _handler(new Error('Network error')), 0);
          }
          return mockRequest;
        }),
      };
      mockHttps.get = vi.fn(() => mockRequest);

      await expect(toolManager.findPlantUML(mockLogger)).rejects.toThrow(
        /PlantUML download failed/,
      );
    });

    it('handles HTTP redirects (301)', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();

      let callCount = 0;
      const mockRequest = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'error') {
            // Don't trigger error
          }
          return mockRequest;
        }),
      };

      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callCount++;
        if (callCount === 1) {
          // First call returns redirect
          callback({
            statusCode: 301,
            headers: { location: 'https://redirect.example.com/plantuml.jar' },
          });
        } else {
          // Second call (after redirect) returns success
          const mockResponse = {
            statusCode: 200,
            pipe: vi.fn((stream: any) => stream),
            headers: {},
          };
          callback(mockResponse);
        }
        return mockRequest;
      });

      const mockWriteStream = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'finish') {
            setTimeout(() => _handler(), 0);
          }
          return mockWriteStream;
        }),
        close: vi.fn(),
      };
      mockFs.createWriteStream = vi.fn(() => mockWriteStream);

      const result = await toolManager.findPlantUML(mockLogger);

      expect(result).toContain('plantuml');
      expect(mockHttps.get).toHaveBeenCalledTimes(2);
    });

    it('handles HTTP error status codes', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();

      const mockRequest = {
        on: vi.fn((_event: string, _handler: (...args: any[]) => any) => mockRequest),
      };

      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callback({
          statusCode: 404,
          headers: {},
        });
        return mockRequest;
      });

      await expect(toolManager.findPlantUML(mockLogger)).rejects.toThrow(/HTTP 404/);
    });
  });

  describe('edge cases', () => {
    it('handles Windows platform for Structurizr detection', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      mockChildProcess.execSync = vi.fn((cmd: string) => {
        if (cmd.includes('where')) {
          throw new Error('Not found');
        }
        return '';
      });
      mockFs.existsSync = vi.fn((p: string) => {
        return p.includes('structurizr.bat');
      });
      mockFs.mkdirSync = vi.fn();

      const result = await toolManager.findStructurizrCLI(mockLogger);

      expect(result).toContain('structurizr.bat');
    });

    it('creates cache directory if it does not exist', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn((p: string) => {
        // Simulate cache script exists after we create the directory
        return p.includes('structurizr.sh');
      });
      mockFs.mkdirSync = vi.fn();

      await toolManager.findStructurizrCLI(mockLogger);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.archlette/tools'),
        { recursive: true },
      );
    });

    it('handles chmod on Unix platforms', async () => {
      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();
      mockFs.chmodSync = vi.fn();
      mockFs.unlinkSync = vi.fn();

      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn((stream: any) => stream),
        headers: {},
      };
      const mockRequest = {
        on: vi.fn((_event: string, _handler: (...args: any[]) => any) => mockRequest),
      };
      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return mockRequest;
      });

      const mockWriteStream = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'finish') {
            setTimeout(() => _handler(), 0);
          }
          return mockWriteStream;
        }),
        close: vi.fn(),
      };
      mockFs.createWriteStream = vi.fn(() => mockWriteStream);

      let callCount = 0;
      mockFs.existsSync = vi.fn(() => {
        callCount++;
        return callCount > 2;
      });

      mockChildProcess.execSync = vi.fn((cmd: string) => {
        if (cmd.includes('which')) {
          throw new Error('Not found');
        }
        return '';
      });

      await toolManager.findStructurizrCLI(mockLogger);

      // Verify chmod was called (Unix only)
      expect(mockFs.chmodSync).toHaveBeenCalled();
    });

    it('does not call chmod on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      mockChildProcess.execSync = vi.fn(() => {
        throw new Error('Not found');
      });
      mockFs.existsSync = vi.fn(() => false);
      mockFs.mkdirSync = vi.fn();
      mockFs.chmodSync = vi.fn();
      mockFs.unlinkSync = vi.fn();

      const mockResponse = {
        statusCode: 200,
        pipe: vi.fn((stream: any) => stream),
        headers: {},
      };
      const mockRequest = {
        on: vi.fn((_event: string, _handler: (...args: any[]) => any) => mockRequest),
      };
      mockHttps.get = vi.fn((url: string, callback: (response: any) => void) => {
        callback(mockResponse);
        return mockRequest;
      });

      const mockWriteStream = {
        on: vi.fn((event: string, _handler: (...args: any[]) => any) => {
          if (event === 'finish') {
            setTimeout(() => _handler(), 0);
          }
          return mockWriteStream;
        }),
        close: vi.fn(),
      };
      mockFs.createWriteStream = vi.fn(() => mockWriteStream);

      let callCount = 0;
      mockFs.existsSync = vi.fn(() => {
        callCount++;
        return callCount > 2;
      });

      mockChildProcess.execSync = vi.fn((cmd: string) => {
        if (cmd.includes('where')) {
          throw new Error('Not found');
        }
        // Mock PowerShell expand-archive
        return '';
      });

      await toolManager.findStructurizrCLI(mockLogger);

      // Verify chmod was NOT called on Windows
      expect(mockFs.chmodSync).not.toHaveBeenCalled();
    });
  });
});
