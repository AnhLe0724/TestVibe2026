import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { createAppStore } from './services/store';
import { FakeStorage } from './test/fakeStorage';

describe('App khung & ErrorBoundary', () => {
  beforeEach(() => {
    window.location.hash = '#/';
  });

  it('hiển thị tiêu đề và chuyển đổi được giữa 2 màn hình', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    render(<App store={store} />);

    expect(screen.getByRole('heading', { name: /quản lý mượn thiết bị clb/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /danh sách thiết bị/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /người phụ trách/i }));
    expect(await screen.findByRole('heading', { name: /quản lý yêu cầu mượn thiết bị/i })).toBeInTheDocument();
  });

  it('CT-APP-01: ErrorBoundary hiện thông báo thân thiện và nút nạp mẫu khi component con ném lỗi', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    function Boom(): never {
      throw new Error('Crash test');
    }

    render(
      <ErrorBoundary onResetSeed={onReset}>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/đã xảy ra lỗi ngoài ý muốn/i);
    await user.click(screen.getByRole('button', { name: /nạp dữ liệu mẫu/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
