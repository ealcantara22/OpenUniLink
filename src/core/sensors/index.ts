import si from 'systeminformation';
import type { RootConfig } from '../types';

export interface SensorProvider {
  readTemps(): Promise<{ cpuTempC?: number; gpuTempC?: number }>;
}

/**
 * Creates a sensor provider based on the provided configuration.
 *
 * @param {RootConfig} cfg - The root configuration object used to determine the sensor source.
 * @return {SensorProvider} An object implementing the SensorProvider interface that provides methods for reading sensor data.
 */
export function createSensorProvider(cfg: RootConfig): SensorProvider {
  if (cfg.sensors.source === 'systeminformation') {
    return {
      readTemps: async () => {
        const cpuTempData = await si.cpuTemperature();

        return {
          // TODO: GPU temp support
          cpuTempC: cpuTempData.main ?? undefined,
        };
      },
    };
  }

  // TODO ...
  // if (cfg.sensors.source === "lm-sensors") {}

  return {
    readTemps: async () => ({}),
  };
}
