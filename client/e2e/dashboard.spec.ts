import { test, expect } from '@playwright/test';

const UID = Date.now().toString().slice(-4);

test.describe('Tableau de bord', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('ex: admin').fill('admin');
    await page.getByPlaceholder('••••••').fill('admin123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('affiche le titre et le bouton Actualiser', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualiser' })).toBeVisible();
  });

  test('affiche les 4 cartes de statistiques avec les valeurs', async ({ page }) => {
    // Les 4 labels des cartes
    await expect(page.getByText('Élèves', { exact: true })).toBeVisible();
    await expect(page.getByText('Classes', { exact: true })).toBeVisible();
    await expect(page.getByText('Exercices', { exact: true })).toBeVisible();
    await expect(page.getByText('Soumissions', { exact: true })).toBeVisible();

    // La carte "Classes" doit afficher "1" (donnée seed)
    const classesCard = page.getByText('Classes', { exact: true }).locator('..').locator('..');
    await expect(classesCard.getByText('1')).toBeVisible();
  });

  test('affiche le score moyen (jauge)', async ({ page }) => {
    await expect(page.getByText('Score moyen général')).toBeVisible();
    const scoreElement = page.locator('text=Score moyen général').locator('..').locator('.text-2xl');
    await expect(scoreElement).toContainText('%');
  });

  test("affiche la répartition des classes (camembert)", async ({ page }) => {
    await expect(page.getByText("Répartition des élèves")).toBeVisible();
    // Le graphique Recharts Pie est présent si des données existent
    const pie = page.locator('.recharts-pie');
    if (await pie.count() > 0) {
      await expect(pie).toBeVisible();
    }
  });

  test('affiche la section Meilleurs élèves (vide par défaut)', async ({ page }) => {
    await expect(page.getByText('Meilleurs élèves')).toBeVisible();
    await expect(page.getByText('Aucune note attribuée')).toBeVisible();
  });

  test('affiche le classement des scores (bar chart)', async ({ page }) => {
    await expect(page.getByText('Classement des scores')).toBeVisible();
    // Le bar chart est présent si des scores existent
    const bar = page.locator('.recharts-bar');
    if (await bar.count() > 0) {
      await expect(bar).toBeVisible();
    }
  });

  test('affiche la section Soumissions récentes (vide par défaut)', async ({ page }) => {
    await expect(page.getByText('Soumissions récentes')).toBeVisible();
    await expect(page.getByText('Aucune soumission pour le moment')).toBeVisible();
  });

  test("bouton Actualiser recharge les données", async ({ page }) => {
    await page.getByRole('button', { name: 'Actualiser' }).click();
    await expect(page.getByText('Élèves', { exact: true })).toBeVisible();
  });

  test('les statistiques se mettent à jour après création', async ({ page }) => {
    // Créer un élève
    await page.getByRole('button', { name: 'Élèves' }).click();
    await page.getByRole('button', { name: 'Ajouter un élève' }).click();
    await expect(page.getByRole('heading', { name: 'Ajouter un élève' })).toBeVisible();
    const inputs = page.locator('.fixed input[type="text"]');
    await inputs.nth(0).fill(`Jean ${UID}`);
    await inputs.nth(1).fill(`Dupont ${UID}`);
    await page.locator('.fixed button:has-text("Ajouter")').click();
    await expect(page.getByText(`Jean ${UID}`)).toBeVisible({ timeout: 5000 });

    // Revenir au dashboard
    await page.getByRole('button', { name: 'Tableau de bord' }).click();

    // Attendre que les stats soient chargées (la carte doit être visible)
    await expect(page.getByText('Élèves', { exact: true })).toBeVisible({ timeout: 5000 });
    // La carte "Élèves" doit maintenant afficher "1"
    const studentsCard = page.getByText('Élèves', { exact: true }).locator('..').locator('..');
    await expect(studentsCard.getByText('1')).toBeVisible({ timeout: 5000 });
  });
});
