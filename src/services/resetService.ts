import type { AppState } from '../domain/types';
import type { AppStore } from './store';

export const resetToSeed = (store: AppStore): AppState => store.resetToSeed();
