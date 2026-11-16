import type { Device, DeviceStatus } from './types';

export type DeviceStats = Record<DeviceStatus, number>;

export const computeDeviceStats = (devices: readonly Device[]): DeviceStats => {
  const stats: DeviceStats = { available: 0, borrowed: 0, maintenance: 0 };
  for (const d of devices) {
    stats[d.status] += 1;
  }
  return stats;
};
