import type {
  DriverInstanceConfig,
  FanClusterState,
  LightingConfig,
} from '../core/types';

export interface Driver {
  id: string;
  role: string;
  init(): Promise<void>;
  setPwmPercent(percent: number): Promise<void>;
  setLighting(config: LightingConfig | undefined): Promise<void>;
  getState(): Promise<FanClusterState>;
}

export interface DiscoveredDevice {
  driverType: string; // e.g. 'lianli-wireless'
  id: string; // local ID (like 'llw-1')
  description: string; // human-readable
  details: Record<string, unknown>; // vendor-specific details (mac, channel, etc.)
}

export interface DriverFactory {
  type: string; // e.g. 'lianli-wireless'

  // Create a driver instance given config
  create(config: DriverInstanceConfig): Driver;

  // Optional discovery hook: list devices for this driver type
  discover?(): Promise<DiscoveredDevice[]>;
}
