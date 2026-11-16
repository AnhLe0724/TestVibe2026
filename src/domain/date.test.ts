import { describe, it, expect } from 'vitest';
import { formatDisplayDate, isValidISODate, parseDisplayDate } from './date';

describe('date', () => {
  it('UT-DT-01: chuyển đổi hai chiều dd/mm/yyyy <-> YYYY-MM-DD', () => {
    expect(parseDisplayDate('22/11/2026')).toBe('2026-11-22');
    expect(formatDisplayDate('2026-11-22')).toBe('22/11/2026');
  });

  it('UT-DT-02: loại bỏ ngày không tồn tại và định dạng sai', () => {
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2027-02-29')).toBe(false);
    expect(isValidISODate('2028-02-29')).toBe(true);
    expect(isValidISODate('abc')).toBe(false);
    expect(parseDisplayDate('30/02/2026')).toBeNull();
    expect(parseDisplayDate('2026-11-22')).toBeNull();
    expect(formatDisplayDate('invalid')).toBe('invalid');
  });
});
