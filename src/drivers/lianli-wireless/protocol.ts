import type { LightingConfig } from '../../core/types';
import type { LianLiWirelessControllerInfo } from './controllerDiscovery';
import { LianLiWirelessRfTransport } from './rfTransport';

export interface WirelessReceiverInfo {
  mac: string;
  masterMac: string;
  channel: number;
  deviceType: string; // e.g. 'sl-fan', 'tl-fan', 'lcd', etc.
}

export class LianLiWirelessProtocol {
  private transport: LianLiWirelessRfTransport;
  private initialized = false;

  constructor(controllerInfo: LianLiWirelessControllerInfo) {
    this.transport = new LianLiWirelessRfTransport(controllerInfo);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.transport.open();
    // TODO: perform any required RF handshake here if uwscli does one
    this.initialized = true;
  }

  async listReceivers(): Promise<WirelessReceiverInfo[]> {
    await this.init();
    // TODO:
    //  - send "enumerate receivers" command frame(s) via this.transport.sendFrame(...)
    //  - read responses via this.transport.receiveFrame(...)
    //  - parse into WirelessReceiverInfo[]
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
    // TODO:
    //  - map 0–100% to protocol PWM range
    //  - build RF frame(s) targeting the given MACs
    //  - this.transport.sendFrame(frame)
    void macs;
    void pwmPercent;
  }

  async setLighting(
    macs: string[],
    config?: LightingConfig,
  ): Promise<void> {
    await this.init();
    // TODO:
    //  - build lighting RF frame(s) from LightingConfig
    //  - this.transport.sendFrame(frame)
    void macs;
    void config;
  }

  async readState(macs: string[]): Promise<{ rpm?: number }> {
    await this.init();
    // TODO:
    //  - query RPM state if protocol supports it
    //  - parse responses
    void macs;
    return {};
  }
}
