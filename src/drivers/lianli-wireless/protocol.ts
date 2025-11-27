import type { LightingConfig } from '../../core/types';
import type { LianLiWirelessControllerInfo } from './controllerDiscovery';
import { LianLiWirelessUsbTransport } from './usbTransport';

export interface WirelessReceiverInfo {
  mac: string; // receiver MAC address
  masterMac: string; // controller/master MAC
  channel: number; // RF channel index
  deviceType: string; // e.g. 'tl-fan', 'sl-fan', 'lcd', etc.
}

export class LianLiWirelessProtocol {
  private transport: LianLiWirelessUsbTransport;
  private initialized = false;

  constructor(controllerInfo: LianLiWirelessControllerInfo) {
    this.transport = new LianLiWirelessUsbTransport(controllerInfo);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.transport.open();
    // TODO: controller handshake, if any, goes here
    this.initialized = true;
  }

  async listReceivers(): Promise<WirelessReceiverInfo[]> {
    await this.init();
    // TODO: implement based on Python uws protocol
    // TODO: send enumerate command(s) and parse into WirelessReceiverInfo[]
    // Placeholder implementation:
    return [
      /*
      {
        mac: "AA:BB:CC:DD:EE:01",
        masterMac: "11:22:33:44:55:00",
        channel: 1,
        deviceType: "fan"
      }
      */
    ];
  }

  async setFanPwm(macs: string[], pwmPercent: number): Promise<void> {
    await this.init();
    // TODO: map 0–100% to protocol PWM value, build RF frames, send via transport
    // TODO:
    //  - map/convert pwmPercent 0–100% to protocol-specific PWM value
    //  - build the RF packet(s) addressed to those MACs
    //  - encrypt if needed
    //  - send via this.transport.sendReport(...)
    void macs;
    void pwmPercent;
  }

  async setLighting(macs: string[], config?: LightingConfig): Promise<void> {
    await this.init();
    // TODO: translate LightingConfig into protocol frames and send via transport
    void macs;
    void config;
  }

  async readState(macs: string[]): Promise<{ rpm?: number }> {
    await this.init();
    // TODO: query / parse responses for RPM, if supported
    void macs;
    return {};
  }
}
