const fs = require('fs');

const BLUE = '#4A86E8';
const STROKE = '#000000';
const STROKE_WIDTH = 1.5;

function getCubeContent(parts, dx) {
    // We just wrap the parts in a group with transform
    return `<g transform="translate(${dx}, 0)">
        <polygon points="30,70 110,70 110,150 30,150" fill="#ffffff" />
        <polygon points="30,70 80,40 160,40 110,70" fill="#ffffff" />
        <polygon points="110,70 160,40 160,120 110,150" fill="#ffffff" />
        ${parts.front}
        ${parts.top}
        ${parts.right}
        <polygon points="30,70 110,70 110,150 30,150" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
        <polygon points="30,70 80,40 160,40 110,70" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
        <polygon points="110,70 160,40 160,120 110,150" fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round"/>
        <text x="95" y="180" font-family="Arial" font-size="24" fill="${STROKE}" text-anchor="middle">${parts.label}</text>
    </g>`;
}

const cubes = [
  {
    label: 'a',
    front: `<rect x="70" y="70" width="40" height="40" fill="${BLUE}" /><rect x="30" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="75" cy="47" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<polygon points="110,70 160,120 110,150" fill="${BLUE}" /><line x1="110" y1="70" x2="160" y2="120" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  {
    label: 'b',
    front: `<rect x="30" y="70" width="40" height="40" fill="${BLUE}" /><rect x="70" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<line x1="30" y1="70" x2="160" y2="40" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="110" y1="70" x2="80" y2="40" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    right: `<polygon points="110,70 160,120 110,150" fill="${BLUE}" /><line x1="110" y1="70" x2="160" y2="120" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  {
    label: 'c',
    front: `<rect x="30" y="70" width="40" height="40" fill="${BLUE}" /><rect x="70" y="110" width="40" height="40" fill="${BLUE}" />
            <line x1="70" y1="70" x2="70" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="30" y1="110" x2="110" y2="110" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="145" cy="45" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<line x1="110" y1="70" x2="160" y2="120" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="160" y1="40" x2="110" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  {
    label: 'd',
    front: `<polygon points="110,70 30,150 110,150" fill="${BLUE}" /><line x1="110" y1="70" x2="30" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<circle cx="75" cy="47" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`,
    right: `<line x1="110" y1="70" x2="160" y2="120" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="160" y1="40" x2="110" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`
  },
  {
    label: 'e',
    front: `<polygon points="30,70 110,150 30,150" fill="${BLUE}" /><line x1="30" y1="70" x2="110" y2="150" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    top: `<line x1="30" y1="70" x2="160" y2="40" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" /><line x1="110" y1="70" x2="80" y2="40" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" />`,
    right: `<circle cx="150" cy="110" r="4" fill="${BLUE}" stroke="${STROKE}" stroke-width="1" />`
  }
];

let contents = '';
for (let i = 0; i < cubes.length; i++) {
  contents += getCubeContent(cubes[i], i * 200);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="200" viewBox="0 0 1000 200">
  ${contents}
</svg>`;

fs.writeFileSync('subtes8_reference_cubes.svg', svg);
