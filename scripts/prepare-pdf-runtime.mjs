import fs from 'node:fs';
import path from 'node:path';
const root = path.join(process.cwd(), 'node_modules/pdfjs-dist');
const target = path.join(process.cwd(), 'public/pdf');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(
  path.join(root, 'build/pdf.worker.min.mjs'),
  path.join(target, 'pdf.worker.min.mjs'),
);
for (const name of ['standard_fonts', 'cmaps', 'wasm'])
  if (fs.existsSync(path.join(root, name)))
    fs.cpSync(path.join(root, name), path.join(target, name), { recursive: true });
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(target, 'LICENSE'));
console.log('PDF.js: worker e risorse locali pronti. Nessun PDF incluso.');
