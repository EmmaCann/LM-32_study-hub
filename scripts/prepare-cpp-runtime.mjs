import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = process.cwd();
const target = path.join(root, 'public/cpp/vendor');
fs.mkdirSync(target, { recursive: true });
const clang = path.join(root, 'node_modules/@yowasp/clang');
const version = JSON.parse(fs.readFileSync(path.join(clang, 'package.json'), 'utf8')).version;
if (version !== '22.0.0-git20542-10') throw new Error('Versione toolchain non revisionata');
const destination = path.join(target, `clang-${version}`);
fs.mkdirSync(destination, { recursive: true });
const assets = [];
for (const name of [
  'bundle.js',
  'llvm.core.wasm',
  'llvm.core2.wasm',
  'llvm.core3.wasm',
  'llvm.core4.wasm',
  'llvm-resources.tar',
]) {
  const data = fs.readFileSync(path.join(clang, 'gen', name));
  fs.writeFileSync(path.join(destination, name), data);
  assets.push({
    name,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  });
}
fs.cpSync(
  path.join(root, 'node_modules/@bjorn3/browser_wasi_shim/dist'),
  path.join(target, 'wasi-shim-0.4.2'),
  { recursive: true },
);
fs.writeFileSync(
  path.join(target, 'manifest.json'),
  JSON.stringify(
    {
      toolchain: `@yowasp/clang@${version}`,
      assets,
      totalBytes: assets.reduce((n, a) => n + a.bytes, 0),
    },
    null,
    2,
  ),
);
console.log(
  `Toolchain C++ pronta: ${(assets.reduce((n, a) => n + a.bytes, 0) / 1048576).toFixed(1)} MiB; download soltanto all'avvio.`,
);
