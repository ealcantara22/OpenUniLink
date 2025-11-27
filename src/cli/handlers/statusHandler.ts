import { loadConfig } from '../../core/config';
import { interpolateCurve } from '../../core/curves';
import { createSensorProvider } from '../../core/sensors';
import { createDrivers } from '../../drivers';

/**
 * Handles the status of the system by reading temperature sensors, initializing drivers,
 * and displaying the current cluster configurations and status.
 *
 * @param {Object} opts - Options for the status handler.
 * @param {string} opts.config - The configuration file path to load settings from.
 * @return {Promise<void>} Resolves when the status handling operation is complete.
 */
export default async function statusHandler(opts: { config: string }): Promise<void> {
  const cfg = loadConfig(opts.config);
  const profileName = cfg.activeProfile;
  const profile = cfg.profiles[profileName];

  if (!profile) {
    console.error(`Active profile "${profileName}" not found in config.`);
    process.exitCode = 1;
    return;
  }

  const sensors = createSensorProvider(cfg);
  const temps = await sensors.readTemps();
  const cpuTemp = temps.cpuTempC;

  console.log(`Active profile: ${profileName}`);
  console.log(
    `Temps: CPU=${cpuTemp !== undefined ? cpuTemp.toFixed(1) + ' °C' : '(n/a)'}`,
  );
  console.log('');

  const drivers = createDrivers(cfg.drivers);

  // Init drivers (USB open, etc.)
  for (const d of drivers) {
    await d.init();
  }

  console.log('Clusters:');
  console.log('ROLE           TARGET PWM  CURRENT RPM');
  console.log('--------------------------------------');

  for (const driver of drivers) {
    const clusterCfg = profile.clusters[driver.role];

    if (!clusterCfg) {
      console.log(
        `${driver.role.padEnd(14)} (no cluster config in profile)`,
      );
      continue;
    }

    // FIX: use clusterCfg.curve.curve, not clusterCfg.curve
    const curvePoints = clusterCfg.curve.curve;
    const temp = cpuTemp ?? 30;
    const targetPwm = interpolateCurve(curvePoints, temp);

    let rpmText = '(n/a)';

    try {
      const state = await driver.getState();

      if (state.currentRpm !== undefined) {
        rpmText = `${state.currentRpm} RPM`;
      }
    } catch {
      // ignore for now
    }

    console.log(
      `${driver.role.padEnd(14)} ${String(targetPwm.toFixed(1)).padEnd(10)} ${rpmText}`,
    );
  }
}
