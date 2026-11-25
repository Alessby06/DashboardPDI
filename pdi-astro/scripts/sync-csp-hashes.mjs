import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const vercelPath = path.resolve(rootDir, '..', 'vercel.json');

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtml(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const hashes = new Set();
const scriptRe = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

for (const htmlFile of walkHtml(distDir)) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  let match;
  while ((match = scriptRe.exec(html)) !== null) {
    const body = match[1];
    if (body) {
      const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
      hashes.add(`'sha256-${digest}'`);
    }
  }
}

const sortedHashes = [...hashes].sort();
const vercelRaw = fs.readFileSync(vercelPath, 'utf8');
const updated = vercelRaw.replace(
  /script-src\s+'self'(?:\s+'sha256-[^']+')*/,
  `script-src 'self' ${sortedHashes.join(' ')}`
);

if (updated === vercelRaw) {
  console.log(`CSP ya está sincronizado (${sortedHashes.length} hashes).`);
} else {
  fs.writeFileSync(vercelPath, updated, 'utf8');
  console.log(`CSP actualizado en vercel.json con ${sortedHashes.length} hashes únicos.`);
}
