const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const out = process.argv[2];
// [outline path, midrib path, light, dark, seed]
const leaves = [
  ['M24 120 C70 52 160 44 220 116 C160 186 72 182 24 120 Z', 'M24 120 C90 112 160 110 220 116', '#b5c2a0', '#7d906c', 3],
  ['M20 128 C80 80 170 70 226 98 C178 150 90 170 20 128 Z', 'M20 128 C96 116 170 102 226 98', '#a7b893', '#71855f', 8],
  ['M28 120 C60 30 190 40 214 120 C190 200 60 210 28 120 Z', 'M28 120 C100 118 160 118 214 120', '#bfc9a6', '#879a73', 13],
  ['M22 132 C64 92 150 60 224 84 C190 138 120 176 22 132 Z', 'M22 132 C90 118 160 96 224 84', '#aebd98', '#768a65', 21]
];
(async () => {
  for (const [i, [outline, rib, light, dark, seed]] of leaves.entries()) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
<defs>
<radialGradient id="g" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
<filter id="w" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="${seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="${seed + 1}" result="m"/>
<feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25" result="ma"/>
<feComposite in="d" in2="ma" operator="in" result="tex"/>
<feComposite in="tex" in2="d" operator="arithmetic" k1="0" k2="0.55" k3="0.45" k4="0"/>
</filter>
</defs>
<path d="${outline}" fill="url(#g)" fill-opacity="0.85" filter="url(#w)"/>
<path d="${rib}" fill="none" stroke="#c9a35a" stroke-width="2.2" stroke-linecap="round"/>
<path d="${outline}" fill="none" stroke="#c9a35a" stroke-width="1.3" stroke-opacity="0.75" stroke-dasharray="150 60"/>
<path d="M24 120 C14 122 8 128 4 136" transform="translate(${outline.match(/M(\d+) (\d+)/)[1] - 24} ${outline.match(/M(\d+) (\d+)/)[2] - 120})" fill="none" stroke="#c9a35a" stroke-width="2" stroke-linecap="round"/>
</svg>`;
    await sharp(Buffer.from(svg)).resize(160).webp({ quality: 85, alphaQuality: 85 }).toFile(`${out}/leaf-${i + 1}.webp`);
  }
  const files = [1,2,3,4].map(n => ({ input: `${out}/leaf-${n}.webp`, left: (n-1)*170, top: 10 }));
  await sharp({ create: { width: 690, height: 180, channels: 3, background: '#faf0e6' } }).composite(files).png().toFile(process.argv[3]);
})();
