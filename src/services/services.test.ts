import { describe, it, expect, vi } from 'vitest';
import { STORAGE_KEY } from '../domain/constants';
import { FakeStorage } from '../test/fakeStorage';
import { resetToSeed } from './resetService';
import { changeRequestStatus, submitRequest } from './requestService';
import { createAppStore } from './store';

describe('services', () => {
  it('IT-SV-01: submitRequest hợp lệ -> thêm yêu cầu pending, store đổi, storage ghi', () => {
    const storage = new FakeStorage();
    const store = createAppStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);

    const res = submitRequest(store, {
      borrower: 'Dũng Hoàng',
      deviceId: 'TB-05',
      startDate: '2026-11-26',
      endDate: '2026-11-27',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.request.id).toBe('YC-104');
    expect(res.value.request.status).toBe('pending');
    expect(store.getState().requests).toHaveLength(4);
    expect(store.getState().nextRequestSeq).toBe(105);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storage.getItem(STORAGE_KEY)).toContain('YC-104');
  });

  it('IT-SV-02: submitRequest lỗi -> store không đổi, storage không ghi', () => {
    const storage = new FakeStorage();
    const store = createAppStore(storage);
    const beforeStore = JSON.stringify(store.getState());
    const beforeRaw = storage.getItem(STORAGE_KEY);
    const listener = vi.fn();
    store.subscribe(listener);

    const res = submitRequest(store, {
      borrower: '',
      deviceId: 'TB-03',
      startDate: '2026-11-21',
      endDate: '2026-11-21',
    });

    expect(res.ok).toBe(false);
    expect(JSON.stringify(store.getState())).toBe(beforeStore);
    expect(storage.getItem(STORAGE_KEY)).toBe(beforeRaw);
    expect(listener).not.toHaveBeenCalled();
  });

  it('IT-SV-03: changeRequestStatus thành công -> store + storage cập nhật cùng lúc', () => {
    const storage = new FakeStorage();
    const store = createAppStore(storage);

    const res = changeRequestStatus(store, 'YC-101', 'approved');
    expect(res.ok).toBe(true);
    expect(store.getState().requests.find((r) => r.id === 'YC-101')?.status).toBe('approved');
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).requests[0].status).toBe('approved');
  });

  it('IT-SV-04: changeRequestStatus trùng lịch -> store và storage không đổi', () => {
    const storage = new FakeStorage();
    const store = createAppStore(storage);
    submitRequest(store, {
      borrower: 'Dũng',
      deviceId: 'TB-02',
      startDate: '2026-11-23',
      endDate: '2026-11-24',
    });
    expect(changeRequestStatus(store, 'YC-101', 'approved').ok).toBe(true);
    const beforeStore = JSON.stringify(store.getState());
    const beforeRaw = storage.getItem(STORAGE_KEY);

    const res = changeRequestStatus(store, 'YC-104', 'approved');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]?.code).toBe('SCHEDULE_CONFLICT');
    expect(JSON.stringify(store.getState())).toBe(beforeStore);
    expect(storage.getItem(STORAGE_KEY)).toBe(beforeRaw);
  });

  it('IT-SV-05: hai lần duyệt liên tiếp hai yêu cầu trùng nhau -> 1 thành công, 1 SCHEDULE_CONFLICT', () => {
    const storage = new FakeStorage();
    const store = createAppStore(storage);
    submitRequest(store, {
      borrower: 'Dũng',
      deviceId: 'TB-02',
      startDate: '2026-11-23',
      endDate: '2026-11-24',
    });

    const first = changeRequestStatus(store, 'YC-101', 'approved');
    const second = changeRequestStatus(store, 'YC-104', 'approved');

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.errors[0]?.code).toBe('SCHEDULE_CONFLICT');
  });

  it('IT-SV-06: đồng bộ khi tab khác thay đổi storage và resetToSeed khôi phục bản gốc', () => {
    const storage = new FakeStorage();
    const storeA = createAppStore(storage);
    const storeB = createAppStore(storage);

    submitRequest(storeA, {
      borrower: 'Hà',
      deviceId: 'TB-05',
      startDate: '2026-11-28',
      endDate: '2026-11-29',
    });
    expect(storeB.getState().requests).toHaveLength(3);

    storeB.syncFromStorage();
    expect(storeB.getState().requests).toHaveLength(4);

    resetToSeed(storeB);
    expect(storeB.getState().requests).toHaveLength(3);
  });
});
