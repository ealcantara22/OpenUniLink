import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { RootConfig } from './types';

/**
 * Loads and parses the configuration file from the specified path. Validates
 * the configuration for required fields and returns the parsed configuration.
 *
 * @param {string} configPath - Path to the configuration file.
 * @return {RootConfig} The parsed and validated configuration object.
 * @throws {Error} If the configuration is invalid or required fields are missing.
 */
export function loadConfig(configPath: string): RootConfig {
  const fullPath = path.resolve(configPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const data = parse(raw) as unknown;

  // TODO: add joi validation.
  const cfg = data as RootConfig;

  if (!cfg.daemon || typeof cfg.daemon.intervalMs !== 'number') {
    throw new Error('Invalid config: daemon.intervalMs is required');
  }
  if (!cfg.activeProfile || !cfg.profiles?.[cfg.activeProfile]) {
    throw new Error('Invalid config: activeProfile missing or unknown');
  }

  return cfg;
}
