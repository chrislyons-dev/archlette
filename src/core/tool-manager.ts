/**
 * Tool management for external rendering tools
 *
 * @module core
 * @description
 * Manages external tools (Structurizr CLI, PlantUML) with a hybrid approach:
 * 1. Check system PATH for existing installations
 * 2. Check Archlette cache (~/.archlette/tools/)
 * 3. Auto-download to cache on first use
 *
 * Requires Java runtime to be installed (documented separately).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as https from 'node:https';
import { execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import type { Logger } from './types.js';

/**
 * Tool versions pinned for reproducibility
 */
const TOOL_VERSIONS = {
  structurizr: '2025.05.28',
  plantuml: '1.2025.8',
} as const;

/**
 * Download URLs for tools
 */
const TOOL_URLS = {
  structurizr: `https://github.com/structurizr/cli/releases/download/v${TOOL_VERSIONS.structurizr}/structurizr-cli.zip`,
  plantuml: `https://github.com/plantuml/plantuml/releases/download/v${TOOL_VERSIONS.plantuml}/plantuml-${TOOL_VERSIONS.plantuml}.jar`,
} as const;

/**
 * Tool configuration
 */
export interface ToolConfig {
  /** Tool name */
  name: string;
  /** Download URL */
  url: string;
  /** Version */
  version: string;
  /** Cache subdirectory name */
  cacheDir: string;
  /** Executable name in PATH (for detection) */
  executableName: string;
  /** Relative path to executable within cache */
  executablePath: string;
}

/**
 * Get the Archlette cache directory
 */
export function getCacheDir(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.archlette', 'tools');
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): string {
  const cacheDir = getCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Check if a command exists in PATH
 */
function commandExistsInPath(command: string): string | null {
  const isWindows = process.platform === 'win32';
  const whichCommand = isWindows ? 'where' : 'which';

  try {
    const result = execSync(`${whichCommand} ${command}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const execPath = result.trim().split('\n')[0];
    return execPath || null;
  } catch {
    return null;
  }
}

/**
 * Download a file from URL to destination
 */
async function downloadFile(url: string, dest: string, log?: Logger): Promise<void> {
  log?.debug(`Downloading ${url} to ${dest}`);

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, dest, log).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = createWriteStream(dest);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlinkSync(dest);
          reject(err);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Extract a ZIP file (simple extraction for Structurizr CLI)
 */
async function extractZip(
  zipPath: string,
  destDir: string,
  log?: Logger,
): Promise<void> {
  log?.debug(`Extracting ${zipPath} to ${destDir}`);

  // Use native unzip on Unix, expand-archive on Windows
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    execSync(
      `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      {
        stdio: 'ignore',
      },
    );
  } else {
    execSync(`unzip -q -o "${zipPath}" -d "${destDir}"`, {
      stdio: 'ignore',
    });
  }
}

/**
 * Make file executable (Unix only)
 */
function makeExecutable(filePath: string): void {
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o755);
  }
}

/**
 * Download and install Structurizr CLI to cache
 */
async function downloadStructurizr(cacheDir: string, log?: Logger): Promise<string> {
  const toolDir = path.join(cacheDir, `structurizr-cli-${TOOL_VERSIONS.structurizr}`);
  const zipPath = path.join(cacheDir, 'structurizr-cli.zip');

  log?.info(`Downloading Structurizr CLI ${TOOL_VERSIONS.structurizr}...`);

  try {
    // Download ZIP
    await downloadFile(TOOL_URLS.structurizr, zipPath, log);

    // Extract
    await extractZip(zipPath, toolDir, log);

    // Make scripts executable
    const isWindows = process.platform === 'win32';
    const scriptPath = path.join(
      toolDir,
      isWindows ? 'structurizr.bat' : 'structurizr.sh',
    );

    if (fs.existsSync(scriptPath)) {
      makeExecutable(scriptPath);
    }

    // Clean up ZIP
    fs.unlinkSync(zipPath);

    log?.info(`✓ Structurizr CLI installed to ${toolDir}`);
    return scriptPath;
  } catch (err) {
    log?.error('Failed to download Structurizr CLI:', err);
    throw new Error(`Structurizr CLI download failed: ${err}`);
  }
}

/**
 * Download and install PlantUML to cache
 */
async function downloadPlantUML(cacheDir: string, log?: Logger): Promise<string> {
  const jarPath = path.join(cacheDir, `plantuml-${TOOL_VERSIONS.plantuml}.jar`);

  if (fs.existsSync(jarPath)) {
    log?.debug(`PlantUML already exists at ${jarPath}`);
    return jarPath;
  }

  log?.info(`Downloading PlantUML ${TOOL_VERSIONS.plantuml}...`);

  try {
    await downloadFile(TOOL_URLS.plantuml, jarPath, log);
    log?.info(`✓ PlantUML installed to ${jarPath}`);
    return jarPath;
  } catch (err) {
    log?.error('Failed to download PlantUML:', err);
    throw new Error(`PlantUML download failed: ${err}`);
  }
}

/**
 * Find or download Structurizr CLI
 *
 * @param log - Optional logger
 * @returns Path to structurizr executable/script
 */
export async function findStructurizrCLI(log?: Logger): Promise<string> {
  log?.debug('Looking for Structurizr CLI...');

  // 1. Check system PATH
  const isWindows = process.platform === 'win32';
  const pathCommand = isWindows ? 'structurizr.bat' : 'structurizr.sh';
  const systemPath = commandExistsInPath(pathCommand);

  if (systemPath) {
    log?.debug(`Found Structurizr CLI in PATH: ${systemPath}`);
    return systemPath;
  }

  // 2. Check cache
  const cacheDir = ensureCacheDir();
  const cachedToolDir = path.join(
    cacheDir,
    `structurizr-cli-${TOOL_VERSIONS.structurizr}`,
  );
  const cachedScript = path.join(
    cachedToolDir,
    isWindows ? 'structurizr.bat' : 'structurizr.sh',
  );

  if (fs.existsSync(cachedScript)) {
    log?.debug(`Found Structurizr CLI in cache: ${cachedScript}`);
    return cachedScript;
  }

  // 3. Download to cache
  log?.debug('Structurizr CLI not found, downloading...');
  return await downloadStructurizr(cacheDir, log);
}

/**
 * Find or download PlantUML JAR
 *
 * @param log - Optional logger
 * @returns Path to plantuml.jar
 */
export async function findPlantUML(log?: Logger): Promise<string> {
  log?.debug('Looking for PlantUML...');

  // 1. Check system PATH (for plantuml wrapper script)
  const systemPath = commandExistsInPath('plantuml');
  if (systemPath) {
    log?.debug(`Found PlantUML in PATH: ${systemPath}`);
    return systemPath;
  }

  // 2. Check cache
  const cacheDir = ensureCacheDir();
  const cachedJar = path.join(cacheDir, `plantuml-${TOOL_VERSIONS.plantuml}.jar`);

  if (fs.existsSync(cachedJar)) {
    log?.debug(`Found PlantUML in cache: ${cachedJar}`);
    return cachedJar;
  }

  // 3. Download to cache
  log?.debug('PlantUML not found, downloading...');
  return await downloadPlantUML(cacheDir, log);
}

/**
 * Verify Java is available
 *
 * @returns Java version string if available, null otherwise
 */
export function checkJava(): string | null {
  try {
    // java -version outputs to stderr, so redirect stderr to stdout
    const result = execSync('java -version 2>&1', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const output = result.trim();
    // Check if output contains version info (not empty)
    if (output && (output.includes('version') || output.includes('openjdk'))) {
      return output;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate Java is installed (throw if not)
 */
export function requireJava(): void {
  const javaVersion = checkJava();
  if (!javaVersion) {
    throw new Error(
      [
        'Java runtime not found. Archlette requires Java for rendering diagrams.',
        '',
        'Installation instructions:',
        '• macOS: brew install openjdk',
        '• Ubuntu: sudo apt-get install openjdk-17-jre',
        '• Windows: Download from https://adoptium.net/',
        '',
        'After installation, verify with: java -version',
      ].join('\n'),
    );
  }
}
