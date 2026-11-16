import { test, expect, type Page } from '@playwright/test';

const resetSeed = async (page: Page) => {
  await page.getByTestId('btn-reset-seed').click();
  await page.getByTestId('confirm-reset-yes').click();
};

test.describe('Kịch bản demo BTC (E2E-01..04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetSeed(page);
  });

  test('E2E-01: nạp mẫu -> vào màn quản lý -> tìm TB-03 chỉ thấy YC-102', async ({ page }) => {
    await page.getByRole('link', { name: 'Người phụ trách' }).click();
    await page.getByTestId('request-search').fill('TB-03');

    await expect(page.getByTestId('request-row-YC-102')).toBeVisible();
    await expect(page.getByTestId('request-row-YC-101')).toBeHidden();
    await expect(page.getByTestId('request-row-YC-103')).toBeHidden();
  });

  test('E2E-02: gửi yêu cầu TB-05 thành công -> xuất hiện YC-104 ở màn quản lý', async ({
    page,
  }) => {
    await page.getByTestId('form-device').selectOption('TB-05');
    await page.getByTestId('form-borrower').fill('Dũng Hoàng');
    await page.getByTestId('form-start').fill('2026-11-26');
    await page.getByTestId('form-end').fill('2026-11-27');
    await page.getByTestId('form-submit').click();

    await expect(page.getByRole('status')).toContainText('YC-104');

    await page.getByRole('link', { name: 'Người phụ trách' }).click();
    const row = page.getByTestId('request-row-YC-104');
    await expect(row).toBeVisible();
    await expect(row).toContainText('Dũng Hoàng');
    await expect(page.getByTestId('status-select-YC-104')).toHaveValue('pending');
  });

  test('E2E-03: trùng lịch khi gửi (a) và khi duyệt ở màn quản lý (b)', async ({ page }) => {
    // (a) Trùng với YC-102 (TB-03, 21/11/2026)
    await page.getByTestId('form-device').selectOption('TB-03');
    await page.getByTestId('form-borrower').fill('Hà Lê');
    await page.getByTestId('form-start').fill('2026-11-21');
    await page.getByTestId('form-end').fill('2026-11-21');
    await page.getByTestId('form-submit').click();

    await expect(page.getByTestId('alert-conflict')).toContainText('YC-102');

    // (b) Tạo yêu cầu TB-02 23-24/11 (trùng YC-101 đang pending)
    await page.getByTestId('form-device').selectOption('TB-02');
    await page.getByTestId('form-borrower').fill('Dũng');
    await page.getByTestId('form-start').fill('2026-11-23');
    await page.getByTestId('form-end').fill('2026-11-24');
    await page.getByTestId('form-submit').click();

    await page.getByRole('link', { name: 'Người phụ trách' }).click();
    await page.getByTestId('status-select-YC-101').selectOption('approved');
    await expect(page.getByTestId('status-select-YC-101')).toHaveValue('approved');

    await page.getByTestId('status-select-YC-104').selectOption('approved');
    await expect(page.getByTestId('alert-conflict')).toContainText('YC-101');
    await expect(page.getByTestId('status-select-YC-104')).toHaveValue('pending');
  });

  test('E2E-04: đổi trạng thái YC-101 qua approved -> borrowing -> returned', async ({ page }) => {
    await page.getByRole('link', { name: 'Người phụ trách' }).click();

    const select = page.getByTestId('status-select-YC-101');
    await select.selectOption('approved');
    await expect(select).toHaveValue('approved');

    await select.selectOption('borrowing');
    await expect(select).toHaveValue('borrowing');

    await select.selectOption('returned');
    await expect(select).toHaveValue('returned');
    await expect(page.getByTestId('request-row-YC-101')).toContainText(/trả lúc:/i);
    await expect(page.getByTestId('stats-available')).toContainText('4');
    await expect(page.getByTestId('stats-borrowed')).toContainText('0');

    await page.getByTestId('status-select-YC-102').selectOption('rejected');
    await expect(page.getByTestId('status-select-YC-102')).toHaveValue('rejected');
  });
});
