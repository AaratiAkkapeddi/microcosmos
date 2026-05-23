// ─────────────────────────────────────────────
//  ZODIAC CONSTELLATION DATA
//  Reworked to better resemble the traditional
//  constellation stick-figure layouts.
//  Coordinates normalized 0–1.
// ─────────────────────────────────────────────
const ZODIAC = {

  Aries: {
    stars: [
      [0.28,0.70],
      [0.42,0.52],
      [0.58,0.38],
      [0.74,0.28],
    ],
    edges: [[0,1],[1,2],[2,3]],
  },

  Taurus: {
    stars: [
      [0.50,0.46], // Aldebaran
      [0.38,0.34],
      [0.50,0.22],
      [0.64,0.34],
      [0.28,0.16],
      [0.74,0.16],
      [0.36,0.62],
      [0.64,0.62],
    ],
    edges: [
      [1,2],[2,3],[3,0],[0,1],
      [1,4],[3,5],
      [0,6],[0,7]
    ],
  },

  Gemini: {
    stars: [
      [0.34,0.18],
      [0.50,0.20],
      [0.32,0.38],
      [0.48,0.40],
      [0.30,0.58],
      [0.46,0.60],
      [0.28,0.78],
      [0.44,0.80],
    ],
    edges: [
      [0,2],[2,4],[4,6],
      [1,3],[3,5],[5,7],
      [2,3],[4,5]
    ],
  },

  Cancer: {
    stars: [
      [0.34,0.46],
      [0.46,0.34],
      [0.58,0.44],
      [0.52,0.58],
      [0.38,0.62],
    ],
    edges: [[0,1],[1,2],[2,3],[3,4]],
  },

  Leo: {
    stars: [
      [0.24,0.42],
      [0.34,0.28],
      [0.50,0.26],
      [0.62,0.36],
      [0.66,0.52],
      [0.56,0.66],
      [0.40,0.72],
      [0.28,0.64],
    ],
    edges: [
      [0,1],[1,2],[2,3],
      [3,4],[4,5],[5,6],[6,7]
    ],
  },

  Virgo: {
    stars: [
      [0.26,0.26],
      [0.40,0.22],
      [0.54,0.30],
      [0.64,0.42],
      [0.68,0.56],
      [0.58,0.70],
      [0.42,0.76],
      [0.30,0.66],
      [0.24,0.50],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,4],
      [4,5],[5,6],[6,7],[7,8]
    ],
  },

  Libra: {
    stars: [
      [0.30,0.48],
      [0.48,0.34],
      [0.66,0.46],
      [0.42,0.62],
      [0.58,0.62],
    ],
    edges: [
      [0,1],[1,2],
      [1,3],[1,4]
    ],
  },

  Scorpius: {
    stars: [
      [0.26,0.24],
      [0.34,0.34],
      [0.40,0.46],
      [0.42,0.58],
      [0.46,0.70],
      [0.56,0.80],
      [0.68,0.74],
      [0.74,0.60],
      [0.66,0.48],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,4],
      [4,5],[5,6],[6,7],[7,8]
    ],
  },

  Sagittarius: {
    stars: [
      [0.26,0.58],
      [0.38,0.46],
      [0.52,0.34],
      [0.68,0.22],
      [0.56,0.52],
      [0.70,0.64],
      [0.42,0.68],
      [0.30,0.78],
      [0.48,0.46],
    ],
    edges: [
      [0,1],[1,2],[2,3],
      [2,4],[4,5],
      [4,6],[6,7],
      [1,8],[8,4]
    ],
  },

  // FIXED: no longer circular
  Capricornus: {
    stars: [
      [0.22,0.42],
      [0.38,0.30],
      [0.56,0.28],
      [0.72,0.40],
      [0.62,0.56],
      [0.44,0.62],
      [0.30,0.54],
    ],
    edges: [
      [0,1],
      [1,2],
      [2,3],
      [3,4],
      [4,5],
      [5,6],
      [6,1]
    ],
  },

  Aquarius: {
    stars: [
      [0.24,0.34],
      [0.36,0.28],
      [0.50,0.36],
      [0.62,0.30],
      [0.76,0.40],
      [0.62,0.54],
      [0.46,0.60],
      [0.30,0.56],
      [0.20,0.68],
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,4],
      [2,5],[5,6],[6,7],[7,8]
    ],
  },

  Pisces: {
    stars: [
      [0.20,0.50],
      [0.34,0.38],
      [0.48,0.30],
      [0.62,0.38],
      [0.76,0.50],
      [0.62,0.64],
      [0.48,0.72],
      [0.34,0.64],
      [0.48,0.50],
    ],
    edges: [
      [0,1],[1,2],
      [2,3],[3,4],
      [4,5],[5,6],
      [6,7],[7,0],
      [2,8],[8,6]
    ],
  },

};

// ─────────────────────────────────────────────
//  SEASONS  –  4 signs each, one per quadrant
//  Quadrant order: top-left, top-right, bottom-left, bottom-right
// ─────────────────────────────────────────────
const SEASONS = {
  Spring: {
    emoji: '🌸',
    signs: ['Aries', 'Taurus', 'Gemini', 'Cancer'],
  },
  Summer: {
    emoji: '☀️',
    signs: ['Leo', 'Virgo', 'Libra', 'Scorpius'],
  },
  Autumn: {
    emoji: '🍂',
    signs: ['Sagittarius', 'Capricornus', 'Aquarius', 'Pisces'],
  },
};

// Quadrant [xMin, xMax, yMin, yMax] in 0–1 canvas-normalized space.
// Small padding keeps stars off the very edge of each quadrant.
const QUADRANTS = [
  [0.12, 0.45, 0.26, 0.54], // top-left wing
  [0.55, 0.90, 0.26, 0.54], // top-right wing
  [0.20, 0.45, 0.46, 0.72], // bottom-left wing
  [0.54, 0.84, 0.46, 0.72], // bottom-right wing
];

// ─────────────────────────────────────────────
//  LOAD A SEASON  →  4 constellations in quadrants
// ─────────────────────────────────────────────
function loadSeason(seasonName) {
  const season = SEASONS[seasonName];
  if (!season) return;

  clearCanvas();

  season.signs.forEach((signName, qi) => {
    const data = ZODIAC[signName];
    const [qx0, qx1, qy0, qy1] = QUADRANTS[qi];

    // Build stars remapped from 0–1 into this quadrant's pixel space
    const built = data.stars.map(([nx, ny]) => {
      const px = (qx0 + nx * (qx1 - qx0)) * width;
      const py = (qy0 + ny * (qy1 - qy0)) * height;
      return new Star(px, py);
    });

    // Wire edges bidirectionally so the draw loop picks them up
    data.edges.forEach(([a, b]) => {
      if (!built[a].connections.includes(built[b])) built[a].connections.push(built[b]);
      if (!built[b].connections.includes(built[a])) built[b].connections.push(built[a]);
    });

    built.forEach(s => stars.push(s));
  });
}

// ─────────────────────────────────────────────
//  BUILD UI  –  3 season buttons with sign glyphs
// ─────────────────────────────────────────────
function buildZodiacUI() {
  if (!document.getElementById('zodiac-style')) {
    const style = document.createElement('style');
    style.id = 'zodiac-style';
    style.textContent = `
      #zodiac-bar {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        align-items: center;
        flex-wrap: wrap;
      }
      .season-btn {
        background: transparent;
        border: 1px solid #ecdfac;
        color: #ecdfac;
        font-family: serif;
        font-size: 13px;
        padding: 5px 14px;
        cursor: pointer;
        letter-spacing: 0.08em;
        transition: background 0.15s, color 0.15s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .season-btn:hover,
      .season-btn.active {
        background: #ecdfac;
        color: #000;
      }
      .season-signs {
        font-family: serif;
        font-size: 12px;
        color: #ecdfac66;
        letter-spacing: 0.1em;
      }
    `;
    document.head.appendChild(style);
  }

  const bar = document.getElementById('zodiac-bar');
  if (!bar) {
    console.warn('Add <div id="zodiac-bar"></div> to your HTML.');
    return;
  }
  bar.innerHTML = '';

  const signSymbols = {
    Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋',
    Leo:'♌', Virgo:'♍', Libra:'♎', Scorpius:'♏',
    Sagittarius:'♐', Capricornus:'♑', Aquarius:'♒', Pisces:'♓',
  };

  Object.entries(SEASONS).forEach(([name, data]) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; align-items:center; gap:8px;';

    const btn = document.createElement('button');
    btn.className = 'season-btn';
    btn.innerHTML = `${data.emoji} ${name}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSeason(name);
    });

    // Show the 4 sign glyphs laid out as a 2×2 grid hint
    const signsLabel = document.createElement('span');
    signsLabel.className = 'season-signs';
    const [a, b, c, d] = data.signs.map(s => signSymbols[s]);
    signsLabel.innerHTML = `${a}&thinsp;${b}<br>${c}&thinsp;${d}`;
    signsLabel.style.lineHeight = '1.3';
    signsLabel.style.fontSize = '11px';

    wrap.appendChild(btn);
    wrap.appendChild(signsLabel);
    bar.appendChild(wrap);
  });
}

// Call buildZodiacUI() at the end of your setup() function.