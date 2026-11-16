import { useSyncExternalStore } from 'react';
import type { AppState, ErrorCode } from '../../domain/types';
import type { AppStore } from '../../services/store';

export const useAppState = (store: AppStore): AppState =>
  useSyncExternalStore(store.subscribe, store.getState, store.getState);

export const useStorageWarning = (store: AppStore): ErrorCode | null =>
  useSyncExternalStore(store.subscribe, store.getStorageWarning, store.getStorageWarning);
