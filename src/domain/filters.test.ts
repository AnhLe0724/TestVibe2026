import { describe, it, expect } from 'vitest';
import { filterDevices, getDeviceCategories } from './filters';
import type { Device } from './types';

const devices: Device[] = [
  { id: 'TB-01', name: 'Máy ảnh Lumix G7', category: 'Máy ảnh', status: 'available', note: '' },
  { id: 'TB-02', name: 'Chân máy mini', category: 'Phụ kiện', status: 'borrowed', note: '' },
  { id: 'TB-03', name: 'Micro USB', category: 'Âm thanh', status: 'available', note: '' },
  { id: 'TB-04', name: 'Đèn LED để bàn', category: 'Ánh sáng', status: 'maintenance', note: '' },
  { id: 'TB-05', name: 'Tripod cao', category: 'Phụ kiện', status: 'available', note: '' },
];

describe('filters', () => {
  it('UT-FI-01: lọc theo tình trạng Sẵn sàng', () => {
    expect(filterDevices(devices, { status: 'available', category: 'all' }).map((d) => d.id)).toEqual([
      'TB-01',
      'TB-03',
      'TB-05',
    ]);
  });

  it('UT-FI-02: lọc theo loại Phụ kiện', () => {
    expect(filterDevices(devices, { status: 'all', category: 'Phụ kiện' }).map((d) => d.id)).toEqual([
      'TB-02',
      'TB-05',
    ]);
  });

  it('UT-FI-03: lọc kết hợp Sẵn sàng + Phụ kiện', () => {
    expect(filterDevices(devices, { status: 'available', category: 'Phụ kiện' }).map((d) => d.id)).toEqual([
      'TB-05',
    ]);
  });

  it('UT-FI-04: sinh danh sách loại từ dữ liệu, không trùng, thứ tự ổn định', () => {
    expect(getDeviceCategories(devices)).toEqual(['Máy ảnh', 'Phụ kiện', 'Âm thanh', 'Ánh sáng']);
  });
});
