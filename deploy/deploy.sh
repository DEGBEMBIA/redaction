#!/bin/bash
# ================================================================
# Script de déploiement — Suivi Rédaction
# Exécuté sur le VPS via SSH depuis GitHub Actions
#
# Prérequis :
#   - Docker et Docker Compose installés sur le VPS
#   - Les fichiers du projet copiés dans $APP_DIR
#   - Un fichier .env configuré ou JWT_SECRET dans l'environnement
# ================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/redaction}"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "  Déploiement Suivi Rédaction"
echo "  Date: $(date)"
echo "  Répertoire: ${APP_DIR}"
echo "=========================================="

cd "${APP_DIR}"

# ─── 1. Vérifier que les fichiers essentiels sont présents ────
echo ""
echo "🔍 Vérification des fichiers..."
for f in docker-compose.yml server/Dockerfile client/Dockerfile client/nginx.conf; do
  if [ ! -f "${APP_DIR}/${f}" ]; then
    echo "   ❌ Fichier manquant : ${f}"
    echo "   Assurez-vous que le CI a copié tous les fichiers."
    exit 1
  fi
done
echo "   ✅ Tous les fichiers sont présents"

# ─── 2. Vérifier le JWT_SECRET ───────────────────────────────
echo ""
echo "🔑 Vérification du JWT_SECRET..."
if grep -q "change-this-secret" "${APP_DIR}/.env" 2>/dev/null || \
   [ "${JWT_SECRET:-}" = "change-this-secret-in-production" ] || \
   [ ! -f "${APP_DIR}/.env" ]; then
  echo "   ⚠️  JWT_SECRET non configuré ou utilisant la valeur par défaut !"
  echo "   ⚠️  Configurez-le dans le fichier .env ou via GitHub Secret."
  echo "   ⚠️  Le déploiement continue avec le secret par défaut (NON SÉCURISÉ)."
else
  echo "   ✅ JWT_SECRET configuré"
fi

# ─── 3. Sauvegarder la base de données ──────────────────────
echo ""
echo "📦 Sauvegarde de la base de données..."
mkdir -p "${BACKUP_DIR}"
if [ -f "${APP_DIR}/data/redaction.db" ]; then
  cp "${APP_DIR}/data/redaction.db" "${BACKUP_DIR}/redaction_${TIMESTAMP}.db"
  echo "   ✅ Base sauvegardée : backups/redaction_${TIMESTAMP}.db"
  # Nettoyer les backups de plus de 7 jours
  find "${BACKUP_DIR}" -name "redaction_*.db" -mtime +7 -delete 2>/dev/null || true
else
  echo "   ⚠️  Aucune base existante à sauvegarder"
fi

# ─── 4. Build et redémarrage des conteneurs ─────────────────
echo ""
echo "🐳 Build et redémarrage des conteneurs..."
docker compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.yml build --pull
docker compose -f docker-compose.yml up -d

# ─── 5. Attendre que les services soient prêts ───────────────
echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Health check du backend
MAX_RETRIES=12
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend opérationnel"
    break
  fi
  RETRY=$((RETRY + 1))
  echo "   ⏳ Tentative ${RETRY}/${MAX_RETRIES}..."
  sleep 5
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "   ❌ Échec : le backend n'a pas démarré"
  echo "   📋 Logs du backend :"
  docker compose logs --tail=50 server
  exit 1
fi

# Health check du frontend
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if curl -sf http://localhost:8080/ > /dev/null 2>&1; then
    echo "   ✅ Frontend opérationnel"
    break
  fi
  RETRY=$((RETRY + 1))
  echo "   ⏳ Tentative ${RETRY}/${MAX_RETRIES}..."
  sleep 3
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "   ⚠️  Frontend non accessible, vérifiez les logs"
  docker compose logs --tail=30 client
fi

# ─── 6. Nettoyage des images anciennes ───────────────────────
echo ""
echo "🧹 Nettoyage des images Docker non utilisées..."
docker image prune -f

# ─── 7. Afficher le statut final ─────────────────────────────
echo ""
echo "=========================================="
echo "  ✅ Déploiement terminé avec succès !"
echo "=========================================="
echo ""
docker compose ps
echo ""
echo "📋 Logs récents du backend :"
docker compose logs --tail=10 server
echo ""
echo "📋 Logs récents du frontend :"
docker compose logs --tail=10 client
