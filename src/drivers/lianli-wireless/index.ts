import type { DriverInstanceConfig, LightingConfig } from '../../core/types';
import type { Driver, DriverFactory } from '../types';
import {
  discoverLianLiWirelessController,
  type LianLiWirelessControllerInfo,
} from './controllerDiscovery';
import { discoverLianLiWireless } from './discovery';
import { LianLiWirelessProtocol } from './protocol';

export class LianLiWirelessDriver implements Driver {
  public readonly id: string;
  public readonly role: string;
  private macs: string[];
  private protocol: LianLiWirelessProtocol;
  private lastPwmPercent = 0;

  constructor(
    cfg: DriverInstanceConfig,
    protocol: LianLiWirelessProtocol,
  ) {
    this.id = cfg.id;
    this.role = cfg.role;
    this.macs = cfg.macs ?? [];
    this.protocol = protocol;
  }

  async init(): Promise<void> {
    await this.protocol.init();
  }

  async setPwmPercent(percent: number): Promise<void> {
    this.lastPwmPercent = percent;
    await this.protocol.setFanPwm(this.macs, percent);
  }

  async setLighting(config: LightingConfig | undefined): Promise<void> {
    await this.protocol.setLighting(this.macs, config);
  }

  async getState() {
    const state = await this.protocol.readState(this.macs);

    return {
      role: this.role,
      currentPwmPercent: this.lastPwmPercent,
      currentRpm: state.rpm,
    };
  }
}

let sharedProtocol: LianLiWirelessProtocol | null = null;

/**
 * Retrieves the shared instance of the LianLiWirelessProtocol.
 * If the protocol instance does not already exist, it initializes a new instance
 * using the discovered LianLi Wireless Controller. Throws an error if no controller is found.
 *
 * @return {LianLiWirelessProtocol} The shared instance of the LianLiWirelessProtocol.
 */
function getSharedProtocol(): LianLiWirelessProtocol {
  if (sharedProtocol) return sharedProtocol;

  const ctrl: LianLiWirelessControllerInfo | null = discoverLianLiWirelessController();

  if (!ctrl) {
    throw new Error('No L-Wireless controller found');
  }

  sharedProtocol = new LianLiWirelessProtocol(ctrl);
  return sharedProtocol;
}

/**
 * LianLiWirelessFactory is a factory object responsible for creating and managing
 * instances of LianLi wireless drivers. This factory is primarily used to handle
 * functionality related to the 'lianli-wireless' type of driver, including creation
 * and discovery of compatible devices.
 *
 * Properties:
 * - type: Represents the type of the driver. For this factory, the type is 'lianli-wireless'.
 *
 * Methods:
 * - create(config: DriverInstanceConfig): Creates and returns a new instance of a
 *   LianLiWirelessDriver using the specified configuration and shared protocol.
 *
 * - discover(): Discovers and returns a list of available LianLi wireless devices asynchronously.
 */
export const LianLiWirelessFactory: DriverFactory = {
  type: 'lianli-wireless',

  create(config: DriverInstanceConfig): Driver {
    const proto = getSharedProtocol();

    return new LianLiWirelessDriver(config, proto);
  },

  discover: async () => {
    return await discoverLianLiWireless();
  },
};
