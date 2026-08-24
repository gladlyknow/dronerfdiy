import { cp, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const routes = ['safety', 'fpv', 'build', 'tuning', 'rf', 'expresslrs', 'o3', 'battery', 'projects', 'tools'];
const source = resolve('dist/drone/index.html');
await stat(source);
await Promise.all(routes.map(async (route) => {
  const dir = resolve('dist/drone', route);
  await mkdir(dir, { recursive: true });
  await cp(source, resolve(dir, 'index.html'));
}));

const requiredEntries = [
  resolve('dist/index.html'),
  resolve('dist/redio/index.html'),
  source,
  ...routes.map((route) => resolve('dist/drone', route, 'index.html')),
];

await Promise.all(requiredEntries.map((entry) => stat(entry)));
console.log(`Site routes verified: ${requiredEntries.length} public entry points.`);
