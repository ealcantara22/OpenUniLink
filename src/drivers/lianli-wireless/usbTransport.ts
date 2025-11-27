import HID from 'node-hid';
import type { LianLiWirelessControllerInfo } from './controllerDiscovery';

export class LianLiWirelessUsbTransport {
  private device: HID.HID | null = null;
  private readonly info: LianLiWirelessControllerInfo;

  constructor(info: LianLiWirelessControllerInfo) {
    this.info = info;
  }

  open(): void {
    if (this.device) return;

    if (this.info.path) {
      this.device = new HID.HID(this.info.path);
    } else {
      this.device = new HID.HID(this.info.vendorId, this.info.productId);
    }
  }

  close(): void {
    if (this.device) {
      this.device.close();
      this.device = null;
    }
  }

  sendReport(report: Buffer): void {
    if (!this.device) throw new Error('Device not open');

    // HID often expects a leading report ID; 0x00 if unused
    // TODO: Might need to prepend report ID depending on HID report format
    const data = Buffer.concat([Buffer.from([0x00]), report]);

    this.device.write(Array.from(data));
  }

  read(timeoutMs = 100): Buffer | null {
    if (!this.device) throw new Error('Device not open');

    try {
      const data = this.device.readTimeout(timeoutMs);

      if (!data || data.length === 0) return null;
      return Buffer.from(data);
    } catch {
      return null;
    }
  }
}
