import { expect, test } from '@playwright/test';

test('真实XHR上传到本地服务器产生进度并校验结果', async ({ page }) => {
  await page.goto('/__transport-probe');
  await page.getByRole('button', { name: '发送合成文件' }).click();
  await expect(page.locator('#result')).toHaveText('ok');
  await expect(page.locator('#progress')).toHaveText(/\d+\/\d+/);
});
test('真实XHR取消与HTTP错误转换', async ({ page }) => {
  await page.goto('/__transport-probe?kind=slow');
  await page.getByRole('button', { name: '发送合成文件' }).click();
  await expect(page.locator('#progress')).not.toBeEmpty();
  await page.getByRole('button', { name: '取消传输' }).click();
  await expect(page.locator('#result')).toHaveText('aborted:ABORTED');
  await page.goto('/__transport-probe?kind=error');
  await page.getByRole('button', { name: '发送合成文件' }).click();
  await expect(page.locator('#result')).toHaveText('http:HTTP_ERROR');
});
