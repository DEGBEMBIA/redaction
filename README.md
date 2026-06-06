# Suivi Rédaction

Application de suivi et d'évaluation de rédactions pour professeurs.

## 🚀 Démarrage rapide

```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev

# Ou les deux
npm run dev
```

- **Backend** : http://localhost:3001
- **Frontend** : http://localhost:5173

## 🐳 Docker

```bash
docker compose up --build
```

- **Frontend** : http://localhost

## 🌐 Déploiement automatique (CI/CD)

Le déploiement se fait automatiquement via GitHub Actions lors d'un push sur `main` ou `master`.

### Prérequis

1. Un VPS avec Docker installé (ou exécutez le script d'initialisation)
2. Les secrets GitHub configurés dans Settings → Secrets and variables → Actions

### Initialisation du VPS (une seule fois)

```bash
# Connectez-vous à votre VPS
ssh root@<IP_DU_VPS>

# Exécutez le script d'initialisation (install Docker, firewall, répertoires)
# Copiez-le d'abord sur le VPS :
scp deploy/setup-vps.sh root@<IP_DU_VPS>:/tmp/
ssh root@<IP_DU_VPS> "bash /tmp/setup-vps.sh"
```

### Secrets GitHub requis

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | Adresse IP ou nom de domaine du VPS | `123.456.789.0` |
| `VPS_SSH_KEY` | Clé privée SSH (au format PEM) | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `openssl rand -hex 32` |

### Flux de déploiement

```mermaid
graph LR
    A[Git Push main] --> B[CI Tests]
    B --> C[Tests Serveur]
    B --> D[Tests Client]
    B --> E[Tests E2E]
    C --> F[Déploiement Docker]
    D --> F
    E --> F
    F --> G[VPS: docker compose up --build]
    G --> H[Health Check]
    H --> I[✅ Prêt !]
```

### Fichiers de déploiement

| Fichier | Rôle |
|---------|------|
| `deploy/deploy.sh` | Script exécuté sur le VPS (backup DB, build, redémarrage) |
| `deploy/setup-vps.sh` | Configuration initiale du VPS (Docker, firewall) |
| `deploy/.env.production` | Template des variables d'environnement |

## 🔐 Authentification

**Identifiants par défaut :**
```
Utilisateur : admin
Mot de passe : admin123
```

## Couverture de code

![Couverture totale](badges/total-coverage.svg)

_Les badges utilisent `@vitest/coverage-v8` (c8). Note : le provider V8 ne produit pas de couverture ligne par ligne — les `statements` sont l'équivalent fonctionnel._

### Serveur

![Serveur](badges/server-coverage.svg)
| Métrique | Badge |
|----------|-------|
| Statements | ![Statements](badges/server-statements.svg) |
| Branches | ![Branches](badges/server-branches.svg) |
| Functions | ![Functions](badges/server-functions.svg) |

### Client

![Client](badges/client-coverage.svg)
| Métrique | Badge |
|----------|-------|
| Statements | ![Statements](badges/client-statements.svg) |
| Branches | ![Branches](badges/client-branches.svg) |
| Functions | ![Functions](badges/client-functions.svg) |

### Générer les badges

```bash
npm run coverage:all
```

## 🔧 Scripts npm

```bash
npm run test           # Tests unitaires (serveur + client)
npm run coverage:all   # Tests avec couverture + badges
```

## 🧪 Tests

```bash
# Tests unitaires
cd server && npm test         # 63 tests backend
cd client && npm test         # 21 tests frontend

# Tests E2E (Playwright)
cd client && npm run test:e2e         # 45 tests headless
cd client && npm run test:e2e:ui      # Mode interactif

# Avec couverture
npm run coverage:all
```
