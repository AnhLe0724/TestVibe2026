import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createAppStore } from '../../../services/store';
import { FakeStorage } from '../../../test/fakeStorage';
import { DeviceList } from './DeviceList';

describe('DeviceList (R1 + R2)', () => {
  const devices = createAppStore(new FakeStorage()).getState().devices;

  it('CT-DEV-01: hiển thị đủ 5 thiết bị với mã, tên, tình trạng, ghi chú', () => {
    render(<DeviceList devices={devices} onBorrow={vi.fn()} />);

    for (const d of devices) {
      const card = screen.getByTestId(`device-card-${d.id}`);
      expect(card).toHaveTextContent(d.id);
      expect(card).toHaveTextContent(d.name);
      expect(card).toHaveTextContent(d.note);
    }
    expect(screen.getByTestId('device-card-TB-01')).toHaveTextContent('Sẵn sàng');
    expect(screen.getByTestId('device-card-TB-02')).toHaveTextContent('Đang mượn');
    expect(screen.getByTestId('device-card-TB-04')).toHaveTextContent('Bảo trì');
  });

  it('CT-DEV-02: lọc tình trạng, lọc loại, kết hợp và Xóa lọc', async () => {
    const user = userEvent.setup();
    render(<DeviceList devices={devices} onBorrow={vi.fn()} />);

    await user.selectOptions(screen.getByTestId('filter-status'), 'available');
    expect(screen.queryByTestId('device-card-TB-02')).not.toBeInTheDocument();
    expect(screen.getByTestId('device-card-TB-01')).toBeInTheDocument();

    await user.selectOptions(screen.getByTestId('filter-category'), 'Phụ kiện');
    expect(screen.queryByTestId('device-card-TB-01')).not.toBeInTheDocument();
    expect(screen.getByTestId('device-card-TB-05')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa lọc' }));
    expect(screen.getByTestId('device-card-TB-02')).toBeInTheDocument();
    expect(screen.getByTestId('device-card-TB-04')).toBeInTheDocument();
  });

  it('CT-DEV-03: lọc không còn kết quả hiện trạng thái rỗng có hướng dẫn', async () => {
    const user = userEvent.setup();
    render(<DeviceList devices={devices} onBorrow={vi.fn()} />);

    await user.selectOptions(screen.getByTestId('filter-status'), 'maintenance');
    await user.selectOptions(screen.getByTestId('filter-category'), 'Máy ảnh');

    expect(screen.getByText(/không có thiết bị phù hợp/i)).toBeInTheDocument();
  });

  it('CT-DEV-04: thẻ TB-04 có nút Mượn bị vô hiệu kèm lý do', () => {
    render(<DeviceList devices={devices} onBorrow={vi.fn()} />);
    const tb04 = screen.getByTestId('device-card-TB-04');
    const btn = within(tb04).getByRole('button', { name: 'Mượn' });
    expect(btn).toBeDisabled();
    expect(tb04).toHaveTextContent(/đang bảo trì/i);
  });
});
