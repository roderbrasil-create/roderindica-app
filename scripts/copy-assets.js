import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distAssets = path.resolve(root, 'dist', 'assets');
const rootAssets = path.resolve(root, 'assets');
const distIndex = path.resolve(root, 'dist', 'index.html');
const rootIndex = path.resolve(root, 'index.html');

try {
  if (fs.existsSync(distAssets)) {
    fs.cpSync(distAssets, rootAssets, { recursive: true });
    console.log("✓ Synchronized dist/assets to ./assets for Hostinger static file serving");
  }
  if (fs.existsSync(distIndex)) {
    fs.copyFileSync(distIndex, rootIndex);
    console.log("✓ Synchronized dist/index.html to ./index.html for Hostinger static file serving");
  }
} catch (err) {
  console.error("Asset sync warning:", err);
}
