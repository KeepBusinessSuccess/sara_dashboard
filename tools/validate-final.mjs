import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = [];

async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    const rel = relative(root, path).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (!['legacy', 'preview', 'outputs'].includes(entry.name)) await walk(path);
    } else if (extname(entry.name) === '.gs') sources.push({ path, rel });
  }
}

await walk(root);
for (const source of sources) new Function(await readFile(source.path, 'utf8'));
for (const file of ['Hyperion.html', 'AppV2.html', 'docs/auth.js', 'docs/config.js']) {
  const text = await readFile(join(root, file), 'utf8');
  new Function(extname(file) === '.html' ? text.replace(/^\s*<script>\s*/, '').replace(/\s*<\/script>\s*$/, '') : text);
}

JSON.parse(await readFile(join(root, 'appsscript.json'), 'utf8'));
JSON.parse(await readFile(join(root, 'gateway', 'appsscript.json'), 'utf8'));
const access = await readFile(join(root, 'AccessConstants.gs'), 'utf8');
const security = await readFile(join(root, 'Security.gs'), 'utf8');
const hierarchy = await readFile(join(root, 'Hierarchies.gs'), 'utf8');
const backend = await readFile(join(root, 'GatewayBackend.gs'), 'utf8');
const gateway = await readFile(join(root, 'gateway', 'Gateway.gs'), 'utf8');
const page = await readFile(join(root, 'docs', 'index.html'), 'utf8');
const config = await readFile(join(root, 'docs', 'config.js'), 'utf8');

if (!access.includes("innovacion@kbsbusiness.com")) throw new Error('Protected superadmin email is missing.');
if (!security.includes('requireSuperAdmin_')) throw new Error('Superadmin authorization is missing.');
if (!hierarchy.includes('requireSuperAdmin_(context)')) throw new Error('Hierarchy mutations are not superadmin-only.');
if (!backend.includes('computeHmacSha256Signature') || !backend.includes('constantTimeEqual_')) throw new Error('Backend signature verification is incomplete.');
if (!gateway.includes('GATEWAY_ALLOWED_ACTIONS') || !gateway.includes('computeHmacSha256Signature')) throw new Error('Gateway allowlist or signing is missing.');
if (!page.includes('themeButton') || !page.includes('data-theme="light"')) throw new Error('Light/dark theme support is missing.');
if (page.includes('<?!=')) throw new Error('GitHub page contains Apps Script template syntax.');
if (/[⌂◎△◇✓◉↗★⌘↻☰→]/u.test(page)) throw new Error('Forbidden pictographic symbols remain.');
if (config.includes('auth/spreadsheets')) throw new Error('Frontend must not request spreadsheet access.');
if (/18orNndLqfUDD|BEGIN PRIVATE|client_secret|SARA_SHARED_SECRET\s*[:=]\s*['"][^'"]+/i.test(page + config)) throw new Error('A sensitive value appears in the GitHub frontend.');

console.log(`Final validation passed: ${sources.length} Apps Script files, 2 manifests, frontend security and themes.`);
