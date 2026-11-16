import { describe, it, expect } from 'vitest';
import { findConflict, rangesOverlap } from './overlap';
import type { BorrowRequest } from './types';

const makeReq = (overrides: Partial<BorrowRequest>): BorrowRequest => ({
  id: 'YC-1',
  borrower: 'An',
  deviceId: 'TB-01',
  startDate: '2026-11-21',
  endDate: '2026-11-22',
  status: 'approved',
  createdAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

describe('overlap', () => {
  it('UT-OV-01: trùng hoàn toàn', () => {
    expect(
      rangesOverlap({ start: '2026-11-21', end: '2026-11-22' }, { start: '2026-11-21', end: '2026-11-22' }),
    ).toBe(true);
  });

  it('UT-OV-02: chạm đầu mút (D1 đóng hai đầu) là trùng', () => {
    expect(
      rangesOverlap({ start: '2026-11-21', end: '2026-11-22' }, { start: '2026-11-22', end: '2026-11-23' }),
    ).toBe(true);
  });

  it('UT-OV-03: liền kề không chạm', () => {
    expect(
      rangesOverlap({ start: '2026-11-21', end: '2026-11-21' }, { start: '2026-11-22', end: '2026-11-22' }),
    ).toBe(false);
  });

  it('UT-OV-04: chứa nhau', () => {
    expect(
      rangesOverlap({ start: '2026-11-20', end: '2026-11-25' }, { start: '2026-11-22', end: '2026-11-23' }),
    ).toBe(true);
  });

  it('UT-OV-05: cách xa', () => {
    expect(
      rangesOverlap({ start: '2026-11-10', end: '2026-11-11' }, { start: '2026-11-21', end: '2026-11-22' }),
    ).toBe(false);
  });

  it('UT-OV-06: đối xứng khi hoán đổi A, B', () => {
    const pairs = [
      [{ start: '2026-11-21', end: '2026-11-22' }, { start: '2026-11-22', end: '2026-11-23' }],
      [{ start: '2026-11-21', end: '2026-11-21' }, { start: '2026-11-22', end: '2026-11-22' }],
      [{ start: '2026-11-20', end: '2026-11-25' }, { start: '2026-11-22', end: '2026-11-23' }],
      [{ start: '2026-11-10', end: '2026-11-11' }, { start: '2026-11-21', end: '2026-11-22' }],
    ] as const;
    for (const [a, b] of pairs) {
      expect(rangesOverlap(a, b)).toBe(rangesOverlap(b, a));
    }
  });

  it('UT-OV-07: qua ranh tháng', () => {
    expect(
      rangesOverlap({ start: '2026-11-30', end: '2026-12-02' }, { start: '2026-12-01', end: '2026-12-01' }),
    ).toBe(true);
  });

  it('UT-OV-08: qua ranh năm', () => {
    expect(
      rangesOverlap({ start: '2026-12-31', end: '2027-01-02' }, { start: '2027-01-01', end: '2027-01-01' }),
    ).toBe(true);
  });

  it('UT-OV-09: vét cạn mọi cặp khoảng trong cửa sổ 12 ngày', () => {
    const days = Array.from({ length: 12 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
    const setOf = (s: string, e: string) => new Set(days.filter((d) => d >= s && d <= e));
    for (const s1 of days) {
      for (const e1 of days.filter((d) => d >= s1)) {
        for (const s2 of days) {
          for (const e2 of days.filter((d) => d >= s2)) {
            const aSet = setOf(s1, e1);
            const bSet = setOf(s2, e2);
            const expected = [...aSet].some((d) => bSet.has(d));
            expect(rangesOverlap({ start: s1, end: e1 }, { start: s2, end: e2 })).toBe(expected);
          }
        }
      }
    }
  });

  it('UT-OV-10: findConflict khác thiết bị -> không trùng', () => {
    const reqs = [makeReq({ deviceId: 'TB-02' })];
    expect(findConflict(reqs, { deviceId: 'TB-01', startDate: '2026-11-21', endDate: '2026-11-22' })).toBeUndefined();
  });

  it('UT-OV-11: findConflict bỏ qua pending / returned / rejected', () => {
    const reqs = [
      makeReq({ id: 'YC-1', status: 'pending' }),
      makeReq({ id: 'YC-2', status: 'returned' }),
      makeReq({ id: 'YC-3', status: 'rejected' }),
    ];
    expect(findConflict(reqs, { deviceId: 'TB-01', startDate: '2026-11-21', endDate: '2026-11-22' })).toBeUndefined();
  });

  it('UT-OV-12: findConflict phát hiện approved / borrowing', () => {
    const borrowing = makeReq({ id: 'YC-9', status: 'borrowing' });
    expect(findConflict([borrowing], { deviceId: 'TB-01', startDate: '2026-11-22', endDate: '2026-11-23' })).toEqual(borrowing);
  });

  it('UT-OV-13: findConflict bỏ qua chính candidate.id', () => {
    const self = makeReq({ id: 'YC-103', status: 'borrowing' });
    expect(findConflict([self], { id: 'YC-103', deviceId: 'TB-01', startDate: '2026-11-21', endDate: '2026-11-22' })).toBeUndefined();
  });
});
