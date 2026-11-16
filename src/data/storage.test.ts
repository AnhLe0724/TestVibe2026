import { describe, it, expect } from 'vitest';
import { STORAGE_KEY } from '../domain/constants';
import { nextId } from '../domain/ids';
import { FakeStorage } from '../test/fakeStorage';
import { createSeed } from './seed';
import { loadState, resetSeedStorage, saveState } from './storage';

describe('data/storage & seed', () => {
  it('IT-ST-01: lần đầu chạy (storage rỗng) trả seed và ghi vào storage', () => {
    const storage = new FakeStorage();
    const loaded = loadState(storage);
    expect(loaded.warning).toBeUndefined();
    expect(loaded.state).toEqual(createSeed());
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('IT-ST-02: ghi rồi đọc lại bằng nhau từng trường', () => {
    const storage = new FakeStorage();
    const state = createSeed();
    state.requests.push({
      id: 'YC-104',
      borrower: 'Dũng Hoàng',
      deviceId: 'TB-05',
      startDate: '2026-11-26',
      endDate: '2026-11-27',
      status: 'pending',
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    state.nextRequestSeq = 105;

    expect(saveState(storage, state)).toEqual({ ok: true });
    const loaded = loadState(storage);
    expect(loaded.state).toEqual(state);
  });

  it('IT-ST-03: JSON hỏng -> nạp seed, sao lưu bản hỏng, trả cảnh báo STORAGE_CORRUPT', () => {
    const storage = new FakeStorage({ [STORAGE_KEY]: '{abc' });
    const loaded = loadState(storage);
    expect(loaded.warning).toBe('STORAGE_CORRUPT');
    expect(loaded.state).toEqual(createSeed());
    const backupKey = storage.keys().find((k) => k.startsWith(`${STORAGE_KEY}:corrupt-`));
    expect(backupKey).toBeDefined();
    expect(storage.getItem(backupKey!)).toBe('{abc');
  });

  it('IT-ST-04: JSON sai cấu trúc -> xử lý như IT-ST-03', () => {
    const bad = JSON.stringify({ schemaVersion: 1, devices: [{ id: 'TB-01', status: 'unknown' }] });
    const storage = new FakeStorage({ [STORAGE_KEY]: bad });
    const loaded = loadState(storage);
    expect(loaded.warning).toBe('STORAGE_CORRUPT');
    expect(loaded.state).toEqual(createSeed());
    expect(storage.keys().some((k) => k.startsWith(`${STORAGE_KEY}:corrupt-`))).toBe(true);
  });

  it('IT-ST-05: schemaVersion lạ -> sao lưu và nạp seed an toàn', () => {
    const future = JSON.stringify({ ...createSeed(), schemaVersion: 99 });
    const storage = new FakeStorage({ [STORAGE_KEY]: future });
    const loaded = loadState(storage);
    expect(loaded.warning).toBe('STORAGE_CORRUPT');
    expect(loaded.state).toEqual(createSeed());
  });

  it('IT-ST-06: setItem ném lỗi -> trả STORAGE_WRITE_FAILED, không crash', () => {
    const storage = new FakeStorage();
    storage.failOnSet = true;
    const res = saveState(storage, createSeed());
    expect(res).toEqual({ ok: false, error: 'STORAGE_WRITE_FAILED' });
  });

  it('IT-ST-07: nạp mẫu nhiều lần không bị nhiễm dữ liệu cũ (chống tham chiếu chung)', () => {
    const storage = new FakeStorage();
    const s1 = resetSeedStorage(storage);
    s1.devices[0]!.name = 'BỊ SỬA';
    s1.requests.pop();

    const s2 = resetSeedStorage(storage);
    expect(s2).toEqual(createSeed());
    expect(s2.devices[0]!.name).toBe('Máy ảnh Lumix G7');
    expect(s2.requests).toHaveLength(3);
  });

  it('IT-ST-08: sau nạp mẫu tạo yêu cầu -> YC-104; đọc lại và tạo nữa -> YC-105', () => {
    const storage = new FakeStorage();
    const s1 = resetSeedStorage(storage);
    const id1 = nextId(s1.nextRequestSeq);
    expect(id1.id).toBe('YC-104');
    s1.nextRequestSeq = id1.nextSeq;
    saveState(storage, s1);

    const s2 = loadState(storage).state;
    const id2 = nextId(s2.nextRequestSeq);
    expect(id2.id).toBe('YC-105');
  });

  it('IT-ST-09: seed khớp nguyên văn dữ liệu mẫu BTC (kể cả TB-01 available với YC-103 borrowing)', () => {
    const seed = createSeed();
    expect(seed.schemaVersion).toBe(1);
    expect(seed.nextRequestSeq).toBe(104);
    expect(seed.devices).toEqual([
      { id: 'TB-01', name: 'Máy ảnh Lumix G7', category: 'Máy ảnh', status: 'available', note: 'Kèm pin và thẻ nhớ' },
      { id: 'TB-02', name: 'Chân máy mini', category: 'Phụ kiện', status: 'borrowed', note: 'Dự kiến trả ngày 22/11' },
      { id: 'TB-03', name: 'Micro USB', category: 'Âm thanh', status: 'available', note: 'Dùng ghi âm/phỏng vấn' },
      { id: 'TB-04', name: 'Đèn LED để bàn', category: 'Ánh sáng', status: 'maintenance', note: 'Không cho đăng ký mượn' },
      { id: 'TB-05', name: 'Tripod cao', category: 'Phụ kiện', status: 'available', note: 'Có túi đựng' },
    ]);
    expect(seed.requests).toEqual([
      { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending', createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved', createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'YC-103', borrower: 'Chi Lê', deviceId: 'TB-01', startDate: '2026-11-24', endDate: '2026-11-25', status: 'borrowing', createdAt: '2026-11-01T00:00:00.000Z' },
    ]);
  });
});
