import type { DiscoveredDevice } from '../types';
import {
  discoverLianLiWirelessController,
  type LianLiWirelessControllerInfo,
} from './controllerDiscovery';
import {
  LianLiWirelessProtocol,
  type WirelessReceiverInfo,
} from './protocol';

export async function discoverLianLiWireless(): Promise<DiscoveredDevice[]> {
  const ctrl: LianLiWirelessControllerInfo | null = discoverLianLiWirelessController();

  if (!ctrl) {
    return [];
  }

  const proto = new LianLiWirelessProtocol(ctrl);
  const receivers: WirelessReceiverInfo[] = await proto.listReceivers();

  const devices: DiscoveredDevice[] = [];

  // Controller entry
  devices.push({
    driverType: 'lianli-wireless',
    id: ctrl.id,
    description: `L-Wireless controller`,
    details: {
      vendorId: ctrl.vendorId,
      // productId: ctrl.productId,
      // manufacturer: ctrl.manufacturer,
      // product: ctrl.product,
      // serialNumber: ctrl.serialNumber,
      // seriesHint: ctrl.seriesHint,
    },
  });

  // Receivers under that controller
  receivers.forEach((r, idx) => {
    devices.push({
      driverType: 'lianli-wireless',
      id: `${ctrl.id}-rx-${idx + 1}`,
      description: `Receiver on channel ${r.channel} (${r.deviceType})`,
      details: {
        controllerId: ctrl.id,
        mac: r.mac,
        masterMac: r.masterMac,
        channel: r.channel,
        deviceType: r.deviceType,
      },
    });
  });

  return devices;
}
