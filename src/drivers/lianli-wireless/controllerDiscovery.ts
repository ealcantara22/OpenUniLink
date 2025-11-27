import HID from 'node-hid';

export interface LianLiWirelessControllerInfo {
  id: string; // e.g. 'llw-ctrl-1'
  vendorId: number;
  productId: number;
  path?: string;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  seriesHint?: string;
}

// Central place for supported VID/PIDs.
const SUPPORTED_WIRELESS_VIDS = [0x0416]; // Winbond used by Lian Li
const SUPPORTED_WIRELESS_PIDS = [0x8040, 0x8041]; // example from TL docs; extend as needed

/**
 * Discovers and retrieves information about a connected Lian Li Wireless Controller.
 * Searches through available HID devices that match supported vendor and product IDs.
 * If multiple controllers are detected, a warning is logged, and only the first one is returned.
 *
 * @return {LianLiWirelessControllerInfo | null} Information about the discovered wireless controller, or null if none is found.
 */
export function discoverLianLiWirelessController():
  LianLiWirelessControllerInfo | null {
  const devices = HID.devices();

  const matches = devices.filter(d => {
    const vid = d.vendorId ?? 0;
    const pid = d.productId ?? 0;

    return SUPPORTED_WIRELESS_VIDS.includes(vid)
      && SUPPORTED_WIRELESS_PIDS.includes(pid);
  });

  if (matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    // This *shouldn't* happen in normal Lian Li setups,
    // but if it does, pick the first and warn.
    console.warn(
      `OpenUniLink: found ${matches.length} L-Wireless controllers; `
      + 'using the first one. This configuration is not officially supported.',
    );
  }

  const m = matches[0];
  const product = m.product?.toLowerCase() ?? '';
  let seriesHint: string | undefined;

  if (product.includes('tl')) seriesHint = 'tl';
  else if (product.includes('sl')) seriesHint = 'sl';

  return {
    id: 'llw-ctrl-1',
    vendorId: m.vendorId ?? 0,
    productId: m.productId ?? 0,
    path: m.path,
    manufacturer: m.manufacturer,
    product: m.product,
    serialNumber: m.serialNumber,
    seriesHint,
  };
}
