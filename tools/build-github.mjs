import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(join(root, 'Index.html'), 'utf8');

for (const partial of ['Styles', 'StylesV2', 'Hyperion', 'AppV2']) {
  const content = await readFile(join(root, `${partial}.html`), 'utf8');
  html = html.replace(`<?!= include_('${partial}'); ?>`, content);
}

html = html.replace(/\s*<base target="_top">\s*/, '\n');
html = html.replace('</head>', `  <script src="./config.js"></script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script src="./auth.js"></script>
  </head>`);

if (html.includes('<?!=')) throw new Error('An Apps Script template marker remains in GitHub output.');
await writeFile(join(root, 'docs', 'index.html'), html, 'utf8');
console.log('GitHub Pages build generated: docs/index.html');
