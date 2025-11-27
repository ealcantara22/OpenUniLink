import { loadConfig } from '../../core/config';
import { createDrivers } from '../../drivers';

/**
 * Handles a list of drivers based on the provided configuration.
 *
 * @param {Object} opts - The options for the function.
 * @param {string} opts.config - The path to the configuration file used to load driver information.
 * @return {Promise<void>} A promise that resolves when the function completes execution.
 */
export default async function listHandler(opts: { config: string }): Promise<void> {
  const cfg = loadConfig(opts.config);
  const drivers = createDrivers(cfg.drivers);

  for (const d of drivers) {
    console.log(`${d.id} (${d.role})`);
  }
}
