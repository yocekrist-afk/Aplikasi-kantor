const sharp = require('sharp');

async function findOptionBounds() {
  // Inspect Part 1 options: y from 160 to 255
  // Columns approx: A: 70-170, B: 180-290, C: 300-430, D: 440-570, E: 580-720
  const p1Boxes = [
    { label: 'A', left: 75, top: 160, width: 105, height: 95 },
    { label: 'B', left: 190, top: 160, width: 105, height: 95 },
    { label: 'C', left: 310, top: 160, width: 120, height: 95 },
    { label: 'D', left: 450, top: 160, width: 120, height: 95 },
    { label: 'E', left: 590, top: 160, width: 125, height: 95 }
  ];

  for (const b of p1Boxes) {
    await sharp('subtes 7.jpeg')
      .extract({ left: b.left, top: b.top, width: b.width, height: b.height })
      .toFile(`public/assets/ist/opt_p1_${b.label.toLowerCase()}.png`);
    console.log(`Saved opt_p1_${b.label}`);
  }

  // Inspect Part 2 options: y from 735 to 825
  const p2Boxes = [
    { label: 'A', left: 75, top: 735, width: 105, height: 85 },
    { label: 'B', left: 190, top: 735, width: 105, height: 85 },
    { label: 'C', left: 310, top: 735, width: 120, height: 85 },
    { label: 'D', left: 450, top: 735, width: 120, height: 85 },
    { label: 'E', left: 590, top: 735, width: 125, height: 85 }
  ];

  for (const b of p2Boxes) {
    await sharp('subtes 7.jpeg')
      .extract({ left: b.left, top: b.top, width: b.width, height: b.height })
      .toFile(`public/assets/ist/opt_p2_${b.label.toLowerCase()}.png`);
    console.log(`Saved opt_p2_${b.label}`);
  }
}
findOptionBounds().catch(console.error);
