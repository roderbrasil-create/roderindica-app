import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function walk(dir: string, allFiles: string[] = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.next') continue;
    const path = join(dir, file);
    if (statSync(path).isDirectory()) {
      walk(path, allFiles);
    } else {
      allFiles.push(path);
    }
  }
  return allFiles;
}

const all = walk('.');
console.log("ALL FILES IN WORKSPACE:");
all.forEach(f => {
  if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')) {
    console.log(f);
  }
});
