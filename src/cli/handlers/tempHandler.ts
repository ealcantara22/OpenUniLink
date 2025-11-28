import { loadConfig } from '../../core/config';
import { createSensorProvider } from '../../core/sensors';

/**
 * Handles temperature reading by loading configuration, creating a sensor provider,
 * and reading temperature data asynchronously.
 *
 * @param {Object} opts -
 * @param {string} opts.config - The configuration path or identifier required
 *                                for setting up the sensor provider.
 * @return {Promise<void>} A promise that resolves once the temperature readings
 *                         are logged successfully.
 */
export default async function tempHandler(opts: { config: string }): Promise<void> {
  const cfg = loadConfig(opts.config);
  const sensors = createSensorProvider(cfg);
  const temps = await sensors.readTemps();

  console.log(temps);
}
