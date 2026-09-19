const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'public', 'assets', 'ist');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('--- Processing Subtest 7 (FA) ---');
  // Part 1 and Part 2 Options Banners
  const p1Banner = await sharp('subtes 7.jpeg')
    .extract({ left: 100, top: 160, width: 655, height: 95 })
    .toBuffer();
  await sharp(p1Banner).webp({ quality: 95 }).toFile(path.join(outDir, 'subtes7_options_part1.webp'));
  await sharp(p1Banner).png().toFile(path.join(outDir, 'subtes7_options_part1.png'));
  await sharp(p1Banner).png().toFile(path.join(outDir, 'fa_options_part1.png'));

  const p2Banner = await sharp('subtes 7.jpeg')
    .extract({ left: 130, top: 735, width: 610, height: 85 })
    .toBuffer();
  await sharp(p2Banner).webp({ quality: 95 }).toFile(path.join(outDir, 'subtes7_options_part2.webp'));
  await sharp(p2Banner).png().toFile(path.join(outDir, 'subtes7_options_part2.png'));
  await sharp(p2Banner).png().toFile(path.join(outDir, 'fa_options_part2.png'));

  // Individual Options Part 1:
  const p1OptCoords = {
    a: { left: 107, width: 110 },
    b: { left: 235, width: 95 },
    c: { left: 348, width: 125 },
    d: { left: 510, width: 105 },
    e: { left: 640, width: 112 }
  };
  for (const [letter, coord] of Object.entries(p1OptCoords)) {
    const buf = await sharp('subtes 7.jpeg')
      .extract({ left: coord.left, top: 160, width: coord.width, height: 95 })
      .toBuffer();
    await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes7_opt_p1_${letter}.webp`));
    await sharp(buf).png().toFile(path.join(outDir, `subtes7_opt_p1_${letter}.png`));
  }

  // Individual Options Part 2:
  const p2OptCoords = {
    a: { left: 135, width: 95 },
    b: { left: 245, width: 110 },
    c: { left: 382, width: 112 },
    d: { left: 502, width: 140 },
    e: { left: 660, width: 78 }
  };
  for (const [letter, coord] of Object.entries(p2OptCoords)) {
    const buf = await sharp('subtes 7.jpeg')
      .extract({ left: coord.left, top: 735, width: coord.width, height: 85 })
      .toBuffer();
    await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes7_opt_p2_${letter}.webp`));
    await sharp(buf).png().toFile(path.join(outDir, `subtes7_opt_p2_${letter}.png`));
  }

  // 20 Questions for Subtest 7:
  const sub7Rows = [
    { row: 1, top: 312, height: 103, qNums: [117, 118, 119, 120] },
    { row: 2, top: 436, height: 103, qNums: [121, 122, 123, 124] },
    { row: 3, top: 562, height: 102, qNums: [125, 126, 127, 128] },
    { row: 4, top: 894, height: 102, qNums: [129, 130, 131, 132] },
    { row: 5, top: 1014, height: 103, qNums: [133, 134, 135, 136] }
  ];

  const sub7Cols = [
    { left: 122, width: 140 },
    { left: 283, width: 140 },
    { left: 444, width: 141 },
    { left: 607, width: 142 }
  ];

  let qIndex7 = 1;
  for (const r of sub7Rows) {
    for (let c = 0; c < 4; c++) {
      const qNum = r.qNums[c];
      const col = sub7Cols[c];
      const buf = await sharp('subtes 7.jpeg')
        .extract({ left: col.left, top: r.top, width: col.width, height: r.height })
        .toBuffer();

      // Save as subtes7_q1.webp ... subtes7_q20.webp (as expected by TestEngine.tsx)
      await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes7_q${qIndex7}.webp`));
      await sharp(buf).png().toFile(path.join(outDir, `subtes7_q${qIndex7}.png`));

      // Also save with actual question numbers 117-136
      await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes7_q${qNum}.webp`));
      await sharp(buf).png().toFile(path.join(outDir, `subtes7_q${qNum}.png`));

      console.log(`Subtest 7: Q${qIndex7} (No. ${qNum}) generated`);
      qIndex7++;
    }
  }

  console.log('--- Processing Subtest 8 (WU) ---');
  // Reference cubes banner
  const sub8RefBanner = await sharp('subtes 8.jpeg')
    .extract({ left: 250, top: 30, width: 900, height: 145 })
    .toBuffer();
  await sharp(sub8RefBanner).webp({ quality: 95 }).toFile(path.join(outDir, 'subtes8_reference_cubes.webp'));
  await sharp(sub8RefBanner).png().toFile(path.join(outDir, 'subtes8_reference_cubes.png'));
  await sharp(sub8RefBanner).png().toFile(path.join(outDir, 'wu_options.png'));

  // 20 Questions for Subtest 8:
  const sub8Rows = [
    { row: 1, top: 235, height: 155, qNums: [137, 138, 139, 140, 141] },
    { row: 2, top: 430, height: 155, qNums: [142, 143, 144, 145, 146] },
    { row: 3, top: 615, height: 155, qNums: [147, 148, 149, 150, 151] },
    { row: 4, top: 820, height: 150, qNums: [152, 153, 154, 155, 156] }
  ];

  const sub8Cols = [
    { left: 240, width: 185 },
    { left: 460, width: 180 },
    { left: 675, width: 175 },
    { left: 895, width: 175 },
    { left: 1110, width: 170 }
  ];

  let qIndex8 = 1;
  for (const r of sub8Rows) {
    for (let c = 0; c < 5; c++) {
      const qNum = r.qNums[c];
      const col = sub8Cols[c];
      const buf = await sharp('subtes 8.jpeg')
        .extract({ left: col.left, top: r.top, width: col.width, height: r.height })
        .toBuffer();

      await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes8_q${qIndex8}.webp`));
      await sharp(buf).png().toFile(path.join(outDir, `subtes8_q${qIndex8}.png`));

      await sharp(buf).webp({ quality: 95 }).toFile(path.join(outDir, `subtes8_q${qNum}.webp`));
      await sharp(buf).png().toFile(path.join(outDir, `subtes8_q${qNum}.png`));

      console.log(`Subtest 8: Q${qIndex8} (No. ${qNum}) generated`);
      qIndex8++;
    }
  }

  console.log('All crops generated successfully!');
}

run().catch(console.error);
