const sharp = require('sharp');
const fs = require('fs');

async function testCropAll() {
  const rows = [
    // Part 1:
    { top: 310, height: 107, qNums: [117, 118, 119, 120] },
    { top: 434, height: 109, qNums: [121, 122, 123, 124] },
    { top: 560, height: 107, qNums: [125, 126, 127, 128] },
    // Part 2:
    { top: 889, height: 109, qNums: [129, 130, 131, 132] },
    { top: 1012, height: 109, qNums: [133, 134, 135, 136] }
  ];

  const cols = [
    { left: 120, width: 145 },
    { left: 281, width: 145 },
    { left: 442, width: 146 },
    { left: 605, width: 147 }
  ];

  for (const row of rows) {
    for (let c = 0; c < 4; c++) {
      const qNum = row.qNums[c];
      const col = cols[c];
      const filename = `public/assets/ist/crop_test_${qNum}.png`;
      await sharp('subtes 7.jpeg')
        .extract({ left: col.left, top: row.top, width: col.width, height: row.height })
        .toFile(filename);
      console.log(`Cropped ${qNum} -> ${filename}`);
    }
  }
}
testCropAll().then(() => console.log('All 20 cropped successfully!')).catch(console.error);
