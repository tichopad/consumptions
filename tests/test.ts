import { expect, test } from '@playwright/test';

test('index page has expected dashboard nav link', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Dashboard')).toBeVisible();
});
