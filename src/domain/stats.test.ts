import { describe, it, expect } from 'vitest';
import { computeDeviceStats } from './stats';
import type { Device } from './types';

describe('stats', () => {
  it('UT-SS-01: thống kê dữ liệu mẫu -> Sẵn sàng 3, Đang mượn 1, Bảo trì 1', () => {
    const devices: Device[] = [
      { id: 'TB-01', name: 'A', category: 'C', status: 'available', note: '' },
      { id: 'TB-02', name: 'B', category: 'C', status: 'borrowed', note: '' },
      { id: 'TB-03', name: 'C', category: 'C', status: 'available', note: '' },
      { id: 'TB-04', name: 'D', category: 'C', status: 'maintenance', note: '' },
      { id: 'TB-05', name: 'E', category: 'C', status: 'available', note: '' },
    ];
    expect(computeDeviceStats(devices)).toEqual({
      available: 3,
      borrowed: 1,
      maintenance: 1,
    });
  });
});
