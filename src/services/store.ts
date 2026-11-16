import { loadState, resetSeedStorage, saveState, type StorageLike } from '../data/storage';
import type { AppState, ErrorCode } from '../domain/types';

export type StoreListener = () => void;

export interface AppStore {
  getState: () => AppState;
  getStorageWarning: () => ErrorCode | null;
  clearStorageWarning: () => void;
  setState: (next: AppState) => void;
  resetToSeed: () => AppState;
  syncFromStorage: () => void;
  subscribe: (listener: StoreListener) => () => void;
}

export const createAppStore = (storage: StorageLike): AppStore => {
  const initial = loadState(storage);
  let state: AppState = initial.state;
  let storageWarning: ErrorCode | null = initial.warning ?? null;
  const listeners = new Set<StoreListener>();

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    getState: () => state,
    getStorageWarning: () => storageWarning,
    clearStorageWarning: () => {
      if (storageWarning !== null) {
        storageWarning = null;
        notify();
      }
    },
    setState: (next: AppState) => {
      state = next;
      const saved = saveState(storage, next);
      storageWarning = saved.ok ? null : saved.error;
      notify();
    },
    resetToSeed: () => {
      state = resetSeedStorage(storage);
      storageWarning = null;
      notify();
      return state;
    },
    syncFromStorage: () => {
      const reloaded = loadState(storage);
      state = reloaded.state;
      storageWarning = reloaded.warning ?? null;
      notify();
    },
    subscribe: (listener: StoreListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
