/**
 * Générateur de badges de couverture de code (SVG Shields.io-style)
 *
 * Lit les rapports de couverture du serveur et du client,
 * et génère des badges SVG pour chaque métrique.
 *
 * Usage : node scripts/generate-badges.js
 * Prérequis : lancer d'abord `npm run test:coverage` dans server/ et client/
 */

const fs = require('fs');
const path = require('path');

const PROJECTS = [
  { name: 'server', label: 'Serveur' },
  { name: 'client', label: 'Client' },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'badges');

function colorFor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

function hexFor(colorName) {
  const map = {
    brightgreen: '#4c1',
    green: '#97ca00',
    yellowgreen: '#a4a61d',
    yellow: '#dfb317',
    orange: '#fe7d37',
    red: '#e05d44',
  };
  return map[colorName] || '#9f9f9f';
}

function svgBadge(label, value, color) {
  const l = String(label);
  const v = value != null ? String(value) : 'N/A';
  const finalColor = value != null ? color : 'lightgrey';
  const lenL = Math.max(l.length * 7 + 12, 30);
  const lenV = v.length * 7 + 12;
  const totalW = lenL + lenV;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${v}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".42"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalW}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${lenL}" height="20" fill="#555"/>
    <rect x="${lenL}" width="${lenV}" height="20" fill="${hexFor(finalColor)}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${lenL / 2}" y="15" fill="#010101" fill-opacity=".3">${l}</text>
    <text x="${lenL / 2}" y="14">${l}</text>
    <text x="${lenL + lenV / 2}" y="15" fill="#010101" fill-opacity=".3">${v}</text>
    <text x="${lenL + lenV / 2}" y="14">${v}</text>
  </g>
</svg>`;
}

/** Parse coverage-final.json (format produit par @vitest/coverage-v8) */
function readCoverage(projectDir) {
  // Essayer coverage-summary.json d'abord
  const summaryPath = path.join(projectDir, 'coverage', 'coverage-summary.json');
  try {
    const raw = fs.readFileSync(summaryPath, 'utf-8');
    const json = JSON.parse(raw);
    if (json.total) return json;
  } catch { /* continue */ }

  // Fallback : parser coverage-final.json
  const finalPath = path.join(projectDir, 'coverage', 'coverage-final.json');
  try {
    const raw = fs.readFileSync(finalPath, 'utf-8');
    const files = JSON.parse(raw);
    return computeTotalsFromFinal(files);
  } catch (e) {
    console.warn(`  ⚠️  Aucun rapport trouvé dans ${projectDir}/coverage/`);
    return null;
  }
}

function computeTotalsFromFinal(files) {
  let total = { statements: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 }, lines: { covered: 0, total: 0 } };
  for (const filePath of Object.keys(files)) {
    const f = files[filePath];
    if (f.s) {
      for (const key of Object.keys(f.s)) {
        if (f.s[key] > 0) total.statements.covered++;
        total.statements.total++;
      }
    }
    if (f.b) {
      for (const key of Object.keys(f.b)) {
        for (const branch of f.b[key]) {
          if (branch > 0) total.branches.covered++;
          total.branches.total++;
        }
      }
    }
    if (f.f) {
      for (const key of Object.keys(f.f)) {
        if (f.f[key] > 0) total.functions.covered++;
        total.functions.total++;
      }
    }
    if (f.l) {
      for (const key of Object.keys(f.l)) {
        if (f.l[key] > 0) total.lines.covered++;
        total.lines.total++;
      }
    }
  }

  function pct(covered, total) {
    return total === 0 ? 0 : (covered / total) * 100;
  }

  return {
    total: {
      statements: { pct: pct(total.statements.covered, total.statements.total), covered: total.statements.covered, total: total.statements.total },
      branches: { pct: pct(total.branches.covered, total.branches.total), covered: total.branches.covered, total: total.branches.total },
      functions: { pct: pct(total.functions.covered, total.functions.total), covered: total.functions.covered, total: total.functions.total },
      lines: { pct: pct(total.lines.covered, total.lines.total), covered: total.lines.covered, total: total.lines.total },
    },
  };
}

function formatPct(val) {
  if (val === null || val === undefined) return null;
  return Number(val).toFixed(1);
}

function generateAll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let globalSum = 0;
  let globalCount = 0;

  for (const project of PROJECTS) {
    const projectDir = path.join(__dirname, '..', project.name);
    const summary = readCoverage(projectDir);

    if (!summary || !summary.total) {
      console.log(`\n📦 ${project.label} — Aucune donnée de couverture`);
      continue;
    }

    const t = summary.total;
    const s = formatPct(t.statements?.pct);
    const b = formatPct(t.branches?.pct);
    const f = formatPct(t.functions?.pct);
    const l = formatPct(t.lines?.pct);

    console.log(`\n📦 ${project.label}`);
    console.log(`   Statements : ${s}%  (${t.statements?.covered ?? 0}/${t.statements?.total ?? 0})`);
    console.log(`   Branches   : ${b}%  (${t.branches?.covered ?? 0}/${t.branches?.total ?? 0})`);
    console.log(`   Functions  : ${f}%  (${t.functions?.covered ?? 0}/${t.functions?.total ?? 0})`);

    // Badges individuels
    // Note : @vitest/coverage-v8 (c8) ne produit pas de couverture ligne par ligne,
    // on utilise statements, branches et functions uniquement.
    const metrics = [
      { key: 'statements', label: `${project.label} — Statements`, val: s },
      { key: 'branches', label: `${project.label} — Branches`, val: b },
      { key: 'functions', label: `${project.label} — Functions`, val: f },
    ];

    for (const m of metrics) {
      const pct = m.val;
      const badge = svgBadge(m.label, pct != null ? `${pct}%` : 'N/A', colorFor(parseFloat(pct || 0)));
      fs.writeFileSync(path.join(OUTPUT_DIR, `${project.name}-${m.key}.svg`), badge, 'utf-8');
    }

    // Badge combiné (moyenne des 3 métriques disponibles avec v8)
    // Note : les 'lines' ne sont pas produites par @vitest/coverage-v8 (c8),
    // on utilise statements, branches et functions uniquement.
    const vals = [parseFloat(s || '0'), parseFloat(b || '0'), parseFloat(f || '0')].filter(v => !isNaN(v));
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const combined = svgBadge(`${project.label} — Couverture`, `${avg.toFixed(1)}%`, colorFor(avg));
    fs.writeFileSync(path.join(OUTPUT_DIR, `${project.name}-coverage.svg`), combined, 'utf-8');

    globalSum += avg;
    globalCount++;
  }

  // Badge global
  if (globalCount > 0) {
    const totalAvg = globalSum / globalCount;
    const badge = svgBadge('Total — Couverture', `${totalAvg.toFixed(1)}%`, colorFor(totalAvg));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'total-coverage.svg'), badge, 'utf-8');
    console.log(`\n🌐 Moyenne globale : ${totalAvg.toFixed(1)}%`);
  }

  console.log(`\n✅ Badges générés dans ${OUTPUT_DIR}/`);
}

generateAll();
