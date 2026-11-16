import { describe, it, expect } from 'vitest';
import { planStatusChange } from './statusRules';
import type { AppState } from './types';

const makeBtcState = (): AppState => ({
  schemaVersion: 1,
  devices: [
    { id: 'TB-01', name: 'Máy ảnh Lumix G7', category: 'Máy ảnh', status: 'available', note: 'Kèm pin' },
    { id: 'TB-02', name: 'Chân máy mini', category: 'Phụ kiện', status: 'borrowed', note: 'Dự kiến trả' },
    { id: 'TB-03', name: 'Micro USB', category: 'Âm thanh', status: 'available', note: 'Ghi âm' },
    { id: 'TB-04', name: 'Đèn LED để bàn', category: 'Ánh sáng', status: 'maintenance', note: 'Bảo trì' },
    { id: 'TB-05', name: 'Tripod cao', category: 'Phụ kiện', status: 'available', note: 'Túi đựng' },
  ],
  requests: [
    { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending', createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved', createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-103', borrower: 'Chi Lê', deviceId: 'TB-01', startDate: '2026-11-24', endDate: '2026-11-25', status: 'borrowing', createdAt: '2026-11-01T00:00:00.000Z' },
  ],
  nextRequestSeq: 104,
});

describe('statusRules', () => {
  it('UT-ST-01: duyệt YC-101 thành công', () => {
    const res = planStatusChange(makeBtcState(), 'YC-101', 'approved');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.requests.find((r) => r.id === 'YC-101')?.status).toBe('approved');
  });

  it('UT-ST-02/03: duyệt hoặc cho mượn yêu cầu trùng lịch -> SCHEDULE_CONFLICT', () => {
    const base = makeBtcState();
    base.requests.push({
      id: 'YC-104',
      borrower: 'Dũng',
      deviceId: 'TB-02',
      startDate: '2026-11-23',
      endDate: '2026-11-24',
      status: 'pending',
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    const r1 = planStatusChange(base, 'YC-101', 'approved');
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = planStatusChange(r1.value, 'YC-104', 'approved');
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.errors[0]?.code).toBe('SCHEDULE_CONFLICT');

    const r3 = planStatusChange(r1.value, 'YC-104', 'borrowing');
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.errors[0]?.code).toBe('SCHEDULE_CONFLICT');
  });

  it('UT-ST-04: chuyển sang rejected / returned / pending luôn thành công dù trùng lịch', () => {
    const base = makeBtcState();
    base.requests.push({
      id: 'YC-104',
      borrower: 'Dũng',
      deviceId: 'TB-03',
      startDate: '2026-11-21',
      endDate: '2026-11-21',
      status: 'pending',
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    expect(planStatusChange(base, 'YC-104', 'rejected').ok).toBe(true);
    expect(planStatusChange(base, 'YC-104', 'returned').ok).toBe(true);
  });

  it('UT-ST-05: duyệt yêu cầu của thiết bị Bảo trì -> DEVICE_UNDER_MAINTENANCE', () => {
    const base = makeBtcState();
    base.requests.push({
      id: 'YC-105',
      borrower: 'Hà',
      deviceId: 'TB-04',
      startDate: '2026-11-28',
      endDate: '2026-11-29',
      status: 'pending',
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    const res = planStatusChange(base, 'YC-105', 'approved');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]?.code).toBe('DEVICE_UNDER_MAINTENANCE');
  });

  it('UT-ST-06: đặt lại đúng trạng thái hiện tại -> thành công (idempotent)', () => {
    const res = planStatusChange(makeBtcState(), 'YC-102', 'approved');
    expect(res.ok).toBe(true);
  });

  it('UT-ST-07/08: đồng bộ tình trạng thiết bị (D7) và gán/xóa returnedAt (X2)', () => {
    const base = makeBtcState();
    const rBorrow = planStatusChange(base, 'YC-101', 'borrowing', '2026-11-22T09:00:00.000Z');
    expect(rBorrow.ok).toBe(true);
    if (!rBorrow.ok) return;
    expect(rBorrow.value.devices.find((d) => d.id === 'TB-02')?.status).toBe('borrowed');

    const rReturn = planStatusChange(rBorrow.value, 'YC-101', 'returned', '2026-11-23T17:00:00.000Z');
    expect(rReturn.ok).toBe(true);
    if (!rReturn.ok) return;
    expect(rReturn.value.devices.find((d) => d.id === 'TB-02')?.status).toBe('available');
    expect(rReturn.value.requests.find((r) => r.id === 'YC-101')?.returnedAt).toBe('2026-11-23T17:00:00.000Z');

    const rUndo = planStatusChange(rReturn.value, 'YC-101', 'pending');
    expect(rUndo.ok).toBe(true);
    if (!rUndo.ok) return;
    expect(rUndo.value.requests.find((r) => r.id === 'YC-101')?.returnedAt).toBeUndefined();
  });

  it('UT-ST-09: mã yêu cầu không tồn tại -> REQUEST_NOT_FOUND', () => {
    const res = planStatusChange(makeBtcState(), 'YC-999', 'approved');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]?.code).toBe('REQUEST_NOT_FOUND');
  });

  it('UT-ST-10: YC-103 đổi sang approved rồi borrowing không tự trùng với chính nó', () => {
    const r1 = planStatusChange(makeBtcState(), 'YC-103', 'approved');
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = planStatusChange(r1.value, 'YC-103', 'borrowing');
    expect(r2.ok).toBe(true);
  });

  it('UT-ST-11: không mutate state đầu vào', () => {
    const original = makeBtcState();
    const snapshot = JSON.stringify(original);
    planStatusChange(original, 'YC-101', 'borrowing');
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});
