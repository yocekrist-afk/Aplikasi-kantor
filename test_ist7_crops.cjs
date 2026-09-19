const sharp = require('sharp');
const fs = require('fs');

async function testCropAll() {
  const rows = [
    // Part 1:
    { row: 1, top: 310, height: 107, qNums: [117, 118, 119, 120] },
    { row: 2, top: 434, height: 109, qNums: [121, 122, 123, 124] },
    { row: 3, top: 560, height: 107, qNums: [125, 126, 127, 128] },
    // Part 2:
    { row: 4, top: 889, height: 109, qNums: [129, 130, 131, 132] },
    { row: 5, top: 1012, height: 109, qNums: [133, 134, 135, 136] }
  ];

  const cols = [
    { left: 120, width: 145 },
    { left: 281, width: 145 },
    { left: 442, width: 146 },
    { left: 605, width: 147 }
  ];

  let qIndex = 1;
  for (const r of rows) {
    for (let c = 0; c < 4; c++) {
      const qNum = r.qNums[c];
      const col = cols[c];
      // Inset by 2px to avoid border lines
      const left = col.left + 2;
      const top = r.top + 2;
      const width = col.width - 4;
      const height = r.height - 4;

      const base = await sharp('subtes 7.jpeg')
        .extract({ left, top, width, height })
        .toBuffer();

      // Check dark pixels on borders
      const { data, info } = await sharp(base).raw().toBuffer({ resolveWithObject: true });
      let borderDark = 0;
      for (let x = 0; x < info.width; x++) {
        if ((data[(0 * info.width + x) * info.channels] + data[(0 * info.width + x) * info.channels + 1] + data[(0 * info.width + x) * info.channels + 2])/3 < 140) borderDark++;
        if ((data[((info.height-1) * info.width + x) * info.channels] + data[((info.height-1) * info.width + x) * info.channels + 1] + data[((info.height-1) * info.width + x) * info.channels + 2])/3 < 140) borderDark++;
      }
      for (let y = 0; y < info.height; y++) {
        if ((data[(y * info.width + 0) * info.channels] + data[(y * info.width + 0) * info.channels + 1] + data[(y * info.width + 0) * info.channels + 2])/3 < 140) borderDark++;
        if ((data[(y * info.width + (info.width-1)) * info.channels] + data[(y * info.width + (info.width-1)) * info.channels + 1] + data[(y * info.width + (info.width-1)) * info.channels + 2])/3 < 140) borderDark++;
      }

      console.log(`Q${qIndex} (No. ${qNum}): borderDark=${borderDark}`);
      qIndex++;
    }
  }
}
testCropAll().catch(console.error);
