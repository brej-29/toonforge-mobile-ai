import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${path}/${e.name}`) : `${path}/${e.name}`))).flat();
}
const assets = (await files('dist')).filter(f => !f.endsWith('sw.js') && !f.endsWith('.map') && !f.endsWith('.json'));
const digest = createHash('sha256');
for (const file of assets) digest.update(await readFile(file));
const version = digest.digest('hex').slice(0, 16);
const urls = ['./', ...assets.map(f => './' + f.slice(5))];
await writeFile('dist/sw.js', `const CACHE='toonforge-${version}';
const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('toonforge-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreVary:true})).then(cached=>cached||fetch(e.request)));});
`);
console.log(`Offline cache: ${assets.length} public assets, version ${version}.`);
