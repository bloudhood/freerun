import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const outDir = path.join(rootDir, 'desktop-dist');
const exeName = process.platform === 'win32' ? 'Freerun.exe' : 'Freerun';
const exePath = path.join(rootDir, 'desktop', 'target', 'release', exeName);
const rootExePath = path.join(rootDir, exeName);

function run(command, args, options = {}) {
  const isWindows = process.platform === 'win32';
  const file = isWindows ? process.env.ComSpec || 'cmd.exe' : command;
  const spawnArgs = isWindows
    ? ['/d', '/s', '/c', [command, ...args.map(quoteCmdArg)].join(' ')]
    : args;

  const result = spawnSync(file, spawnArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with code ${result.status}`);
  }
}

function quoteCmdArg(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_.\\/:=+-]+$/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

const npmCommand = 'npm';
const cargoCommand = 'cargo';

run(npmCommand, ['--prefix', 'app', 'run', 'build'], {
  env: {
    ...process.env,
    VITE_APP_TARGET: 'desktop',
    VITE_API_MODE: 'local',
    VITE_TUNNEL_API_BASE: '/devproxy',
    VITE_AUTORUN_SERVER_BASE: '',
  },
});

run(cargoCommand, ['build', '--manifest-path', path.join('desktop', 'Cargo.toml'), '--release'], {
  env: {
    ...process.env,
    FREERUN_DESKTOP_ASSET_STAMP: String(Date.now()),
  },
});

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(exePath, path.join(outDir, exeName));
fs.copyFileSync(exePath, rootExePath);
fs.writeFileSync(
  path.join(outDir, 'README.txt'),
  [
    'Freerun Desktop',
    '',
    'Run Freerun.exe directly.',
    'The web client and /devproxy are embedded in the executable.',
    '',
  ].join('\r\n'),
);

console.log(`Desktop package: ${outDir}`);
console.log(`Desktop executable: ${rootExePath}`);
