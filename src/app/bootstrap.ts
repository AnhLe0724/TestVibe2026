import { STORAGE_KEY } from '../domain/constants';
import { createAppStore, type AppStore } from '../services/store';

export const initAppStore = (): AppStore => {
  const store = createAppStore(window.localStorage);

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      store.syncFromStorage();
    }
  });

  return store;
};
