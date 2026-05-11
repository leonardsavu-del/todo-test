import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function createList(page, name) {
  await page.goto('/lists');
  await page.getByLabel('List name').fill(name);
  await page.getByRole('button', { name: 'Create list' }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

async function addTodo(page, title) {
  await page.getByLabel('Todo title').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText(title)).toBeVisible();
}

async function expectNoCriticalA11yViolations(page, context) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const critical = result.violations.filter((v) => v.impact === 'critical');
  if (critical.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[a11y critical violations on ${context}]`, JSON.stringify(critical, null, 2));
  }
  expect(critical, `critical violations on ${context}`).toEqual([]);
}

test('1. accessibility: zero critical WCAG violations across key pages', async ({ page }) => {
  // Empty lists page
  await page.goto('/lists');
  await expectNoCriticalA11yViolations(page, '/lists (empty)');

  // Lists page with content
  const name = `a11y ${Date.now()}`;
  await createList(page, name);
  await expectNoCriticalA11yViolations(page, '/lists/:id (with todos none yet)');

  // List detail with a todo
  await addTodo(page, 'audit me');
  await expectNoCriticalA11yViolations(page, '/lists/:id (with one todo)');

  // Edit todo page
  await page.getByRole('link', { name: /Edit 'audit me'/ }).click();
  await expect(page.getByRole('heading', { name: 'Edit todo' })).toBeVisible();
  await expectNoCriticalA11yViolations(page, '/todos/:id/edit');
});

test('2. create a new list', async ({ page }) => {
  const name = `groceries ${Date.now()}`;
  await page.goto('/lists');
  await page.getByLabel('List name').fill(name);
  await page.getByRole('button', { name: 'Create list' }).click();

  await expect(page).toHaveURL(/\/lists\/[a-f0-9-]+$/);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.getByText('No todos yet.')).toBeVisible();
});

test('3. add a todo to a list', async ({ page }) => {
  const name = `work ${Date.now()}`;
  await createList(page, name);

  await addTodo(page, 'write report');
  await addTodo(page, 'send email');

  await expect(page.getByRole('list', { name: `Todos in ${name}` })).toBeVisible();
  await expect(page.getByText('write report')).toBeVisible();
  await expect(page.getByText('send email')).toBeVisible();
});

test('4. edit a todo (rename and mark completed)', async ({ page }) => {
  const name = `edit ${Date.now()}`;
  await createList(page, name);
  await addTodo(page, 'old title');

  await page.getByRole('link', { name: /Edit 'old title'/ }).click();
  await expect(page).toHaveURL(/\/todos\/[a-f0-9-]+\/edit$/);

  await page.getByLabel('Title').fill('new title');
  await page.getByLabel('Completed').check();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/lists\/[a-f0-9-]+$/);
  const item = page.locator('li', { hasText: 'new title' });
  await expect(item).toBeVisible();
  await expect(item.locator('.done')).toHaveText('new title');
});

test('5. delete a todo, then delete the list', async ({ page }) => {
  const name = `delete ${Date.now()}`;
  await createList(page, name);
  await addTodo(page, 'temporary item');

  // Remove the todo
  await page.getByRole('button', { name: /Remove 'temporary item'/ }).click();
  await expect(page.getByText('temporary item')).toHaveCount(0);
  await expect(page.getByText('No todos yet.')).toBeVisible();

  // Back to /lists and delete THIS list (auto-accept confirm dialog)
  await page.getByRole('link', { name: /All lists/ }).click();
  await expect(page).toHaveURL(/\/lists$/);

  const row = page.locator('li', { hasText: name });
  await expect(row).toBeVisible();

  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: `Delete list ${name}` }).click();

  await expect(page.locator('li', { hasText: name })).toHaveCount(0);
});
