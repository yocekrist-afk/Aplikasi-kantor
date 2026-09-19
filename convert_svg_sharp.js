import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  for (const opt of ['a', 'b', 'c', 'd', 'e']) {
    const svgBuffer = fs.readFileSync(`cube_${opt}.svg`);
    await sharp(svgBuffer)
      .webp({ quality: 90 })
      .toFile(`public/assets/ist/subtes8_opt_${opt}.webp`);
    console.log(`Converted cube_${opt}.svg to webp`);
    
    // Also copy to uppercase versions to match any references
    await sharp(svgBuffer)
      .webp({ quality: 90 })
      .toFile(`public/assets/ist/subtes8_opt_${opt.toUpperCase()}.webp`);
  }
}
convert().catch(console.error);
