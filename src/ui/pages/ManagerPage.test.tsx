import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';
import { changeRequestStatus, submitRequest } from '../../services/requestService';
import { createAppStore } from '../../services/store';
import { FakeStorage } from '../../test/fakeStorage';
import { ManagerPage } from './ManagerPage';

describe('ManagerPage (R5 + R6 + R7 + R9)', () => {
  beforeEach(() => {
    window.location.hash = '#/quan-ly';
  });

  it('CT-MGR-01: bảng hiện 3 yêu cầu mẫu đúng ngày dd/mm/yyyy và nhãn trạng thái tiếng Việt', () => {
    const store = createAppStore(new FakeStorage());
    render(<ManagerPage store={store} onToast={vi.fn()} />);

    const r101 = screen.getByTestId('request-row-YC-101');
    expect(r101).toHaveTextContent('An Nguyễn');
    expect(r101).toHaveTextContent('22/11/2026');
    expect(r101).toHaveTextContent('23/11/2026');
    expect(r101).toHaveTextContent('Chờ duyệt');

    expect(screen.getByTestId('request-row-YC-102')).toHaveTextContent('21/11/2026');
    expect(screen.getByTestId('request-row-YC-103')).toHaveTextContent('Đang mượn');
  });

  it('CT-MGR-02: đổi trạng thái hợp lệ -> hàng cập nhật và toast thành công', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    const onToast = vi.fn();
    render(<ManagerPage store={store} onToast={onToast} />);

    await user.selectOptions(screen.getByTestId('status-select-YC-101'), 'approved');

    expect(screen.getByTestId('status-select-YC-101')).toHaveValue('approved');
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('YC-101'));
  });

  it('CT-MGR-03: đổi sang Đã duyệt gây trùng -> hiện alert-conflict và ô chọn trở về trạng thái cũ', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    submitRequest(store, {
      borrower: 'Dũng',
      deviceId: 'TB-02',
      startDate: '2026-11-23',
      endDate: '2026-11-24',
    });
    changeRequestStatus(store, 'YC-101', 'approved');

    render(<ManagerPage store={store} onToast={vi.fn()} />);

    await user.selectOptions(screen.getByTestId('status-select-YC-104'), 'approved');

    expect(screen.getByTestId('alert-conflict')).toHaveTextContent(/YC-101/);
    expect(screen.getByTestId('status-select-YC-104')).toHaveValue('pending');
  });

  it('CT-MGR-04: tìm theo tên/mã thiết bị, trạng thái rỗng và xóa tìm kiếm', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    render(<ManagerPage store={store} onToast={vi.fn()} />);

    const search = screen.getByTestId('request-search');
    await user.type(search, 'binh');
    expect(screen.getByTestId('request-row-YC-102')).toBeInTheDocument();
    expect(screen.queryByTestId('request-row-YC-101')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'TB-03');
    expect(screen.getByTestId('request-row-YC-102')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'khong-co');
    expect(screen.getByText(/không có yêu cầu khớp/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(screen.getByTestId('request-row-YC-101')).toBeInTheDocument();
    expect(screen.getByTestId('request-row-YC-103')).toBeInTheDocument();
  });

  it('CT-MGR-05 & CT-MGR-06: nút Nạp dữ liệu mẫu -> Hủy giữ nguyên, Xác nhận khôi phục gốc', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    submitRequest(store, {
      borrower: 'Dũng Hoàng',
      deviceId: 'TB-05',
      startDate: '2026-11-26',
      endDate: '2026-11-27',
    });
    render(<App store={store} />);

    expect(screen.getByTestId('request-row-YC-104')).toBeInTheDocument();

    await user.click(screen.getByTestId('btn-reset-seed'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Hủy' }));
    expect(screen.getByTestId('request-row-YC-104')).toBeInTheDocument();

    await user.click(screen.getByTestId('btn-reset-seed'));
    await user.click(screen.getByTestId('confirm-reset-yes'));
    expect(screen.queryByTestId('request-row-YC-104')).not.toBeInTheDocument();
    expect(screen.getByTestId('request-row-YC-101')).toBeInTheDocument();
  });

  it('X1 & X2: thanh thống kê cập nhật theo D7 và hiện thời điểm trả khi Đã trả', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    render(<ManagerPage store={store} onToast={vi.fn()} />);

    expect(screen.getByTestId('stats-available')).toHaveTextContent('3');
    expect(screen.getByTestId('stats-borrowed')).toHaveTextContent('1');
    expect(screen.getByTestId('stats-maintenance')).toHaveTextContent('1');

    await user.selectOptions(screen.getByTestId('status-select-YC-101'), 'returned');
    expect(screen.getByTestId('stats-available')).toHaveTextContent('4');
    expect(screen.getByTestId('stats-borrowed')).toHaveTextContent('0');
    expect(screen.getByTestId('request-row-YC-101')).toHaveTextContent(/trả lúc:/i);
  });
});
