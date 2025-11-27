import { loadConfig } from '../core/config';
import { createSensorProvider } from '../core/sensors';
import { createDrivers } from '../drivers';
import { runServiceLoop } from './serviceLoop';

/**
 * Initializes and runs the main daemon process, setting up configuration, sensors, and drivers,
 * and entering the service loop to handle ongoing operations.
 *
 * @param {string} configPath - The file path to the configuration file.
 * @return {Promise<void>} A promise that resolves when the daemon process is completed.
 */
export async function mainDaemon(configPath: string): Promise<void> {
  const cfg = loadConfig(configPath);
  const sensors = createSensorProvider(cfg);
  const drivers = createDrivers(cfg.drivers);

  // init drivers (open USB etc.)
  for (const d of drivers) {
    await d.init();
  }

  await runServiceLoop(cfg, drivers, sensors);
}
