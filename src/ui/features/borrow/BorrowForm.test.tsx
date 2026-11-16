import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createAppStore } from '../../../services/store';
import { FakeStorage } from '../../../test/fakeStorage';
import { MemberPage } from '../../pages/MemberPage';
import { BorrowForm } from './BorrowForm';

describe('BorrowForm (R3 + R4)', () => {
  const setup = () => {
    const store = createAppStore(new FakeStorage());
    const onToast = vi.fn();
    function Wrapper() {
      const [deviceId, setDeviceId] = useState('');
      return (
        <BorrowForm
          store={store}
          devices={store.getState().devices}
          deviceId={deviceId}
          onDeviceChange={setDeviceId}
          onToast={onToast}
        />
      );
    }
    render(<Wrapper />);
    return { store, onToast };
  };

  it('CT-FORM-01: gửi form rỗng hiện đủ lỗi từng ô và focus ô lỗi đầu tiên', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId('form-submit'));

    expect(screen.getByTestId('field-error-deviceId')).toBeInTheDocument();
    expect(screen.getByTestId('field-error-borrower')).toBeInTheDocument();
    expect(screen.getByTestId('field-error-startDate')).toBeInTheDocument();
    expect(screen.getByTestId('field-error-endDate')).toBeInTheDocument();
    expect(screen.getByTestId('form-device')).toHaveFocus();
  });

  it('CT-FORM-02: ngày trả trước ngày mượn hiện END_BEFORE_START dưới ô ngày trả', async () => {
    const user = userEvent.setup();
    setup();

    await user.selectOptions(screen.getByTestId('form-device'), 'TB-05');
    await user.type(screen.getByTestId('form-borrower'), 'Dũng Hoàng');
    await user.type(screen.getByTestId('form-start'), '2026-11-27');
    await user.type(screen.getByTestId('form-end'), '2026-11-26');
    await user.click(screen.getByTestId('form-submit'));

    expect(screen.getByTestId('field-error-endDate')).toHaveTextContent(
      /ngày trả không được trước ngày mượn/i,
    );
  });

  it('CT-FORM-03: gửi hợp lệ -> toast có mã YC mới, form được làm sạch, store có yêu cầu', async () => {
    const user = userEvent.setup();
    const { store, onToast } = setup();

    await user.selectOptions(screen.getByTestId('form-device'), 'TB-05');
    await user.type(screen.getByTestId('form-borrower'), 'Dũng Hoàng');
    await user.type(screen.getByTestId('form-start'), '2026-11-26');
    await user.type(screen.getByTestId('form-end'), '2026-11-27');
    await user.click(screen.getByTestId('form-submit'));

    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('YC-104'));
    expect(screen.getByTestId('form-borrower')).toHaveValue('');
    expect(store.getState().requests.some((r) => r.id === 'YC-104')).toBe(true);
  });

  it('CT-FORM-04: gửi trùng lịch YC-102 (TB-03, 21/11) -> hiện alert-conflict, không thêm', async () => {
    const user = userEvent.setup();
    const { store } = setup();

    await user.selectOptions(screen.getByTestId('form-device'), 'TB-03');
    await user.type(screen.getByTestId('form-borrower'), 'Hà Lê');
    await user.type(screen.getByTestId('form-start'), '2026-11-21');
    await user.type(screen.getByTestId('form-end'), '2026-11-21');
    await user.click(screen.getByTestId('form-submit'));

    expect(screen.getByTestId('alert-conflict')).toHaveTextContent(/YC-102/);
    expect(store.getState().requests).toHaveLength(3);
  });

  it('CT-FORM-05: bấm Mượn trên thẻ thiết bị điền sẵn ô thiết bị trong form', async () => {
    const user = userEvent.setup();
    const store = createAppStore(new FakeStorage());
    render(<MemberPage store={store} onToast={vi.fn()} />);

    const card = screen.getByTestId('device-card-TB-05');
    await user.click(card.querySelector('button')!);
    expect(screen.getByTestId('form-device')).toHaveValue('TB-05');
  });

  it('CT-FORM-06: bấm Gửi hai lần liên tiếp chỉ tạo một yêu cầu', async () => {
    const user = userEvent.setup();
    const { store } = setup();

    await user.selectOptions(screen.getByTestId('form-device'), 'TB-05');
    await user.type(screen.getByTestId('form-borrower'), 'Dũng Hoàng');
    await user.type(screen.getByTestId('form-start'), '2026-11-26');
    await user.type(screen.getByTestId('form-end'), '2026-11-27');

    const submit = screen.getByTestId('form-submit');
    await user.click(submit);
    await user.click(submit);

    expect(store.getState().requests).toHaveLength(4);
  });

  it('CT-FORM-07: tên chứa HTML/script được lưu và hiển thị dạng chữ an toàn', async () => {
    const user = userEvent.setup();
    const { store } = setup();
    const xss = '<img onerror=alert(1)>';

    await user.selectOptions(screen.getByTestId('form-device'), 'TB-05');
    await user.type(screen.getByTestId('form-borrower'), xss);
    await user.type(screen.getByTestId('form-start'), '2026-11-26');
    await user.type(screen.getByTestId('form-end'), '2026-11-27');
    await user.click(screen.getByTestId('form-submit'));

    expect(store.getState().requests[3]?.borrower).toBe(xss);
  });
});
