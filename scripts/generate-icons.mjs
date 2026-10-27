/* global process */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/icon', { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await sharp('public/icon/prism.svg').resize(size, size).png().toFile(`public/icon/${size}.png`);
}
process.stdout.write('Generated icon PNGs: 16, 32, 48, 128.\n');
