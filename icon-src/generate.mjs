import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const regular = readFileSync(new URL('./icon-regular.svg', import.meta.url));
const maskable = readFileSync(new URL('./icon-maskable.svg', import.meta.url));

const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));

const jobs = [
  { src: regular, size: 192, name: 'icon-192.png' },
  { src: regular, size: 512, name: 'icon-512.png' },
  { src: maskable, size: 512, name: 'icon-512-maskable.png' },
  { src: regular, size: 180, name: 'apple-touch-icon.png' },
];

for (const { src, size, name } of jobs) {
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(outDir + name);
  console.log(`wrote ${name} (${size}x${size})`);
}
