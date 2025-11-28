import { usb } from 'usb';

export interface ControllerEndpointRef {
  productId: number;
  busNumber: number;
  deviceAddress: number;
}

export interface LianLiWirelessControllerInfo {
  id: string; // logical ID, e.g. 'llw-ctrl-1'
  vendorId: number; // 0x0416 (decimal 1046)
  tx?: ControllerEndpointRef; // transmitter USB function
  rx?: ControllerEndpointRef; // receiver USB function
  // Optional, but nice to have if I can get them:
  // manufacturer?: string;
  // product?: string;
  // serialNumber?: string;
  // seriesHint?: string; // 'tl' / 'sl' etc.
}

const VENDOR_WINBOND = 0x0416;

// TX and RX device IDs for a UNI SL120 Wireless Controller
// 1046:32832 -> 0x0416:0x8040 (TX)
// 1046:32833 -> 0x0416:0x8041 (RX)
const PRODUCT_TX = 0x8040;
const PRODUCT_RX = 0x8041;

/**
 * Discovers and identifies a Lian Li wireless controller connected to the system via USB.
 * The method searches for TX and RX devices matching the known vendor and product IDs for the controller.
 * If both TX and RX devices are found, their details are included in the returned information object.
 * If no devices are found, it returns null.
 * In case of multiple TX or RX devices, only the first of each is used.
 *
 * @return {LianLiWirelessControllerInfo | null} An object containing details of the discovered Lian Li wireless controller, or null if no such controller is found.
 */
export function discoverLianLiWirelessController(): LianLiWirelessControllerInfo | null {
  const devices = usb.getDeviceList();

  const txCandidates = devices.filter(dev => {
    const desc = dev.deviceDescriptor;

    return desc.idVendor === VENDOR_WINBOND
      && desc.idProduct === PRODUCT_TX;
  });

  const rxCandidates = devices.filter(dev => {
    const desc = dev.deviceDescriptor;

    return desc.idVendor === VENDOR_WINBOND
      && desc.idProduct === PRODUCT_RX;
  });

  if (txCandidates.length === 0 && rxCandidates.length === 0) {
    // No wireless controller present
    return null;
  }

  if (txCandidates.length > 1 || rxCandidates.length > 1) {
    console.warn(
      `OpenUniLink: multiple TX (${txCandidates.length}) or RX `
      + `(${rxCandidates.length}) devices found; `
      + 'only one kit per PC is officially supported, using the first of each.',
    );
  }

  const txDev = txCandidates[0];
  const rxDev = rxCandidates[0];

  const info: LianLiWirelessControllerInfo = {
    id: 'llw-ctrl-1',
    vendorId: VENDOR_WINBOND,
  };

  if (txDev) {
    info.tx = {
      productId: PRODUCT_TX,
      busNumber: txDev.busNumber,
      deviceAddress: txDev.deviceAddress,
    };
  }

  if (rxDev) {
    info.rx = {
      productId: PRODUCT_RX,
      busNumber: rxDev.busNumber,
      deviceAddress: rxDev.deviceAddress,
    };
  }

  return info;
}
