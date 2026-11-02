// Generates original, brand-styled placeholder artwork (SVG) for sample content.
// These are clearly labelled placeholders — replace them with real food photography
// via the admin dashboard. Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/images/placeholders";
mkdirSync(OUT, { recursive: true });

// Deterministic pseudo-random so output is stable between runs.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r = (a, b) => a + rnd() * (b - a);

const C = {
  ivory: "#FFFDF8",
  cream: "#F7F0E5",
  linen: "#EFE4D2",
  beige: "#E4D3BA",
  brown: "#39271E",
  cocoa: "#5A3D2E",
  gold: "#D6A04A",
  goldDeep: "#B9832F",
  orange: "#C76B35",
  saffron: "#E39B3B",
  green: "#6E7F45",
  leaf: "#7C8F4E",
  red: "#9E3B26",
};

const defs = `
<defs>
  <radialGradient id="puri" cx="40%" cy="35%" r="75%">
    <stop offset="0" stop-color="#F3C877"/><stop offset=".55" stop-color="#E0A24D"/><stop offset="1" stop-color="#B9772F"/>
  </radialGradient>
  <radialGradient id="kheer" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#FFF8EA"/><stop offset=".7" stop-color="#F6E6C8"/><stop offset="1" stop-color="#E9D1A6"/>
  </radialGradient>
  <radialGradient id="brass" cx="40%" cy="35%" r="80%">
    <stop offset="0" stop-color="#F1D08E"/><stop offset=".6" stop-color="#D6A04A"/><stop offset="1" stop-color="#9C6E28"/>
  </radialGradient>
  <radialGradient id="ceramic" cx="40%" cy="35%" r="80%">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EDE3D3"/>
  </radialGradient>
  <radialGradient id="curry" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#E58A45"/><stop offset=".7" stop-color="#C76B35"/><stop offset="1" stop-color="#9A4A22"/>
  </radialGradient>
  <radialGradient id="dal" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#F2C35A"/><stop offset="1" stop-color="#CF9532"/>
  </radialGradient>
  <radialGradient id="ladoo" cx="38%" cy="32%" r="75%">
    <stop offset="0" stop-color="#F7B65C"/><stop offset=".7" stop-color="#E08A2E"/><stop offset="1" stop-color="#B5641C"/>
  </radialGradient>
  <radialGradient id="chai" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#C99A6B"/><stop offset="1" stop-color="#9A6A40"/>
  </radialGradient>
  <radialGradient id="rice" cx="45%" cy="40%" r="70%">
    <stop offset="0" stop-color="#FFFBF1"/><stop offset="1" stop-color="#F0DDB4"/>
  </radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="softer" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
  <pattern id="jaali" width="64" height="64" patternUnits="userSpaceOnUse">
    <path d="M32 6 L58 32 L32 58 L6 32 Z" fill="none" stroke="${C.goldDeep}" stroke-opacity=".10" stroke-width="1.2"/>
    <circle cx="32" cy="32" r="3" fill="${C.goldDeep}" fill-opacity=".10"/>
  </pattern>
</defs>`;

const shadow = (cx, cy, rx, ry = rx) =>
  `<ellipse cx="${cx + rx * 0.06}" cy="${cy + ry * 0.1}" rx="${rx}" ry="${ry}" fill="${C.brown}" opacity=".22" filter="url(#soft)"/>`;

const background = (w, h, tone = C.cream) => `
  <rect width="${w}" height="${h}" fill="${tone}"/>
  <rect width="${w}" height="${h}" fill="url(#jaali)"/>
  ${Array.from({ length: 40 }, () => `<line x1="0" y1="${r(0, h)}" x2="${w}" y2="${r(0, h)}" stroke="${C.beige}" stroke-opacity=".25" stroke-width="${r(0.5, 1.5)}"/>`).join("")}`;

const cloth = (x, y, w, h, rot) => `
  <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.ivory}" opacity=".9"/>
    ${Array.from({ length: Math.floor(h / 22) }, (_, i) => `<line x1="${x}" y1="${y + 11 + i * 22}" x2="${x + w}" y2="${y + 11 + i * 22}" stroke="${C.orange}" stroke-opacity=".28" stroke-width="3"/>`).join("")}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="${C.gold}" stroke-opacity=".5" stroke-width="3"/>
  </g>`;

const plate = (cx, cy, rad, fill = "url(#brass)") => `
  ${shadow(cx, cy, rad)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"/>
  <circle cx="${cx}" cy="${cy}" r="${rad * 0.86}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="${rad * 0.8}" fill="${C.brown}" fill-opacity=".05"/>`;

const bowl = (cx, cy, rad, food, garnish = "") => `
  ${shadow(cx, cy, rad)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#brass)"/>
  <circle cx="${cx}" cy="${cy}" r="${rad * 0.84}" fill="${food}"/>
  <path d="M ${cx - rad * 0.6} ${cy - rad * 0.45} Q ${cx} ${cy - rad * 0.8} ${cx + rad * 0.55} ${cy - rad * 0.5}" stroke="#fff" stroke-opacity=".35" stroke-width="${rad * 0.05}" fill="none" stroke-linecap="round"/>
  ${garnish}`;

const nuts = (cx, cy, rad, n = 12) =>
  Array.from({ length: n }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.62);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const t = rnd();
    if (t < 0.4) return `<ellipse cx="${x}" cy="${y}" rx="${rad * 0.09}" ry="${rad * 0.04}" transform="rotate(${r(0, 180)} ${x} ${y})" fill="#E8D2A8" stroke="#C9A66B" stroke-width="1.5"/>`; // almond sliver
    if (t < 0.75) return `<ellipse cx="${x}" cy="${y}" rx="${rad * 0.06}" ry="${rad * 0.035}" transform="rotate(${r(0, 180)} ${x} ${y})" fill="#9DB06A"/>`; // pistachio
    return `<circle cx="${x}" cy="${y}" r="${rad * 0.025}" fill="${C.saffron}" opacity=".9"/>`; // saffron
  }).join("");

const puri = (cx, cy, rad) => `
  ${shadow(cx, cy, rad * 0.95)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#puri)"/>
  ${Array.from({ length: 6 }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.6);
    return `<ellipse cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" rx="${rad * r(0.08, 0.16)}" ry="${rad * r(0.05, 0.1)}" fill="#FBE2A8" opacity=".55"/>`;
  }).join("")}
  ${Array.from({ length: 10 }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.8);
    return `<circle cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="${r(1.5, 4)}" fill="#9A5F22" opacity=".45"/>`;
  }).join("")}`;

const ladoo = (cx, cy, rad) => `
  ${shadow(cx, cy, rad * 0.9)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#ladoo)"/>
  ${Array.from({ length: 22 }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.85);
    return `<circle cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="${r(1.5, 3.5)}" fill="#FFD48A" opacity=".55"/>`;
  }).join("")}
  <ellipse cx="${cx - rad * 0.1}" cy="${cy - rad * 0.95}" rx="${rad * 0.18}" ry="${rad * 0.07}" fill="#9DB06A"/>`;

const leaf = (x, y, s, rot, col = C.leaf) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0 C 20 -18, 50 -18, 70 0 C 50 18, 20 18, 0 0 Z" fill="${col}"/><path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M4 0 L 64 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`;

const cardamom = (x, y, rot) =>
  `<ellipse cx="${x}" cy="${y}" rx="14" ry="8" transform="rotate(${rot} ${x} ${y})" fill="#8FA35A" stroke="#6E7F45" stroke-width="1.5"/>`;

const star = (x, y, s) => {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const rad = i % 2 ? s * 0.38 : s;
    const a = (Math.PI / 8) * i;
    return `${x + Math.cos(a) * rad},${y + Math.sin(a) * rad}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${C.cocoa}"/><circle cx="${x}" cy="${y}" r="${s * 0.18}" fill="${C.goldDeep}"/>`;
};

const cinnamon = (x, y, rot) =>
  `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 60}" y="${y - 9}" width="120" height="18" rx="9" fill="#8A4F2A"/><rect x="${x - 60}" y="${y - 9}" width="120" height="6" rx="3" fill="#A86A3D"/></g>`;

const scatter = (w, h, n, avoid = []) =>
  Array.from({ length: n }, () => {
    let x, y, tries = 0;
    do {
      x = r(40, w - 40); y = r(40, h - 40); tries++;
    } while (tries < 30 && avoid.some(([ax, ay, ar]) => Math.hypot(x - ax, y - ay) < ar));
    const t = rnd();
    if (t < 0.35) return cardamom(x, y, r(0, 180));
    if (t < 0.55) return star(x, y, r(14, 20));
    if (t < 0.7) return cinnamon(x, y, r(0, 180));
    return `<circle cx="${x}" cy="${y}" r="${r(3, 6)}" fill="${C.cocoa}" opacity=".7"/>`;
  }).join("");

const label = (w, h) => `
  <g font-family="Georgia, serif" font-size="20" letter-spacing="2">
    <rect x="${w - 268}" y="${h - 58}" width="244" height="36" rx="18" fill="${C.ivory}" fill-opacity=".88"/>
    <text x="${w - 146}" y="${h - 34}" text-anchor="middle" fill="${C.cocoa}">PLACEHOLDER ART</text>
  </g>`;

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${defs}${body}${label(w, h)}</svg>`;

const W = 1200, H = 900;
const files = {};

// 1. Kheer Puri
seed = 11;
files["kheer-puri.svg"] = svg(W, H, `
  ${background(W, H)}
  ${cloth(60, 560, 420, 260, -8)}
  ${scatter(W, H, 14, [[700, 430, 360], [330, 600, 260]])}
  ${plate(430, 520, 250)}
  ${puri(360, 470, 120)}${puri(470, 560, 115)}${puri(350, 610, 105)}
  ${bowl(790, 380, 210, "url(#kheer)", nuts(790, 380, 210, 22))}
  ${leaf(960, 640, 1.1, -30)}${leaf(1000, 690, 0.9, 10, C.green)}`);

// 2. Thali
seed = 23;
files["thali.svg"] = svg(W, H, `
  ${background(W, H, C.linen)}
  ${scatter(W, H, 12, [[600, 450, 400]])}
  ${plate(600, 450, 370)}
  ${bowl(470, 300, 100, "url(#curry)")}
  ${bowl(720, 290, 95, "url(#dal)")}
  ${bowl(800, 500, 90, "url(#kheer)", nuts(800, 500, 90, 8))}
  <ellipse cx="560" cy="560" rx="150" ry="95" fill="url(#rice)"/>
  ${puri(380, 520, 85)}
  ${leaf(600, 560, 0.6, -20)}${leaf(520, 600, 0.5, 30, C.green)}`);

// 3. Sweets (ladoo)
seed = 37;
files["sweets.svg"] = svg(W, H, `
  ${background(W, H)}
  ${cloth(760, 80, 360, 240, 12)}
  ${scatter(W, H, 14, [[560, 470, 360]])}
  ${plate(560, 470, 320)}
  ${ladoo(460, 380, 90)}${ladoo(640, 370, 90)}${ladoo(560, 540, 92)}${ladoo(400, 560, 80)}${ladoo(720, 560, 82)}
  ${leaf(900, 720, 1, -20)}`);

// 4. Chai & snacks
seed = 53;
const glass = (cx, cy, rad) => `
  ${shadow(cx, cy, rad)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" fill-opacity=".55" stroke="#E8DCC8" stroke-width="6"/>
  <circle cx="${cx}" cy="${cy}" r="${rad * 0.85}" fill="url(#chai)"/>
  <ellipse cx="${cx - rad * 0.2}" cy="${cy - rad * 0.25}" rx="${rad * 0.35}" ry="${rad * 0.15}" fill="#E8C9A3" opacity=".5"/>`;
const samosa = (cx, cy, s, rot) => `
  <g transform="rotate(${rot} ${cx} ${cy})">
  ${shadow(cx, cy, s * 0.8)}
  <path d="M ${cx} ${cy - s} L ${cx + s * 0.95} ${cy + s * 0.6} L ${cx - s * 0.95} ${cy + s * 0.6} Z" fill="url(#puri)" stroke="#B9772F" stroke-width="5" stroke-linejoin="round"/>
  <path d="M ${cx - s * 0.6} ${cy + s * 0.45} Q ${cx} ${cy + s * 0.25} ${cx + s * 0.6} ${cy + s * 0.45}" stroke="#B9772F" stroke-width="4" fill="none"/>
  </g>`;
files["chai-snacks.svg"] = svg(W, H, `
  ${background(W, H, C.linen)}
  ${cloth(100, 120, 380, 300, -10)}
  ${scatter(W, H, 10, [[420, 420, 260], [840, 470, 300]])}
  ${glass(330, 320, 120)}${glass(470, 560, 110)}
  ${plate(830, 470, 260, "url(#ceramic)")}
  ${samosa(760, 420, 110, -15)}${samosa(900, 520, 105, 25)}
  <circle cx="900" cy="330" r="55" fill="${C.green}" opacity=".85"/><circle cx="900" cy="330" r="42" fill="#8EA25A"/>`);

// 5. Pickle / masala jars
seed = 71;
const jar = (cx, cy, rad, food) => `
  ${shadow(cx, cy, rad)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" fill-opacity=".6" stroke="#E2D4BD" stroke-width="8"/>
  <circle cx="${cx}" cy="${cy}" r="${rad * 0.82}" fill="${food}"/>
  ${Array.from({ length: 12 }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.65);
    return `<rect x="${cx + Math.cos(a) * d - 12}" y="${cy + Math.sin(a) * d - 8}" width="${r(16, 30)}" height="${r(10, 18)}" rx="5" fill="#F0C060" opacity=".75" transform="rotate(${r(0, 180)} ${cx + Math.cos(a) * d} ${cy + Math.sin(a) * d})"/>`;
  }).join("")}`;
files["pickles-masalas.svg"] = svg(W, H, `
  ${background(W, H)}
  ${scatter(W, H, 18, [[420, 430, 250], [790, 400, 220], [620, 680, 160]])}
  ${jar(420, 430, 200, "url(#curry)")}
  ${bowl(800, 380, 150, "#B5541F", Array.from({ length: 40 }, () => `<circle cx="${800 + r(-90, 90)}" cy="${380 + r(-90, 90)}" r="${r(2, 4)}" fill="#7A2E12" opacity=".6"/>`).join(""))}
  ${bowl(640, 690, 110, "url(#dal)")}`);

// 6. Curry / dinner
seed = 89;
files["curry.svg"] = svg(W, H, `
  ${background(W, H, C.linen)}
  ${cloth(760, 560, 380, 260, 8)}
  ${scatter(W, H, 14, [[560, 430, 340]])}
  ${bowl(560, 430, 290, "url(#curry)", `
    ${Array.from({ length: 9 }, () => `<rect x="${560 + r(-150, 130)}" y="${430 + r(-150, 130)}" width="44" height="44" rx="8" fill="#FFF3DC" opacity=".9" transform="rotate(${r(0, 90)} 560 430)"/>`).join("")}
    <path d="M 430 420 Q 520 380 640 430 T 720 470" stroke="#FFF8EA" stroke-width="10" fill="none" opacity=".8" stroke-linecap="round"/>
    ${leaf(520, 330, 0.7, 20, "#5E7A3A")}${leaf(620, 500, 0.6, -40, "#5E7A3A")}`)}`);

// 7. Breakfast (paratha)
seed = 101;
const paratha = (cx, cy, rad) => `
  ${shadow(cx, cy, rad)}
  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#puri)"/>
  ${Array.from({ length: 4 }, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${rad * (0.25 + i * 0.18)}" fill="none" stroke="#B9772F" stroke-opacity=".35" stroke-width="3"/>`).join("")}
  ${Array.from({ length: 30 }, () => {
    const a = r(0, Math.PI * 2), d = r(0, rad * 0.9);
    return `<circle cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="${r(2, 5)}" fill="#8A4F1A" opacity=".45"/>`;
  }).join("")}`;
files["breakfast.svg"] = svg(W, H, `
  ${background(W, H)}
  ${scatter(W, H, 12, [[520, 470, 360], [920, 300, 160]])}
  ${plate(520, 470, 320, "url(#ceramic)")}
  ${paratha(480, 450, 220)}
  ${bowl(920, 300, 120, "#FFFFFF", `<circle cx="920" cy="300" r="60" fill="#F7F2EA"/>`)}
  ${bowl(930, 610, 100, "url(#curry)")}`);

// 8. Hero (portrait, top-down feast)
seed = 131;
const HW = 1200, HH = 1400;
files["hero.svg"] = svg(HW, HH, `
  ${background(HW, HH, C.cream)}
  ${cloth(40, 980, 520, 340, -6)}
  ${scatter(HW, HH, 26, [[640, 640, 470], [300, 1120, 200], [930, 1150, 180]])}
  ${plate(640, 640, 440)}
  ${bowl(500, 470, 150, "url(#kheer)", nuts(500, 470, 150, 16))}
  ${bowl(800, 460, 140, "url(#curry)")}
  ${bowl(850, 760, 125, "url(#dal)")}
  <ellipse cx="560" cy="790" rx="170" ry="110" fill="url(#rice)"/>
  ${puri(380, 700, 95)}${puri(420, 830, 85)}
  ${leaf(560, 780, 0.7, -25)}${leaf(500, 820, 0.55, 30, C.green)}
  ${ladoo(300, 1120, 80)}${ladoo(400, 1180, 70)}
  ${glass(930, 1150, 110)}`);

for (const [name, content] of Object.entries(files)) writeFileSync(`${OUT}/${name}`, content);
console.log(`Generated ${Object.keys(files).length} placeholder images in ${OUT}`);
