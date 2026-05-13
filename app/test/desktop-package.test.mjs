import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildScriptSource = fs.readFileSync(
  path.join(__dirname, '../../desktop/scripts/build.mjs'),
  'utf8',
);

test('desktop build copies the executable to the repository root', () => {
  assert.match(buildScriptSource, /rootExePath/);
  assert.match(buildScriptSource, /copyFileSync\(exePath,\s*rootExePath\)/);
});
