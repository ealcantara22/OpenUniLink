import { discoverDevices } from '../../drivers';

/**
 * Handles the process of discovering available devices and logs detailed information about them.
 * The function retrieves a list of devices, and if any devices are found, it prints their types, IDs, descriptions,
 * and additional details to the console. If no devices are found, it outputs a relevant message.
 *
 * @async
 * @return {Promise<void>} Resolves when the discovery process is completed and the device information is logged.
 */
export default async function discoverHandler(): Promise<void> {
  const devices = await discoverDevices();

  if (devices.length === 0) {
    console.log('No supported devices found.');
    return;
  }

  console.log('Discovered devices:\n');
  console.log('TYPE              ID        DESCRIPTION');
  console.log('-----------------------------------------------');

  for (const d of devices) {
    console.log(
      `${d.driverType.padEnd(18)} ${d.id.padEnd(8)} ${d.description}`,
    );
  }

  console.log('\nDetails:');
  for (const d of devices) {
    console.log(`\n[${d.driverType} / ${d.id}]`);
    for (const [k, v] of Object.entries(d.details)) {
      console.log(`  ${k}: ${v}`);
    }
  }
}
