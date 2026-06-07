import { test, expect } from '@playwright/test';

test.describe('Progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await page.getByRole('button', { name: 'Progression' }).click();
    await expect(page.locator('h1')).toContainText('Progression');
  });

  test('affiche le titre et la description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Progression');
    await expect(page.getByText("Suivez l'évolution des élèves au fil du temps")).toBeVisible();
  });

  test('affiche les deux sélecteurs (élève et classe)', async ({ page }) => {
    await expect(page.getByText('Élève')).toBeVisible();
    await expect(page.getByText('Classe')).toBeVisible();
    await expect(page.locator('select')).toHaveCount(2);
  });

  test('les sélecteurs ont les bonnes options par défaut', async ({ page }) => {
    const studentOptions = await page.locator('select').first().locator('option').allTextContents();
    expect(studentOptions[0]).toBe('Sélectionnez un élève');

    const classOptions = await page.locator('select').nth(1).locator('option').allTextContents();
    expect(classOptions[0]).toBe('Sélectionnez une classe');
  });

  test('la classe seed 6ème A apparaît dans le sélecteur', async ({ page }) => {
    const classSelect = page.locator('select').nth(1);
    const options = await classSelect.locator('option').allTextContents();
    expect(options).toContain('6ème A');
  });

  test('les zones de graphiques sont vides par défaut', async ({ page }) => {
    await expect(page.getByText("Progression de l'élève")).toBeVisible();
    await expect(page.getByText('Sélectionnez un élève')).toBeVisible();

    await expect(page.getByText('Performance de la classe')).toBeVisible();
    await expect(page.getByText('Sélectionnez une classe')).toBeVisible();
  });

  test('sélectionner une classe affiche le message approprié', async ({ page }) => {
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await expect(
      page.getByText("Aucune donnée de performance pour cette classe")
    ).toBeVisible({ timeout: 5000 });
  });

  test('sélectionner un élève est impossible sans élève seed', async ({ page }) => {
    const select = page.locator('select').first();
    const options = await select.locator('option').all();
    expect(options.length).toBe(1); // Seulement l'option par défaut
  });

  test('un élève créé apparaît dans le sélecteur', async ({ page }) => {
    // Créer un élève
    await page.getByRole('button', { name: 'Élèves' }).click();
    await page.getByRole('button', { name: 'Ajouter un élève' }).click();
    await expect(page.getByText('Ajouter un élève')).toBeVisible();
    const inputs = page.locator('.fixed input[type="text"]');
    await inputs.nth(0).fill('Sophie');
    await inputs.nth(1).fill('Test');
    await page.locator('.fixed button:has-text("Ajouter")').click();

    // Revenir à Progression
    await page.getByRole('button', { name: 'Progression' }).click();

    // L'élève doit être dans le sélecteur
    const select = page.locator('select').first();
    await expect(select.locator('option')).toContainText(['Sophie Test'], { timeout: 5000 });
  });

  test('les conteneurs Recharts sont présents', async ({ page }) => {
    // Les conteneurs Recharts existent même vides (rendus par défaut)
    const wrappers = page.locator('.recharts-wrapper');
    await expect(wrappers.first()).toBeVisible();
  });
});
