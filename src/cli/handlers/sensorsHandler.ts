import { loadConfig } from '../../core/config';
import { createSensorProvider } from '../../core/sensors';

/**
 * Handles sensor operations, including reading temperature data from CPU and GPU sensors,
 * and logging the results for display. Logs errors in case of failure.
 *
 * @param {Object} opts - Options for configuring the sensor handler.
 * @param {string} opts.config - The configuration file path to initialize the sensor provider.
 * @return {Promise<void>} A promise that resolves once the sensor data has been processed and logged.
 */
export default async function sensorsHandler(opts: { config: string }): Promise<void> {
  const cfg = loadConfig(opts.config);
  const sensors = createSensorProvider(cfg);

  try {
    const temps = await sensors.readTemps();

    console.log('Sensor readings:');
    if (temps.cpuTempC !== undefined) {
      console.log(`  CPU: ${temps.cpuTempC.toFixed(1)} °C`);
    } else {
      console.log('  CPU: (not available)');
    }

    if (temps.gpuTempC !== undefined) {
      console.log(`  GPU: ${temps.gpuTempC.toFixed(1)} °C`);
    } else {
      console.log('  GPU: (not available)');
    }
  } catch (err) {
    console.error('Error reading sensors:', err);
    process.exitCode = 1;
  }
}
