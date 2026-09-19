const sharp = require('sharp');

async function testIST8() {
  // Reference cubes banner
  await sharp('subtes 8.jpeg')
    .extract({ left: 250, top: 30, width: 900, height: 145 })
    .toFile('public/assets/ist/subtes8_reference_cubes.webp');
  console.log('Saved subtes8_reference_cubes.webp');

  const rows = [
    { row: 1, top: 235, height: 155, qNums: [137, 138, 139, 140, 141] },
    { row: 2, top: 430, height: 155, qNums: [142, 143, 144, 145, 146] },
    { row: 3, top: 615, height: 155, qNums: [147, 148, 149, 150, 151] },
    { row: 4, top: 820, height: 150, qNums: [152, 153, 154, 155, 156] }
  ];

  const cols = [
    { left: 240, width: 185 },
    { left: 460, width: 180 },
    { left: 675, width: 175 },
    { left: 895, width: 175 },
    { left: 1110, width: 170 }
  ];

  let qIdx = 1;
  for (const r of rows) {
    for (let c = 0; c < 5; c++) {
      const qNum = r.qNums[c];
      const col = cols[c];
      await sharp('subtes 8.jpeg')
        .extract({ left: col.left, top: r.top, width: col.width, height: r.height })
        .toFile(`public/assets/ist/subtes8_q${qIdx}.webp`);
      console.log(`Saved subtes8_q${qIdx}.webp (No. ${qNum})`);
      qIdx++;
    }
  }
}
testIST8().then(() => console.log('Subtest 8 cropped successfully!')).catch(console.error);
