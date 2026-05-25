import fs from 'fs';
import path from 'path';

const SKIP_TAGS = new Set([
  'FormField', 'FormCard', 'PageHeader', 'DataTable', 'StatCard', 'AlertBanner',
  'EmptyState', 'LoadingSpinner', 'Modal', 'Badge', 'Header', 'NavLink', 'Link',
  'ExportPdfButton', 'ImmoSpecificFields', 'AmortissementComposants',
  'ResourceListPage', 'Layout', 'Sidebar', 'SearchBar', 'ConfirmDialog', 'AuditCard',
  'BrowserRouter', 'Navigate', 'Routes', 'Route', 'ProtectedRoute', 'AuthProvider',
  'HomeRedirect', 'AdminRoute', 'ComptableRoute', 'MagasinierRoute', 'DirecteurRoute',
  'TechnicienRoute', 'ErrorBoundary', 'StrictMode', 'Outlet', 'Icon', 'App',
  'Login', 'Unauthorized', 'NotFound', 'Dashboard',
  'ComptableDashboard', 'ComptableCategories', 'ComptableImmobilisations',
  'ComptableAmortissements', 'ComptableRapports', 'MagasinierDashboard',
  'MagasinierPieces', 'MagasinierStock', 'MagasinierMouvements', 'MagasinierDemandes',
  'DirecteurDashboard', 'DirecteurRapports', 'DirecteurDecisions', 'DirecteurAudit',
  'TechnicienDashboard', 'TechnicienPannes', 'TechnicienMaintenances',
  'TechnicienReparations', 'TechnicienDemandesPieces',
]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(jsx|tsx)$/.test(e.name)) files.push(p);
  }
  return files;
}

const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
const jsxTagRe = /<([A-Z][a-zA-Z0-9]*)\s/g;

const issues = [];
for (const file of walk('src')) {
  const code = fs.readFileSync(file, 'utf8');
  const imported = new Set();
  let m;
  while ((m = lucideRe.exec(code)) !== null) {
    m[1].split(',').forEach((s) => {
      const name = s.trim().split(/\s+as\s+/).pop().trim();
      if (name) imported.add(name);
    });
  }
  const used = new Set();
  let match;
  while ((match = jsxTagRe.exec(code)) !== null) {
    used.add(match[1]);
  }
  for (const tag of used) {
    if (SKIP_TAGS.has(tag)) continue;
    if (imported.has(tag)) continue;
    if (/Page$/.test(tag) || /Route$/.test(tag)) continue;
    if (code.includes(`function ${tag}`) || code.includes(`const ${tag} =`)) continue;
    if (!/^[A-Z][a-zA-Z0-9]+$/.test(tag)) continue;
    issues.push(`${file}: <${tag}>`);
  }
}

if (issues.length) {
  console.error('Icônes Lucide utilisées sans import :\n' + issues.join('\n'));
  process.exit(1);
}
console.log('OK: aucune icône Lucide manquante détectée.');
