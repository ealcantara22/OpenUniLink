import { interpolateCurve } from '../core/curves';
import { createLogger } from '../core/logging';
import type { SensorProvider } from '../core/sensors';
import type { RootConfig } from '../core/types';
import type { Driver } from '../drivers/types';

/**
 * Continuously runs the OpenUniLink service loop, managing drivers and sensors
 * based on the active configuration profile. The loop will read sensor data,
 * calculate appropriate PWM values for the drivers based on predefined curves,
 * and set lighting configurations accordingly. Any errors in the loop are
 * logged.
 *
 * @param {RootConfig} cfg - The root configuration object containing daemon settings,
 *                           active profile, and cluster configurations for the drivers.
 * @param {Driver[]} drivers - An array of driver instances responsible for managing
 *                             hardware components, such as fans or LEDs.
 * @param {SensorProvider} sensors - A sensor provider instance used to retrieve
 *                                    temperature readings or other metrics.
 * @return {Promise<void>} A promise that resolves when the service loop is initiated
 *                         and runs indefinitely or is manually terminated.
 */
export async function runServiceLoop(
  cfg: RootConfig,
  drivers: Driver[],
  sensors: SensorProvider,
): Promise<void> {
  const logger = createLogger(cfg.daemon.logLevel);
  const profile = cfg.profiles[cfg.activeProfile];

  logger.info({ profile: cfg.activeProfile }, 'Starting OpenUniLink service loop');

  while (true) {
    try {
      const temps = await sensors.readTemps();
      const cpuTemp = temps.cpuTempC;

      // For now, just CPU for everything
      for (const driver of drivers) {
        const clusterCfg = profile.clusters[driver.role];

        if (!clusterCfg) continue;

        const temp = cpuTemp ?? 30;
        const pwm = interpolateCurve(clusterCfg.curve.curve, temp);

        await driver.setPwmPercent(pwm);
        await driver.setLighting(clusterCfg.lighting);
      }
    } catch (err) {
      logger.error({ err }, 'Error in service loop');
    }

    await new Promise(r => setTimeout(r, cfg.daemon.intervalMs));
  }
}
