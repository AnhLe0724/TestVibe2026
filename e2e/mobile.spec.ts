import { test, expect } from '@playwright/test';

test('E2E-07: viewport 375x667 không cuộn ngang và thao tác đầy đủ', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const noOverflowMember = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflowMember).toBe(true);

  await page.getByTestId('form-device').selectOption('TB-05');
  await page.getByTestId('form-borrower').fill('Dũng Hoàng');
  await page.getByTestId('form-start').fill('2026-11-26');
  await page.getByTestId('form-end').fill('2026-11-27');
  await page.getByTestId('form-submit').click();

  await page.getByRole('link', { name: 'Người phụ trách' }).click();
  await expect(page.getByTestId('request-row-YC-104')).toBeVisible();

  const noOverflowManager = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflowManager).toBe(true);
});
