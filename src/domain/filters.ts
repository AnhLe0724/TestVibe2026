import type { Device, DeviceStatus } from './types';

export interface DeviceFilterCriteria {
  status: DeviceStatus | 'all';
  category: string | 'all';
}

export const filterDevices = (
  devices: readonly Device[],
  criteria: DeviceFilterCriteria,
): Device[] =>
  devices.filter((d) => {
    if (criteria.status !== 'all' && d.status !== criteria.status) return false;
    if (criteria.category !== 'all' && d.category !== criteria.category) return false;
    return true;
  });

export const getDeviceCategories = (devices: readonly Device[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const d of devices) {
    if (!seen.has(d.category)) {
      seen.add(d.category);
      result.push(d.category);
    }
  }
  return result;
};
