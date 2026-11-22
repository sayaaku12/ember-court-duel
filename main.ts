// EMBER COURT — hand-in program (Node 22, standard library only).
// Copies the static game and the screenshots beside this file into the
// grader's output directory and writes the dossier the judge reads,
// using the vendored make.fun library (vendor/makefun-game.ts, kit copy).
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), {
    recursive: true,
  });
}

const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// A short run summary on stdout only; nothing about the run leaks into /output,
// so the two grader runs still write byte-identical files.
const shots = readdirSync(join(outDir, 'screenshots'))
  .filter((n) => !n.startsWith('.'))
  .sort();
console.log(
  'ember-court: game files copied, ' + shots.length + ' screenshots, dossier ' +
  statSync(dossierPath).size + ' bytes -> ' + dossierPath,
);
