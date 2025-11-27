import type { DriverInstanceConfig } from '../core/types';
import { LianLiWirelessFactory } from './lianli-wireless';
import type {
  DiscoveredDevice,
  Driver,
  DriverFactory,
} from './types';

// Registry of all driver families
const driverFactories: DriverFactory[] = [
  LianLiWirelessFactory,
  // add more factories here later
];

export function getDriverFactories(): DriverFactory[] {
  return driverFactories;
}

/**
 * Creates and returns an array of Driver instances based on the provided configuration.
 *
 * @param {DriverInstanceConfig[]} instances - An array of DriverInstanceConfig objects containing the configuration for each driver.
 * @return {Driver[]} An array of created Driver objects.
 */
export function createDrivers(instances: DriverInstanceConfig[]): Driver[] {
  const drivers: Driver[] = [];

  for (const cfg of instances) {
    const factory = driverFactories.find(f => f.type === cfg.type);

    if (!factory) {
      console.warn(`No driver factory for type "${cfg.type}", skipping`);
      continue;
    }
    drivers.push(factory.create(cfg));
  }

  return drivers;
}

/**
 * Discovers and retrieves a list of devices available from all registered driver factories.
 * Iterates through all driver factories, invoking their discovery methods if applicable.
 *
 * @return {Promise<DiscoveredDevice[]>} A promise that resolves to an array of discovered devices.
 */
export async function discoverDevices(): Promise<DiscoveredDevice[]> {
  const results: DiscoveredDevice[] = [];

  for (const factory of driverFactories) {
    if (!factory.discover) continue;
    const devices = await factory.discover();

    results.push(...devices);
  }

  return results;
}
