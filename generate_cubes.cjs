const fs = require('fs');

const BLUE = '#4A86E8';
const STROKE = '#000000';
const STROKE_WIDTH = 1.5;

const FL_top = {x: 30, y: 70};
const FR_top = {x: 110, y: 70};
const FL_bot = {x: 30, y: 150};
const FR_bot = {x: 110, y: 150};

const BL_top = {x: 80, y: 40};
const BR_top = {x: 160, y: 40};
const BR_bot = {x: 160, y: 120};

function createSvg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <!-- Faces backgrounds -->
    <polygon points="${FL_top.x},${FL_top.y} ${FR_top.x},${FR_top.y} ${FR_bot.x},${FR_bot.y} ${FL_bot.x},${FL_bot.y}" fill="#ffffff" />
    <polygon points="${FL_top.x},${FL_top.y} ${BL_top.x},${BL_top.y} ${BR_top.x},${BR_top.y} ${FR_top.x},${FR_top.y}" fill="#ffffff" />
    <polygon points="${FR_top.x},${FR_top.y} ${BR_top.x},${BR_top.y} ${BR_bot.x},${BR_bot.y} ${FR_bot.x},${FR_bot.y}" fill="#ffffff" />
    ${content}
    <!-- Cube Outlines -->
    <polygon points="${FL_top.x},${FL_top.y} ${FR_top.x},${FR_top.y} ${FR_bot.x},${FR_bot.y} ${FL_bot.x},${FL_bot.y}" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
    <polygon points="${FL_top.x},${FL_top.y} ${BL_top.x},${BL_top.y} ${BR_top.x},${BR_top.y} ${FR_top.x},${FR_top.y}" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
    <polygon points="${FR_top.x},${FR_top.y} ${BR_top.x},${BR_top.y} ${BR_bot.x},${BR_bot.y} ${FR_bot.x},${FR_bot.y}" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
  </svg>`;
}

const cubes = {
  a: {
    front: `<rect x="70" y="70" width="40" height="40" fill="${BLUE}" />
            <rect x="30" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
            <line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="75" cy="47" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<polygon points="${FR_top.x},${FR_top.y} ${BR_bot.x},${BR_bot.y} ${FR_bot.x},${FR_bot.y}" fill="${BLUE}" />
            <line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BR_bot.x}" y2="${BR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  b: {
    front: `<rect x="30" y="70" width="40" height="40" fill="${BLUE}" />
            <rect x="70" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
            <line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<line x1="${FL_top.x}" y1="${FL_top.y}" x2="${BR_top.x}" y2="${BR_top.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
          <line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BL_top.x}" y2="${BL_top.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    right: `<polygon points="${FR_top.x},${FR_top.y} ${BR_bot.x},${BR_bot.y} ${FR_bot.x},${FR_bot.y}" fill="${BLUE}" />
            <line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BR_bot.x}" y2="${BR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  c: {
    front: `<rect x="30" y="70" width="40" height="40" fill="${BLUE}" />
            <rect x="70" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
            <line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="145" cy="45" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BR_bot.x}" y2="${BR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
            <line x1="${BR_top.x}" y1="${BR_top.y}" x2="${FR_bot.x}" y2="${FR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  d: {
    front: `<polygon points="${FR_top.x},${FR_top.y} ${FL_bot.x},${FL_bot.y} ${FR_bot.x},${FR_bot.y}" fill="${BLUE}" />
            <line x1="${FR_top.x}" y1="${FR_top.y}" x2="${FL_bot.x}" y2="${FL_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="75" cy="47" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BR_bot.x}" y2="${BR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
            <line x1="${BR_top.x}" y1="${BR_top.y}" x2="${FR_bot.x}" y2="${FR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  e: {
    front: `<polygon points="${FL_top.x},${FL_top.y} ${FR_bot.x},${FR_bot.y} ${FL_bot.x},${FL_bot.y}" fill="${BLUE}" />
            <line x1="${FL_top.x}" y1="${FL_top.y}" x2="${FR_bot.x}" y2="${FR_bot.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<line x1="${FL_top.x}" y1="${FL_top.y}" x2="${BR_top.x}" y2="${BR_top.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />
          <line x1="${FR_top.x}" y1="${FR_top.y}" x2="${BL_top.x}" y2="${BL_top.y}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    right: `<circle cx="150" cy="110" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`
  }
};

for (const [name, parts] of Object.entries(cubes)) {
  const content = parts.front + parts.top + parts.right;
  fs.writeFileSync(`cube_${name}.svg`, createSvg(content));
}
