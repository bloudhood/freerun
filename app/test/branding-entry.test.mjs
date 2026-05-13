import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');

const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('top header exposes the project link outside login', () => {
  const headerSource = read('app/src/components/layout/AppHeader.vue');
  const authSource = read('app/src/views/AuthPage.vue');
  const desktopMainSource = read('desktop/src/main.rs');

  assert.match(headerSource, /https:\/\/github\.com\/bloudhood\/freerun/);
  assert.match(headerSource, /v-if="props\.showGithub"/);
  assert.match(headerSource, /target="_blank"/);
  assert.match(headerSource, /rel="noreferrer"/);
  assert.doesNotMatch(authSource, /:show-github="false"/);
  assert.match(desktopMainSource, /with_new_window_req_handler/);
  assert.match(desktopMainSource, /open_external_url/);
  assert.match(desktopMainSource, /NewWindowResponse::Deny/);
});

test('login page uses the product name without web suffix', () => {
  const authSource = read('app/src/views/AuthPage.vue');

  assert.match(authSource, />\s*Freerun\s*</);
  assert.doesNotMatch(authSource, /Freerun Web/);
});

test('software icon is shared by web and desktop builds', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/public/app-icon.jpg')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'app/public/app-icon.ico')));
  assert.match(read('app/src/components/layout/AppHeader.vue'), /\/app-icon\.jpg/);
  assert.match(read('app/src/views/AuthPage.vue'), /\/app-icon\.jpg/);
  assert.match(read('app/index.html'), /\/app-icon\.ico/);
  assert.match(read('desktop/build.rs'), /app-icon\.ico/);
});

test('desktop window sets a runtime taskbar icon', () => {
  const desktopMainSource = read('desktop/src/main.rs');

  assert.ok(fs.existsSync(path.join(repoRoot, 'desktop/assets/app-icon-64.rgba')));
  assert.match(desktopMainSource, /with_window_icon\(Some\(load_window_icon\(\)\?\)\)/);
  assert.match(desktopMainSource, /Icon::from_rgba/);
  assert.match(desktopMainSource, /app-icon-64\.rgba/);
});
