import type { AppState } from '../domain/types';
import { isValidAppState } from './schema';

export const migrateState = (raw: unknown): AppState | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion === 1) {
    return isValidAppState(raw) ? raw : null;
  }
  return null;
};
