import { test, expect } from '@playwright/test';

test.describe('Export CSV/PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await page.getByRole('button', { name: 'Export' }).click();
    await expect(page.getByRole('heading', { name: /^Export$/ })).toBeVisible();
  });

  test('affiche le titre et les 5 types d\'export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Export$/ })).toBeVisible();
    await expect(page.getByText("Type d'export")).toBeVisible();

    // Les boutons de type d'export (scoper à la sidebar d'export pour éviter les conflits sidebar navigation)
    const exportSidebar = page.locator('.lg\\:col-span-1');
    await expect(exportSidebar.getByText('Élèves')).toBeVisible();
    await expect(exportSidebar.getByText('Classes')).toBeVisible();
    await expect(exportSidebar.getByText('Exercices')).toBeVisible();
    await expect(exportSidebar.getByText('Notes')).toBeVisible();
    await expect(exportSidebar.getByText('Statistiques')).toBeVisible();
  });

  test('affiche les boutons CSV et PDF', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Exporter en CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exporter en PDF' })).toBeVisible();
  });

  test("le type Élèves affiche les entêtes du tableau", async ({ page }) => {
    await expect(page.getByText('Liste des élèves')).toBeVisible();
    // Scoper les entêtes au tableau pour éviter les conflits ("Nom" match aussi "Prénom")
    const table = page.locator('.lg\\:col-span-3 table');
    await expect(table.getByText('Nom', { exact: true })).toBeVisible();
    await expect(table.getByText('Prénom', { exact: true })).toBeVisible();
    await expect(table.getByText('Email', { exact: true })).toBeVisible();
    await expect(table.getByText('Classe', { exact: true })).toBeVisible();
    await expect(table.getByText("Date d'inscription", { exact: true })).toBeVisible();
  });

  test('bascule entre les types d\'export', async ({ page }) => {
    const exportSidebar = page.locator('.lg\\:col-span-1');

    // Classes
    await exportSidebar.getByRole('button', { name: 'Classes' }).click();
    await expect(page.getByText('Liste des classes')).toBeVisible();

    // Notes
    await exportSidebar.getByRole('button', { name: 'Notes' }).click();
    await expect(page.getByText('Résultats des élèves')).toBeVisible();

    // Statistiques
    await exportSidebar.getByRole('button', { name: 'Statistiques' }).click();
    await expect(page.getByText('Statistiques générales')).toBeVisible();
  });

  test('le tableau des classes montre la classe seed', async ({ page }) => {
    const exportSidebar = page.locator('.lg\\:col-span-1');
    await exportSidebar.getByRole('button', { name: 'Classes' }).click();
    // Attendre que les données soient chargées API (le titre est synchrone, les lignes non)
    await expect(page.getByText('ligne(s)').or(page.getByText('Aucune donnée'))).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('6ème A')).toBeVisible();
  });

  test('le compteur de lignes est affiché', async ({ page }) => {
    await expect(page.getByText('ligne(s)')).toBeVisible();
  });

  test("Statistiques : les métriques seed sont affichées", async ({ page }) => {
    const exportSidebar = page.locator('.lg\\:col-span-1');
    await exportSidebar.getByRole('button', { name: 'Statistiques' }).click();
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
    const exportSidebar = page.locator('.lg\\:col-span-1');
    await exportSidebar.getByRole('button', { name: 'Classes' }).click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.getByRole('button', { name: 'Exporter en CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('classes');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
