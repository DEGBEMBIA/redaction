import { test, expect } from '@playwright/test';

test.describe('Export CSV/PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('h1')).toContainText('Tableau de bord');
    await page.getByRole('button', { name: 'Export' }).click();
    await expect(page.locator('h1')).toContainText('Export');
  });

  test('affiche le titre et les 5 types d\'export', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Export');
    await expect(page.getByText("Type d'export")).toBeVisible();

    await expect(page.getByText('Élèves')).toBeVisible();
    await expect(page.getByText('Classes')).toBeVisible();
    await expect(page.getByText('Exercices')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Statistiques')).toBeVisible();
  });

  test('affiche les boutons CSV et PDF', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Exporter en CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exporter en PDF' })).toBeVisible();
  });

  test("le type Élèves affiche les entêtes du tableau", async ({ page }) => {
    await expect(page.getByText('Liste des élèves')).toBeVisible();
    await expect(page.getByText('Nom')).toBeVisible();
    await expect(page.getByText('Prénom')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Classe')).toBeVisible();
    await expect(page.getByText("Date d'inscription")).toBeVisible();
  });

  test('bascule entre les types d\'export', async ({ page }) => {
    // Classes
    await page.getByRole('button', { name: 'Classes' }).click();
    await expect(page.getByText('Liste des classes')).toBeVisible();

    // Notes
    await page.getByRole('button', { name: 'Notes' }).click();
    await expect(page.getByText('Résultats des élèves')).toBeVisible();

    // Statistiques
    await page.getByRole('button', { name: 'Statistiques' }).click();
    await expect(page.getByText('Statistiques générales')).toBeVisible();
  });

  test('le tableau des classes montre la classe seed', async ({ page }) => {
    await page.getByRole('button', { name: 'Classes' }).click();
    await expect(page.getByText('6ème A')).toBeVisible();
  });

  test('le compteur de lignes est affiché', async ({ page }) => {
    await expect(page.getByText('ligne(s)')).toBeVisible();
  });

  test("Statistiques : les métriques seed sont affichées", async ({ page }) => {
    await page.getByRole('button', { name: 'Statistiques' }).click();
    await expect(page.getByText("Nombre d'élèves")).toBeVisible();
    await expect(page.getByText('Nombre de classes')).toBeVisible();
    await expect(page.getByText("Nombre d'exercices")).toBeVisible();
    await expect(page.getByText('Nombre de soumissions')).toBeVisible();
    await expect(page.getByText('Score moyen')).toBeVisible();
  });

  test("CSV : téléchargement du fichier", async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.getByRole('button', { name: 'Exporter en CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('students');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test("PDF : téléchargement du fichier", async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.getByRole('button', { name: 'Exporter en PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('students');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('CSV : téléchargement depuis un autre type (Classes)', async ({ page }) => {
    await page.getByRole('button', { name: 'Classes' }).click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.getByRole('button', { name: 'Exporter en CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('classes');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
