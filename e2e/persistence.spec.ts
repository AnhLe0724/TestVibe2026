import { test, expect } from '@playwright/test';

test.describe('Lưu bền & Nạp dữ liệu mẫu (E2E-05, 06, 08)', () => {
  test('E2E-05 & E2E-06: dữ liệu còn sau tải lại trang và nạp mẫu khôi phục đúng gốc', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('btn-reset-seed').click();
    await page.getByTestId('confirm-reset-yes').click();

    await page.getByTestId('form-device').selectOption('TB-05');
    await page.getByTestId('form-borrower').fill('Dũng Hoàng');
    await page.getByTestId('form-start').fill('2026-11-26');
    await page.getByTestId('form-end').fill('2026-11-27');
    await page.getByTestId('form-submit').click();
    await expect(page.getByRole('status')).toContainText('YC-104');

    await page.reload();
    await page.getByRole('link', { name: 'Người phụ trách' }).click();
    await expect(page.getByTestId('request-row-YC-104')).toBeVisible();

    // Nạp lại dữ liệu mẫu
    await page.getByTestId('btn-reset-seed').click();
    await page.getByTestId('confirm-reset-yes').click();
    await expect(page.getByTestId('request-row-YC-104')).toBeHidden();
    await expect(page.getByTestId('request-row-YC-101')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('request-row-YC-104')).toBeHidden();
    await expect(page.getByTestId('request-row-YC-101')).toBeVisible();
  });

  test('E2E-08: làm hỏng localStorage vẫn mở được, hiện cảnh báo và nạp dữ liệu mẫu', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('clb-muon-thiet-bi:v1', '{corrupt-json');
    });
    await page.reload();

    await expect(page.getByRole('alert')).toContainText(/dữ liệu đã lưu bị lỗi/i);
    await expect(page.getByTestId('device-card-TB-01')).toBeVisible();
  });
});
