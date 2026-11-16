import { describe, it, expect } from 'vitest';
import { searchRequests } from './search';
import type { BorrowRequest } from './types';

const sampleRequests: BorrowRequest[] = [
  { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending', createdAt: '2026-11-01T00:00:00.000Z' },
  { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved', createdAt: '2026-11-01T00:00:00.000Z' },
  { id: 'YC-103', borrower: 'Đức Phạm', deviceId: 'TB-01', startDate: '2026-11-24', endDate: '2026-11-25', status: 'borrowing', createdAt: '2026-11-01T00:00:00.000Z' },
];

describe('search', () => {
  it('UT-SE-01: tìm theo mã thiết bị (bỏ hoa/thường, dấu gạch, khoảng trắng)', () => {
    for (const q of ['TB-03', 'tb-03', 'tb03', ' TB 03 ']) {
      expect(searchRequests(sampleRequests, q).map((r) => r.id)).toEqual(['YC-102']);
    }
  });

  it('UT-SE-02: tìm theo tên người mượn có/không dấu', () => {
    for (const q of ['binh', 'Bình', 'BÌNH TRẦN']) {
      expect(searchRequests(sampleRequests, q).map((r) => r.id)).toEqual(['YC-102']);
    }
  });

  it('UT-SE-03: xử lý chữ đ/Đ hai chiều', () => {
    expect(searchRequests(sampleRequests, 'đức').map((r) => r.id)).toEqual(['YC-103']);
    expect(searchRequests(sampleRequests, 'duc').map((r) => r.id)).toEqual(['YC-103']);
  });

  it('UT-SE-04: chuỗi rỗng / toàn khoảng trắng trả toàn bộ', () => {
    expect(searchRequests(sampleRequests, '')).toHaveLength(3);
    expect(searchRequests(sampleRequests, '   ')).toHaveLength(3);
  });

  it('UT-SE-05: không khớp -> mảng rỗng', () => {
    expect(searchRequests(sampleRequests, 'không-tồn-tại')).toEqual([]);
  });

  it('UT-SE-06: ký tự đặc biệt (, [, * không ném lỗi', () => {
    expect(() => searchRequests(sampleRequests, '([*+?')).not.toThrow();
    expect(searchRequests(sampleRequests, '([*+?')).toEqual([]);
  });
});
