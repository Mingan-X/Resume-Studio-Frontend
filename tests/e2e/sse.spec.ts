import { expect, test } from '@playwright/test';
test('原生EventSource命名事件断线携带Last-Event-ID补读并回退', async ({ page }) => {
  await page.goto('/__sse-probe');
  await expect(page.locator('#events')).toHaveText('#1:first#2:resumed-with-last-id');
  await expect(page.locator('#fallback')).toHaveText('polling');
});
