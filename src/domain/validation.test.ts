import { describe, it, expect } from 'vitest';
import { validateNewRequest } from './validation';
import type { AppState } from './types';

const sampleState: AppState = {
  schemaVersion: 1,
  devices: [
    { id: 'TB-01', name: 'Máy ảnh Lumix G7', category: 'Máy ảnh', status: 'available', note: 'Kèm pin' },
    { id: 'TB-02', name: 'Chân máy mini', category: 'Phụ kiện', status: 'borrowed', note: 'Dự kiến trả' },
    { id: 'TB-03', name: 'Micro USB', category: 'Âm thanh', status: 'available', note: 'Ghi âm' },
    { id: 'TB-04', name: 'Đèn LED để bàn', category: 'Ánh sáng', status: 'maintenance', note: 'Bảo trì' },
  ],
  requests: [
    { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending', createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved', createdAt: '2026-11-01T00:00:00.000Z' },
  ],
  nextRequestSeq: 103,
};

const validInput = {
  borrower: 'Dũng Hoàng',
  deviceId: 'TB-01',
  startDate: '2026-11-26',
  endDate: '2026-11-27',
};

describe('validation', () => {
  it('UT-VA-01: tên rỗng hoặc chỉ khoảng trắng -> NAME_REQUIRED', () => {
    const res = validateNewRequest({ ...validInput, borrower: '   ' }, sampleState);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.map((e) => e.code)).toContain('NAME_REQUIRED');
  });

  it('UT-VA-02: tên 1 ký tự -> NAME_TOO_SHORT; 61 ký tự -> NAME_TOO_LONG', () => {
    const shortRes = validateNewRequest({ ...validInput, borrower: 'A' }, sampleState);
    const longRes = validateNewRequest({ ...validInput, borrower: 'A'.repeat(61) }, sampleState);
    expect(shortRes.ok).toBe(false);
    expect(longRes.ok).toBe(false);
    if (!shortRes.ok) expect(shortRes.errors[0]?.code).toBe('NAME_TOO_SHORT');
    if (!longRes.ok) expect(longRes.errors[0]?.code).toBe('NAME_TOO_LONG');
  });

  it('UT-VA-03: chuẩn hóa khoảng trắng tên người mượn', () => {
    const res = validateNewRequest({ ...validInput, borrower: '  An   Nguyễn  ' }, sampleState);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.borrower).toBe('An Nguyễn');
  });

  it('UT-VA-04: tên chứa <script> vẫn hợp lệ và lưu nguyên văn', () => {
    const res = validateNewRequest({ ...validInput, borrower: '<script>alert(1)</script>' }, sampleState);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.borrower).toBe('<script>alert(1)</script>');
  });

  it('UT-VA-05/06/07: kiểm tra thiết bị rỗng, không tồn tại, bảo trì', () => {
    const r1 = validateNewRequest({ ...validInput, deviceId: '' }, sampleState);
    const r2 = validateNewRequest({ ...validInput, deviceId: 'TB-99' }, sampleState);
    const r3 = validateNewRequest({ ...validInput, deviceId: 'TB-04' }, sampleState);
    if (!r1.ok) expect(r1.errors[0]?.code).toBe('DEVICE_REQUIRED');
    if (!r2.ok) expect(r2.errors[0]?.code).toBe('DEVICE_NOT_FOUND');
    if (!r3.ok) expect(r3.errors[0]?.code).toBe('DEVICE_UNDER_MAINTENANCE');
  });

  it('UT-VA-08/09/15: kiểm tra thiếu ngày, ngày sai, năm nhuận', () => {
    const rMissing = validateNewRequest({ ...validInput, startDate: '', endDate: '' }, sampleState);
    if (!rMissing.ok) expect(rMissing.errors.map((e) => e.code)).toEqual(['START_REQUIRED', 'END_REQUIRED']);

    const rInvalid = validateNewRequest({ ...validInput, startDate: '2026-02-30', endDate: '2027-02-29' }, sampleState);
    if (!rInvalid.ok) expect(rInvalid.errors.map((e) => e.code)).toEqual(['DATE_INVALID', 'DATE_INVALID']);

    const rLeap = validateNewRequest({ ...validInput, startDate: '2028-02-29', endDate: '2028-02-29' }, sampleState);
    expect(rLeap.ok).toBe(true);
  });

  it('UT-VA-10/11: ngày trả trước ngày mượn bị chặn; bằng ngày mượn hợp lệ', () => {
    const rBefore = validateNewRequest({ ...validInput, startDate: '2026-11-25', endDate: '2026-11-24' }, sampleState);
    if (!rBefore.ok) expect(rBefore.errors[0]?.code).toBe('END_BEFORE_START');

    const rSame = validateNewRequest({ ...validInput, startDate: '2026-11-25', endDate: '2026-11-25' }, sampleState);
    expect(rSame.ok).toBe(true);
  });

  it('UT-VA-12: trùng yêu cầu Đã duyệt/Đang mượn -> SCHEDULE_CONFLICT kèm thông tin', () => {
    const res = validateNewRequest({ ...validInput, deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-22' }, sampleState);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors[0]?.code).toBe('SCHEDULE_CONFLICT');
      expect(res.errors[0]?.params?.reqId).toBe('YC-102');
    }
  });

  it('UT-VA-13: trùng yêu cầu Chờ duyệt -> hợp lệ kèm cảnh báo OVERLAPS_PENDING', () => {
    const res = validateNewRequest({ ...validInput, deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23' }, sampleState);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.warnings[0]?.code).toBe('OVERLAPS_PENDING');
  });

  it('UT-VA-14: nhiều lỗi cùng lúc trả về tất cả lỗi', () => {
    const res = validateNewRequest({ borrower: '', deviceId: 'TB-01', startDate: '2026-11-25', endDate: '2026-11-24' }, sampleState);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.map((e) => e.code)).toEqual(['NAME_REQUIRED', 'END_BEFORE_START']);
    }
  });
});
