import { useState } from 'react';
import type { AppRoute } from '../../app/router';
import { ConfirmDialog } from './ConfirmDialog';

interface HeaderProps {
  route: AppRoute;
  onResetSeed: () => void;
}

export function Header({ route, onResetSeed }: HeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = (): void => {
    setConfirmOpen(false);
    onResetSeed();
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <h1 className="app-title">Quản lý mượn thiết bị CLB</h1>
        <nav className="header-nav" aria-label="Điều hướng chính">
          <a href="#/" className={`nav-link ${route === 'member' ? 'active' : ''}`}>
            Thành viên
          </a>
          <a href="#/quan-ly" className={`nav-link ${route === 'manager' ? 'active' : ''}`}>
            Người phụ trách
          </a>
          <button
            type="button"
            className="btn"
            data-testid="btn-reset-seed"
            onClick={() => setConfirmOpen(true)}
          >
            Nạp dữ liệu mẫu
          </button>
        </nav>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Nạp dữ liệu mẫu"
        message="Thao tác này sẽ xóa mọi thay đổi và khôi phục dữ liệu ban đầu. Tiếp tục?"
        confirmLabel="Xác nhận"
        confirmTestId="confirm-reset-yes"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
}
