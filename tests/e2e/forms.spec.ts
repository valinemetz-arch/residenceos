import { test, expect } from '@playwright/test';

// E2E flows: create / edit / delete for Spaces, Assets, Tasks, Warranties, Budget
// These tests use flexible selectors and tolerate minor UI differences.

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('Forms E2E', () => {
  test('Add → Edit → Delete flows for main forms', async ({ page }) => {
    const ts = Date.now();
    const results: { step: string; ok: boolean; message?: string }[] = [];

    // Helper to attempt an action and record result
    async function attempt(step: string, fn: () => Promise<void>) {
      try {
        await fn();
        results.push({ step, ok: true });
      } catch (err: any) {
        results.push({ step, ok: false, message: String(err) });
      }
    }

    // Accept any native confirm dialogs (used by delete flows)
    page.on('dialog', async (d) => {
      try { await d.accept(); } catch {}
    });

    // 1) Spaces
    await attempt('create_space', async () => {
      await page.goto(`${BASE}/app/spaces`);
      await page.locator('button:has-text("Add Space")').first().click();
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
      await page.locator('input[name="name"]').fill(`E2E Space ${ts}`);
      const createBtnHandle = await page.locator('button:has-text("Create")').first().elementHandle();
      if (createBtnHandle) {
        await createBtnHandle.evaluate((b: any) => (b as HTMLButtonElement).click());
      } else {
        await page.locator('button:has-text("Create")').first().click();
      }
      await page.waitForSelector(`text=E2E Space ${ts}`);
    });

    // 2) Assets (linked to space)
    await attempt('create_asset', async () => {
      await page.goto(`${BASE}/app/assets`);
      await page.locator('button:has-text("Add Asset")').first().click();
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
      await page.locator('input[name="name"]').fill(`E2E Asset ${ts}`);
      // select space (try by select[name] then fallback to combobox)
      const sel = page.locator('select[name="spaceId"]');
      if (await sel.count()) {
        await sel.selectOption({ label: `E2E Space ${ts}` });
        // ensure any native select dropdown is closed before clicking Create
        await page.keyboard.press('Escape');
      } else {
        const combo = page.getByRole('combobox', { name: /Space \*/i });
        await combo.selectOption({ label: `E2E Space ${ts}` });
        await page.keyboard.press('Escape');
      }
      await page.locator('button:has-text("Create")').first().click();
      // reload the assets list and wait for the created asset to appear
      await page.goto(`${BASE}/app/assets`);
      await page.waitForSelector(`text=E2E Asset ${ts}`, { timeout: 10000 });
    });

    await attempt('edit_asset', async () => {
      const assetText = `E2E Asset ${ts}`;
      await page.goto(`${BASE}/app/assets`);
      const row = page.getByText(assetText).first();
      await row.scrollIntoViewIfNeeded();
      // click nearest Edit button
      const edit = row.locator('xpath=ancestor::div//button[contains(., "Edit") or contains(., "edit")]');
      if (await edit.count()) {
        await edit.first().click();
      } else {
        await page.getByRole('button', { name: /Edit/i }).first().click();
      }
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
      await page.locator('input[name="name"]').fill(`E2E Asset EDIT ${ts}`);
      await page.locator('button:has-text("Update")').first().click();
      await page.waitForSelector(`text=E2E Asset EDIT ${ts}`);
    });

    await attempt('delete_asset', async () => {
      const assetText = `E2E Asset EDIT ${ts}`;
      await page.goto(`${BASE}/app/assets`);
      const row = page.getByText(assetText).first();
      await row.scrollIntoViewIfNeeded();
      const del = row.locator('xpath=ancestor::div//button[contains(., "Delete") or contains(., "Remove")]');
      if (await del.count()) {
        await del.first().click();
      } else {
        await page.getByRole('button', { name: /Delete|Remove/i }).first().click();
      }
      // try to confirm (if modal) then wait for row to be removed
      try { await page.getByRole('button', { name: /Confirm|Delete|Yes, delete/i }).first().click({ timeout: 1000 }); } catch {}
      try {
        await page.waitForSelector(`text=${assetText}`, { state: 'detached', timeout: 5000 });
      } catch (err) {
        // if still present after timeout, check whether it's actually gone from the list
        const exists = await page.locator(`text=${assetText}`).count();
        if (exists) throw new Error(`Asset still present after delete: ${assetText}`);
      }
    });

    // 3) Tasks
    await attempt('create_task', async () => {
      await page.goto(`${BASE}/app/tasks`);
      await page.locator('button:has-text("Add Task")').first().click();
      // many task forms use 'Title' label
        await page.waitForSelector('input[name="name"], input[name="title"]', { timeout: 10000 });
        if (await page.locator('input[name="title"]').count()) {
          await page.locator('input[name="title"]').fill(`E2E Task ${ts}`);
        } else {
          await page.locator('input[name="name"]').fill(`E2E Task ${ts}`);
        }
      await page.locator('button:has-text("Create")').first().click();
      await page.waitForSelector(`text=E2E Task ${ts}`);
    });

    await attempt('edit_task', async () => {
      const t = `E2E Task ${ts}`;
      await page.goto(`${BASE}/app/tasks`);
      // wait for the task to appear, then click the edit button next to the task title using DOM traversal
      await page.waitForSelector(`text=${t}`, { timeout: 10000 });
      // get the element handle for the task text and click the adjacent edit button
      const textHandle = await page.getByText(t).first().elementHandle();
      if (!textHandle) throw new Error('Failed to get element handle for task text: ' + t);
      await textHandle.evaluate((el) => {
        // climb up to the card container that has action buttons
        let node: HTMLElement | null = el as HTMLElement;
        while (node && node.querySelectorAll('button').length === 0) {
          node = node.parentElement;
        }
        if (!node) throw new Error('Action container not found for task');
        const buttons = Array.from(node.querySelectorAll('button')) as HTMLButtonElement[];
        if (buttons.length < 2) throw new Error('Not enough action buttons for task');
        buttons[1].click();
      });
      // change title
      await page.waitForSelector('input[name="name"], input[name="title"]', { timeout: 10000 });
      if (await page.locator('input[name="title"]').count()) {
        await page.locator('input[name="title"]').fill(`E2E Task EDIT ${ts}`);
      } else if (await page.locator('input[name="name"]').count()) {
        await page.locator('input[name="name"]').fill(`E2E Task EDIT ${ts}`);
      }
      await page.locator('button:has-text("Update")').first().click();
      await page.waitForSelector(`text=E2E Task EDIT ${ts}`);
    });

    await attempt('delete_task', async () => {
      const t = `E2E Task EDIT ${ts}`;
      await page.goto(`${BASE}/app/tasks`);
      const row = page.getByText(t).first();
      await row.scrollIntoViewIfNeeded();
      const del = row.locator('xpath=ancestor::div//button[contains(., "Delete") or contains(., "Remove")]');
      if (await del.count()) await del.first().click(); else await page.getByRole('button', { name: /Delete|Remove/i }).first().click();
      try { await page.getByRole('button', { name: /Confirm|Delete|Yes, delete/i }).first().click({ timeout: 1000 }); } catch {}
      try {
        await page.waitForSelector(`text=${t}`, { state: 'detached', timeout: 5000 });
      } catch (err) {
        const exists = await page.locator(`text=${t}`).count();
        if (exists) throw new Error(`Task still present after delete: ${t}`);
      }
    });

    // 4) Warranties
    await attempt('create_warranty', async () => {
      await page.goto(`${BASE}/app/warranties`);
      await page.locator('button:has-text("Add Warranty")').first().click();
      await page.waitForSelector('input[name="title"], input[name="name"]', { timeout: 5000 });
      if (await page.locator('input[name="title"]').count()) {
        await page.locator('input[name="title"]').fill(`E2E Warranty ${ts}`);
      } else {
        await page.locator('input[name="name"]').first().fill(`E2E Warranty ${ts}`);
      }
      await page.locator('button:has-text("Create")').first().click();
      await page.waitForSelector(`text=E2E Warranty ${ts}`);
    });

    await attempt('edit_warranty', async () => {
      const w = `E2E Warranty ${ts}`;
      await page.goto(`${BASE}/app/warranties`);
      const row = page.getByText(w).first();
      await row.scrollIntoViewIfNeeded();
      const edit = row.locator('xpath=ancestor::div//button[contains(., "Edit") or contains(., "edit")]');
      if (await edit.count()) await edit.first().click(); else await page.getByRole('button', { name: /Edit/i }).first().click();
      await page.waitForSelector('input[name="title"], input[name="name"]', { timeout: 5000 });
      if (await page.locator('input[name="title"]').count()) await page.locator('input[name="title"]').fill(`E2E Warranty EDIT ${ts}`);
      else if (await page.locator('input[name="name"]').count()) await page.locator('input[name="name"]').fill(`E2E Warranty EDIT ${ts}`);
      await page.locator('button:has-text("Update")').first().click();
      await page.waitForSelector(`text=E2E Warranty EDIT ${ts}`);
    });

    await attempt('delete_warranty', async () => {
      const w = `E2E Warranty EDIT ${ts}`;
      await page.goto(`${BASE}/app/warranties`);
      const row = page.getByText(w).first();
      await row.scrollIntoViewIfNeeded();
      const del = row.locator('xpath=ancestor::div//button[contains(., "Delete") or contains(., "Remove")]');
      if (await del.count()) await del.first().click(); else await page.getByRole('button', { name: /Delete|Remove/i }).first().click();
      try { await page.getByRole('button', { name: /Confirm|Delete|Yes, delete/i }).first().click({ timeout: 1000 }); } catch {}
      await page.waitForSelector(`text=${w}`, { state: 'detached' });
    });

    // 5) Budget items
    await attempt('create_budget', async () => {
      await page.goto(`${BASE}/app/budget`);
      await page.locator('button:has-text("Add Item")').first().click();
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
      if (await page.locator('input[name="name"]').count()) {
        await page.locator('input[name="name"]').first().fill(`E2E Budget ${ts}`);
      }
      await page.locator('button:has-text("Create")').first().click();
      await page.waitForSelector(`text=E2E Budget ${ts}`);
    });

    await attempt('edit_budget', async () => {
      const b = `E2E Budget ${ts}`;
      await page.goto(`${BASE}/app/budget`);
      const row = page.getByText(b).first();
      await row.scrollIntoViewIfNeeded();
      const edit = row.locator('xpath=ancestor::div//button[contains(., "Edit") or contains(., "edit")]');
      if (await edit.count()) await edit.first().click(); else await page.getByRole('button', { name: /Edit/i }).first().click();
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
      if (await page.locator('input[name="name"]').count()) await page.locator('input[name="name"]').first().fill(`E2E Budget EDIT ${ts}`);
      await page.locator('button:has-text("Update")').first().click();
      await page.waitForSelector(`text=E2E Budget EDIT ${ts}`);
    });

    await attempt('delete_budget', async () => {
      const b = `E2E Budget EDIT ${ts}`;
      await page.goto(`${BASE}/app/budget`);
      const row = page.getByText(b).first();
      await row.scrollIntoViewIfNeeded();
      const del = row.locator('xpath=ancestor::div//button[contains(., "Delete") or contains(., "Remove")]');
      if (await del.count()) await del.first().click(); else await page.getByRole('button', { name: /Delete|Remove/i }).first().click();
      try { await page.getByRole('button', { name: /Confirm|Delete|Yes, delete/i }).first().click({ timeout: 1000 }); } catch {}
      await page.waitForSelector(`text=${b}`, { state: 'detached' });
    });

    // Evaluate results and fail if any step failed
    const failed = results.filter((r) => !r.ok);
    console.log('E2E results:', results);
    expect(failed.length, `Some E2E steps failed: ${JSON.stringify(failed)}`).toBe(0);
  });
});
