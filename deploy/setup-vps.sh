#!/bin/bash
# ================================================================
# Script d'initialisation du VPS — Suivi Rédaction
# À exécuter UNE SEULE FOIS sur le VPS pour le préparer
#
# Usage :
#   ssh root@<IP_DU_VPS>
#   curl -fsSL https://raw.githubusercontent.com/.../deploy/setup-vps.sh | bash
# ================================================================
set -euo pipefail

echo "=========================================="
echo "  Initialisation du VPS - Suivi Rédaction"
echo "=========================================="

# ─── 1. Mise à jour du système ───────────────────────────────
echo ""
echo "📦 Mise à jour du système..."
apt-get update -qq
apt-get upgrade -y -qq

# ─── 2. Installation de Docker ───────────────────────────────
echo ""
echo "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | bash
  echo "   ✅ Docker installé"
else
  echo "   ✅ Docker déjà installé ($(docker --version))"
fi

# ─── 3. Installation de Docker Compose (plugin) ──────────────
echo ""
echo "🔧 Installation de Docker Compose..."
if ! docker compose version &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
  echo "   ✅ Docker Compose plugin installé"
else
  echo "   ✅ Docker Compose déjà installé ($(docker compose version))"
fi

# ─── 4. Création du répertoire de l'application ──────────────
echo ""
echo "📁 Création du répertoire /opt/redaction..."
mkdir -p /opt/redaction/data
mkdir -p /opt/redaction/backups
echo "   ✅ Répertoires créés"

# ─── 5. Installation d'outils utiles ─────────────────────────
echo ""
echo "🔧 Installation d'outils supplémentaires..."
apt-get install -y -qq curl htop ufw fail2ban

# ─── 6. Configuration firewall de base ───────────────────────
echo ""
echo "🛡️  Configuration du firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "   ✅ Firewall configuré (ports 22, 80, 443 ouverts)"

# ─── 7. Vérification finale ──────────────────────────────────
echo ""
echo "=========================================="
echo "  ✅ VPS prêt pour le déploiement !"
echo "=========================================="
echo ""
echo "📋 Résumé :"
echo "   - Docker      : $(docker --version 2>/dev/null || echo '❌')"
echo "   - Compose     : $(docker compose version 2>/dev/null || echo '❌')"
echo "   - App Dir     : /opt/redaction/"
echo "   - Firewall    : actif (22, 80, 443)"
echo ""
echo "▶️  Configurez maintenant les secrets GitHub :"
echo "   - VPS_HOST     : votre IP"
echo "   - VPS_SSH_KEY  : clé privée SSH"
echo "   - JWT_SECRET   : secret JWT"
echo ""
echo "▶️  Poussez sur main pour déployer automatiquement"
