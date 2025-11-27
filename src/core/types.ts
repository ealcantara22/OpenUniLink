export type SensorSource = 'cpu' | 'gpu' | 'coolant' | string;

export interface FanCurvePoint {
  tempC: number;
  pwmPercent: number; // 0–100
}

export interface FanCurve {
  points: FanCurvePoint[];
}

export interface ClusterCurveConfig {
  source: SensorSource;
  curve: FanCurvePoint[];
}

export interface LightingConfig {
  mode: 'static' | 'effect';
  color?: [number, number, number]; // RGB 0–255
  effect?: string; // e.g. "rainbow", "twinkle"
  brightness?: number; // 0–255
}

export interface ClusterProfileConfig {
  curve: ClusterCurveConfig;
  lighting?: LightingConfig;
}

export interface ProfileConfig {
  clusters: Record<string, ClusterProfileConfig>; // key = role, e.g. "aio"
}

export interface DriverInstanceConfig {
  id: string; // e.g. "llw-aio"
  type: string; // e.g. "lianli-wireless"
  method?: string; // e.g. "usb"
  macs?: string[]; // device identifiers for that driver
  role: string; // e.g. "aio", "front-intake"
}

export interface DaemonConfig {
  intervalMs: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface RootConfig {
  daemon: DaemonConfig;
  sensors: {
    source: 'systeminformation' | 'lm-sensors';
    cpuLabel?: string;
    gpuLabel?: string;
  };
  drivers: DriverInstanceConfig[];
  profiles: Record<string, ProfileConfig>;
  activeProfile: string;
}

export interface FanClusterState {
  role: string;
  currentPwmPercent: number;
  currentRpm?: number;
}
