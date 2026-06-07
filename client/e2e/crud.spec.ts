import { test, expect } from '@playwright/test';

// Utiliser des IDs uniques pour éviter les dépendances entre tests
const UID = Date.now().toString().slice(-4);

test.describe('Gestion des classes, élèves, exercices et critères', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test.describe('Classes', () => {
    test('affiche la page des classes avec la classe seed', async ({ page }) => {
      await page.getByRole('button', { name: 'Classes' }).click();
      await expect(page.getByRole('heading', { name: 'Classes' })).toBeVisible();
      await expect(page.getByText('6ème A', { exact: true })).toBeVisible();
    });

    test('crée une nouvelle classe', async ({ page }) => {
      await page.getByRole('button', { name: 'Classes' }).click();

      // Ouvrir la modale
      await page.getByRole('button', { name: 'Ajouter une classe' }).click();
      await expect(page.getByRole('heading', { name: 'Ajouter une classe' })).toBeVisible();

      // Remplir le formulaire
      await page.locator('input[type="text"]').first().fill(`Classe E2E ${UID}`);

      // Soumettre (le bouton dans la modale s'appelle aussi "Ajouter")
      await page.locator('.fixed button:has-text("Ajouter")').click();

      // Vérifier que la classe apparaît
      await expect(page.getByText(`Classe E2E ${UID}`)).toBeVisible({ timeout: 5000 });
    });

    test('supprime une classe', async ({ page }) => {
      await page.getByRole('button', { name: 'Classes' }).click();

      // Attendre que les classes soient chargées depuis l'API
      await expect(page.locator('.grid')).toBeVisible({ timeout: 5000 });
      const cards = page.locator('.grid > div');
      const countBefore = await cards.count();
      expect(countBefore).toBeGreaterThanOrEqual(1);

      // Accepter la boîte de dialogue confirm()
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Cliquer sur "Suppr." (le bouton de suppression dans la card)
      await page.getByRole('button', { name: 'Suppr.' }).first().click();

      // Attendre la mise à jour
      await expect(cards).toHaveCount(countBefore - 1);
    });
  });

  test.describe('Élèves', () => {
    test('affiche la page et crée un élève', async ({ page }) => {
      await page.getByRole('button', { name: 'Élèves' }).click();
      await expect(page.getByRole('heading', { name: 'Élèves' })).toBeVisible();

      // Ouvrir la modale
      await page.getByRole('button', { name: 'Ajouter un élève' }).click();
      await expect(page.getByRole('heading', { name: 'Ajouter un élève' })).toBeVisible();

      // Remplir les champs (prénom et nom sont les 2 premiers inputs de la modale)
      const inputs = page.locator('.fixed input[type="text"]');
      await inputs.nth(0).fill(`Marie ${UID}`);
      await inputs.nth(1).fill(`Durand ${UID}`);

      // Soumettre
      await page.locator('.fixed button:has-text("Ajouter")').click();

      // Vérifier
      await expect(page.getByText(`Marie ${UID}`)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Exercices', () => {
    test('crée un exercice', async ({ page }) => {
      await page.getByRole('button', { name: 'Exercices' }).click();
      await expect(page.getByRole('heading', { name: 'Exercices' })).toBeVisible();

      // Ouvrir la modale
      await page.getByRole('button', { name: 'Ajouter un exercice' }).click();
      await expect(page.getByRole('heading', { name: 'Ajouter un exercice' })).toBeVisible();

      // Titre
      await page.locator('.fixed input[type="text"]').first().fill(`Exercice E2E ${UID}`);

      // Attendre que les classes soient chargées dans le select (2 options min : "Toutes" + seed)
      await expect(page.locator('.fixed select option')).toHaveCount(2, { timeout: 5000 });
      // Sélectionner la classe (première option non-vide)
      await page.locator('.fixed select').first().selectOption({ index: 1 });

      // Soumettre
      await page.locator('.fixed button:has-text("Ajouter")').click();

      // Vérifier
      await expect(page.getByText(`Exercice E2E ${UID}`)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Grille d'évaluation", () => {
    test('affiche les 6 critères préchargés', async ({ page }) => {
      await page.getByRole('button', { name: "Grille d'évaluation" }).click();
      await expect(page.getByRole('heading', { name: "Grille d'évaluation" })).toBeVisible();

      await expect(page.getByText('Orthographe')).toBeVisible();
      await expect(page.getByText('Grammaire')).toBeVisible();
      await expect(page.getByText('Vocabulaire')).toBeVisible();
      await expect(page.getByText('Structure')).toBeVisible();
      await expect(page.getByText('Style')).toBeVisible();
      await expect(page.getByText('Ponctuation')).toBeVisible();
    });

    test('ajoute un critère', async ({ page }) => {
      await page.getByRole('button', { name: "Grille d'évaluation" }).click();

      await page.getByRole('button', { name: 'Ajouter un critère' }).click();
      await expect(page.getByRole('heading', { name: 'Ajouter un critère' })).toBeVisible();

      await page.locator('.fixed input[type="text"]').first().fill('Créativité');
      await page.locator('.fixed button:has-text("Ajouter")').click();

      await expect(page.getByText('Créativité')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation entre toutes les pages', () => {
    test('peut naviguer dans toutes les sections', async ({ page }) => {
      const pages = [
        { button: 'Tableau de bord' },
        { button: 'Élèves' },
        { button: 'Classes' },
        { button: 'Exercices' },
        { button: "Grille d'évaluation" },
        { button: 'Soumissions' },
        { button: 'Notation' },
        { button: 'Progression' },
        { button: 'Export' },
      ];

      for (const { button } of pages) {
        await page.getByRole('button', { name: button }).click();
        await expect(page.getByRole('heading')).first().toBeVisible({ timeout: 5000 });
      }
    });
  });
});
