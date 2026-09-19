import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  const svgBuffer = fs.readFileSync('subtes8_reference_cubes.svg');
  await sharp(svgBuffer)
    .webp({ quality: 90 })
    .toFile('public/assets/ist/subtes8_reference_cubes.webp');
  console.log('Converted subtes8_reference_cubes.svg to webp');
}
convert().catch(console.error);
