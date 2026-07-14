import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const evidence = resolve(process.cwd(), '../codex_doc/evidence/project-001');
mkdirSync(evidence, { recursive: true });
const expectNoOverflow = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

test('Student: deep link, detail, browser Back và refresh', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/student/today');
  await expect(page.getByRole('heading', { name: /Bắt đầu từ điều/ })).toBeVisible();
  await expectNoOverflow(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.ready).active))).toBe(true);
  await page.screenshot({ path: resolve(evidence, '390-student-today.png') });
  await page.getByRole('button', { name: 'Mở nhiệm vụ' }).click();
  await expect(page).toHaveURL(/\/student\/tasks\/[a-f0-9]+$/);
  await expect(page.getByRole('heading', { name: 'Ôn sinh lý tim mạch' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ôn sinh lý tim mạch' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: /Hoàn thành · 50 XP/ }).click();
  const reward = page.getByRole('dialog');
  await expect(reward.getByRole('heading', { name: 'Một bước tiến thật đẹp' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reward).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/student\/today$/);
});

test('role guard và chuyển workspace dùng replace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/mentor/planning');
  await expect(page).toHaveURL(/\/student\/today$/);
  await page.getByRole('button', { name: 'Chuyển không gian', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Chuyển sang Mentor?' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Chuyển không gian' }).click();
  await expect(page).toHaveURL(/\/mentor\/overview$/);
  await page.goto('/mentor/planning');
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/mentor\/planning$/);
  await expect(page.getByRole('tab', { name: /Ý tưởng/ })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: resolve(evidence, '390-mentor-planning.png') });
});

test('responsive evidence và offline mutation bị chặn', async ({ page, context }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/student/today');
  await expect(page.getByRole('heading', { name: /Bắt đầu từ điều/ })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: resolve(evidence, '768-student-today.png') });
  await page.evaluate(() => sessionStorage.setItem('studymed-role', 'mentor'));
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/mentor/overview');
  await expect(page.getByRole('heading', { name: /Một tuần đủ rõ/ })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: resolve(evidence, '1024-mentor-overview.png') });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/mentor/planning');
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: resolve(evidence, '1440-mentor-planning.png') });
  await page.goto('/mentor/tasks/new');
  await context.setOffline(true);
  await expect(page.getByText(/Đang ngoại tuyến/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Giao nhiệm vụ · 50 XP/ })).toBeDisabled();
  await context.setOffline(false);
});

test('WCAG A/AA không có vi phạm nghiêm trọng trên hai workspace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/student/today');
  await expect(page.getByRole('heading', { name: /Bắt đầu từ điều/ })).toBeVisible();
  const student = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(student.violations).toEqual([]);
  await page.evaluate(() => sessionStorage.setItem('studymed-role', 'mentor'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/mentor/planning');
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
  const mentor = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(mentor.violations).toEqual([]);
});
