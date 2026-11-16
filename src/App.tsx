import { ErrorBoundary } from './app/ErrorBoundary';
import { useHashRoute } from './app/router';
import { MESSAGES } from './domain/labels.vi';
import { resetToSeed } from './services/resetService';
import type { AppStore } from './services/store';
import { Header } from './ui/components/Header';
import { Toast } from './ui/components/Toast';
import { useStorageWarning } from './ui/hooks/useStore';
import { useToast } from './ui/hooks/useToast';
import { ManagerPage } from './ui/pages/ManagerPage';
import { MemberPage } from './ui/pages/MemberPage';

export default function App({ store }: { store: AppStore }) {
  const route = useHashRoute();
  const storageWarning = useStorageWarning(store);
  const { message, showToast } = useToast();

  const handleResetSeed = (): void => {
    resetToSeed(store);
    showToast('Đã khôi phục dữ liệu mẫu ban đầu.');
  };

  return (
    <ErrorBoundary onResetSeed={handleResetSeed}>
      <div className="app-shell">
        <Header route={route} onResetSeed={handleResetSeed} />
        <main className="app-main">
          {storageWarning ? (
            <div className="banner-warning" role="alert">
              <span>{MESSAGES[storageWarning]()}</span>
              <button type="button" className="btn" onClick={store.clearStorageWarning}>
                Đóng
              </button>
            </div>
          ) : null}
          {route === 'manager' ? (
            <ManagerPage store={store} onToast={showToast} />
          ) : (
            <MemberPage store={store} onToast={showToast} />
          )}
        </main>
        <Toast message={message} />
      </div>
    </ErrorBoundary>
  );
}
