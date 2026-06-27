import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function findRecentFiles(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const path = join(dir, file);
    try {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        findRecentFiles(path);
      } else {
        const ageInMs = Date.now() - stats.mtimeMs;
        const ageInMins = ageInMs / 1000 / 60;
        if (ageInMins < 60) {
          console.log(`NEW/MODIFIED FILE: ${path} (${stats.size} bytes, ${ageInMins.toFixed(1)} mins ago)`);
        }
      }
    } catch (e) {}
  }
}

console.log("Searching for recently modified/created files in workspace...");
findRecentFiles('.');
