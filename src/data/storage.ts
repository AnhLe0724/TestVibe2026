import { STORAGE_KEY } from '../domain/constants';
import type { AppState, ErrorCode } from '../domain/types';
import { migrateState } from './migrations';
import { createSeed } from './seed';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  state: AppState;
  warning?: ErrorCode;
}

export type SaveResult = { ok: true } | { ok: false; error: ErrorCode };

const backupCorrupt = (storage: StorageLike, raw: string): void => {
  try {
    storage.setItem(`${STORAGE_KEY}:corrupt-${Date.now()}`, raw);
  } catch {
    // Bỏ qua nếu bộ nhớ đầy khi sao lưu bản hỏng
  }
};

export const saveState = (storage: StorageLike, state: AppState): SaveResult => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, error: 'STORAGE_WRITE_FAILED' };
  }
};

export const loadState = (storage: StorageLike): LoadResult => {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createSeed(), warning: 'STORAGE_CORRUPT' };
  }

  if (raw === null) {
    const seed = createSeed();
    saveState(storage, seed);
    return { state: seed };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const migrated = migrateState(parsed);
    if (migrated) return { state: migrated };
  } catch {
    // JSON hỏng -> xử lý rơi xuống nhánh sao lưu và nạp mẫu
  }

  backupCorrupt(storage, raw);
  const seed = createSeed();
  saveState(storage, seed);
  return { state: seed, warning: 'STORAGE_CORRUPT' };
};

export const resetSeedStorage = (storage: StorageLike): AppState => {
  const seed = createSeed();
  saveState(storage, seed);
  return seed;
};
