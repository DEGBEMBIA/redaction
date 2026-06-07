import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('affiche la page de connexion par défaut', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Suivi Rédaction');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByText('admin / admin123')).toBeVisible();
  });

  test('connexion réussie avec admin/admin123', async ({ page }) => {
    await page.fill('input[placeholder="ex: admin"]', 'admin');
    await page.fill('input[placeholder="••••••"]', 'admin123');
    await page.click('button:has-text("Se connecter")');

    // Vérifier qu'on est redirigé vers le tableau de bord
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.locator('text=Suivi Rédaction')).toBeVisible();
    // Vérifier le profil utilisateur dans la sidebar
    await expect(page.locator('text=Professeur Admin')).toBeVisible();
    await expect(page.locator('text=admin')).toBeVisible();
  });

  test('échec de connexion avec mauvais mot de passe', async ({ page }) => {
    await page.fill('input[placeholder="ex: admin"]', 'admin');
    await page.fill('input[placeholder="••••••"]', 'wrongpassword');
    await page.click('button:has-text("Se connecter")');

    await expect(page.locator('text=Nom d\'utilisateur ou mot de passe incorrect')).toBeVisible();
  });

  test('échec de connexion avec utilisateur inexistant', async ({ page }) => {
    await page.fill('input[placeholder="ex: admin"]', 'inexistant');
    await page.fill('input[placeholder="••••••"]', 'password123');
    await page.click('button:has-text("Se connecter")');

    await expect(page.locator('text=Nom d\'utilisateur ou mot de passe incorrect')).toBeVisible();
  });

  test('bascule entre onglets Connexion et Inscription', async ({ page }) => {
    // Cliquer sur Inscription
    await page.click('button:has-text("Inscription")');
    await expect(page.getByText('Créer un compte')).toBeVisible();
    // Les champs supplémentaires doivent apparaître
    await expect(page.locator('input[placeholder="ex: professeur@ecole.fr"]')).toBeVisible();
    await expect(page.locator('input[placeholder="ex: Jean Dupont"]')).toBeVisible();

    // Revenir à Connexion
    await page.click('button:has-text("Connexion")');
    await expect(page.getByText('Se connecter')).toBeVisible();
    // Les champs inscription doivent disparaître
    await expect(page.locator('input[placeholder="ex: professeur@ecole.fr"]')).not.toBeVisible();
  });

  test('inscription et connexion d\'un nouveau professeur', async ({ page }) => {
    // Aller sur l'onglet Inscription
    await page.click('button:has-text("Inscription")');
    await expect(page.getByText('Créer un compte')).toBeVisible();

    // Remplir le formulaire
    const uniqueName = `prof_${Date.now()}`;
    await page.fill('input[placeholder="ex: professeur1"]', uniqueName);
    await page.fill('input[placeholder="ex: professeur@ecole.fr"]', `${uniqueName}@ecole.fr`);
    await page.fill('input[placeholder="ex: Jean Dupont"]', 'Professeur Test');
    await page.fill('input[placeholder="••••••"]', 'password123');
    await page.click('button:has-text("Créer un compte")');

    // Vérifier la connexion automatique après inscription
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.locator('text=Professeur Test')).toBeVisible();
  });

  test('déconnexion', async ({ page }) => {
    // D'abord se connecter
    await page.fill('input[placeholder="ex: admin"]', 'admin');
    await page.fill('input[placeholder="••••••"]', 'admin123');
    await page.click('button:has-text("Se connecter")');
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();

    // Se déconnecter
    await page.click('button:has-text("Déconnexion")');

    // Vérifier qu'on revient à la page de connexion
    await expect(page.locator('h1')).toContainText('Suivi Rédaction');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });
});
