import { test, expect } from '@playwright/test';

const UID = Date.now().toString().slice(-4);
const CLASS_NAME = `Classe E2E ${UID}`;
const STUDENT_FIRST = `Test ${UID}`;
const STUDENT_LAST = `E2E`;
const EXERCISE_TITLE = `Exercice E2E ${UID}`;

test.describe('Flux complet : Soumission et Notation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('flux complet : créer classe → élève → exercice → soumission → noter', async ({ page }) => {
    // ─── 1. Créer une classe ───
    await page.getByRole('button', { name: 'Classes' }).click();
    await page.getByRole('button', { name: 'Ajouter une classe' }).click();
    await expect(page.getByRole('heading', { name: 'Ajouter une classe' })).toBeVisible();
    await page.locator('.fixed input[type="text"]').first().fill(CLASS_NAME);
    await page.locator('.fixed button:has-text("Ajouter")').click();
    await expect(page.getByText(CLASS_NAME)).toBeVisible({ timeout: 5000 });

    // ─── 2. Créer un élève ───
    await page.getByRole('button', { name: 'Élèves' }).click();
    await page.getByRole('button', { name: 'Ajouter un élève' }).click();
    await expect(page.getByRole('heading', { name: 'Ajouter un élève' })).toBeVisible();
    const inputs = page.locator('.fixed input[type="text"]');
    await inputs.nth(0).fill(STUDENT_FIRST);
    await inputs.nth(1).fill(STUDENT_LAST);
    await page.locator('.fixed button:has-text("Ajouter")').click();
    await expect(page.getByText(STUDENT_FIRST)).toBeVisible({ timeout: 5000 });

    // ─── 3. Créer un exercice ───
    await page.getByRole('button', { name: 'Exercices' }).click();
    await page.getByRole('button', { name: 'Ajouter un exercice' }).click();
    await expect(page.getByRole('heading', { name: 'Ajouter un exercice' })).toBeVisible();
    await page.locator('.fixed input[type="text"]').first().fill(EXERCISE_TITLE);
    await page.locator('.fixed select').first().selectOption({ index: 1 });
    await page.locator('.fixed button:has-text("Ajouter")').click();
    await expect(page.getByText(EXERCISE_TITLE)).toBeVisible({ timeout: 5000 });

    // ─── 4. Créer une soumission ───
    await page.getByRole('button', { name: 'Soumissions' }).click();
    await page.getByRole('button', { name: 'Nouvelle soumission' }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle soumission' })).toBeVisible();

    // Sélectionner l'exercice et l'élève
    await page.locator('.fixed select').first().selectOption({ index: 1 });
    await page.locator('.fixed select').nth(1).selectOption({ index: 1 });

    // Contenu de la rédaction
    await page.locator('.fixed textarea').fill('Ceci est une rédaction de test E2E.');

    // Créer
    await page.locator('.fixed button:has-text("Créer")').click();
    await expect(page.getByText(EXERCISE_TITLE)).toBeVisible({ timeout: 5000 });

    // ─── 5. Noter la soumission ───
    await page.getByRole('button', { name: 'Notation' }).click();

    // Sélectionner la soumission dans la sidebar de notation
    const sidebar = page.locator('.lg\\:col-span-1');
    const submissionBtn = sidebar.locator(`button:has-text("${STUDENT_FIRST}")`);
    await expect(submissionBtn).toBeVisible({ timeout: 5000 });
    await submissionBtn.click();

    // Vérifier que les critères sont visibles
    await expect(page.getByText('Orthographe')).toBeVisible();

    // Ajuster des notes via les inputs number
    const numberInputs = page.locator('input[type="number"]');
    const count = await numberInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await numberInputs.first().fill('8');
    await numberInputs.nth(1).fill('7');

    // Ajouter un commentaire
    const commentInput = page.getByPlaceholder('Commentaire').first();
    await commentInput.fill('Très bon travail !');

    // Vérifier que le score total s'affiche
    await expect(page.locator('.text-3xl.font-bold')).toBeVisible();

    // Enregistrer les notes
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Notes enregistrées');
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Enregistrer les notes' }).click();

    // ─── 6. Vérifier le tableau de bord ───
    await page.getByRole('button', { name: 'Tableau de bord' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('la page de notation affiche un message invite quand aucune soumission', async ({ page }) => {
    await page.getByRole('button', { name: 'Notation' }).click();
    await expect(page.getByRole('heading', { name: 'Notation' })).toBeVisible();
    await expect(page.getByText('Sélectionnez une soumission')).toBeVisible();
  });

  test('la page soumissions affiche les filtres', async ({ page }) => {
    await page.getByRole('button', { name: 'Soumissions' }).click();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByText('Tous les exercices')).toBeVisible();
  });
});
