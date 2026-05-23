const SIZE = 256;
const SCALE = 4;
const CONNECT_DISTANCE = 60;
const TRANSFER_INTERVAL_MS = 200;
const STAR_COLOR = [236, 223, 172, 255];

const STAR_TEXTS = [
  "<img id='light-box-image' src='./images/test.png'><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>",
  "The sections of De finibus bonorum et malorum from which Lorem ipsum ultimately derives is one in which Cicero promotes obtaining pleasure rationally instead of impulsively, in his home city of Cumae between himself and Lucius Manlius Torquatus, a young Epicurean, while another young Roman, Gaius Valerius Triarius, listens on. The relevant sections as printed in the source is reproduced below with fragments used in Lorem ipsum underlined. Letters in brackets were added to Lorem ipsum and were not present in the source text: ",
  "Text for star 2",
  "Text for star 3",
  "Text for star 4",
    "Text for star 0",
  "Text for star 1",
  "Text for star 2",
  "Text for star 3",
  "Text for star 4",
    "Text for star 0",
  "Text for star 1",
  "Text for star 2",
  "Text for star 3",
  "Text for star 4",
    "Text for star 0",
  "Text for star 1",
  "Text for star 2",
  "Text for star 3",
  "Text for star 4",
  // ...add more as needed
];

let modelCanvas;
let mainCanvas;
let statusMsg;
let clearBtn;
let clickCounter = 0;

let ditheredResult = null;
let stars = [];
let isModelLoaded = false;
let isTransferring = false;
let pix2pix;

function getRandomIntInclusive(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

let instructionNumber = getRandomIntInclusive(15, 20);
let templateWings = document.querySelector("#template-wings");
let instructions = document.querySelector("#instructions");
if (instructions) instructions.innerHTML = "Click <b>" + instructionNumber + "</b> spots to continue.";
if (templateWings) templateWings.src = "./images/flies/fly" + getRandomIntInclusive(0, 299) + ".png";

function ditherFloydSteinberg(pg) {
  pg.loadPixels();
  let w = pg.width, h = pg.height;

  let r = new Float32Array(w * h);
  let g = new Float32Array(w * h);
  let b = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    r[i] = pg.pixels[i * 4];
    g[i] = pg.pixels[i * 4 + 1];
    b[i] = pg.pixels[i * 4 + 2];
  }

  const levels = 4;
  const step = 255 / (levels - 1);

  function quantize(val) {
    return Math.round(Math.round(val / step) * step);
  }

  function clamp(val) {
    return Math.min(255, Math.max(0, val));
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = y * w + x;

      let oldR = r[i], oldG = g[i], oldB = b[i];
      let newR = quantize(oldR), newG = quantize(oldG), newB = quantize(oldB);

      r[i] = newR; g[i] = newG; b[i] = newB;

      let errR = oldR - newR;
      let errG = oldG - newG;
      let errB = oldB - newB;

      if (x + 1 < w) {
        r[i + 1] = clamp(r[i + 1] + errR * 7 / 16);
        g[i + 1] = clamp(g[i + 1] + errG * 7 / 16);
        b[i + 1] = clamp(b[i + 1] + errB * 7 / 16);
      }
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          r[i + w - 1] = clamp(r[i + w - 1] + errR * 3 / 16);
          g[i + w - 1] = clamp(g[i + w - 1] + errG * 3 / 16);
          b[i + w - 1] = clamp(b[i + w - 1] + errB * 3 / 16);
        }
        r[i + w] = clamp(r[i + w] + errR * 5 / 16);
        g[i + w] = clamp(g[i + w] + errG * 5 / 16);
        b[i + w] = clamp(b[i + w] + errB * 5 / 16);
        if (x + 1 < w) {
          r[i + w + 1] = clamp(r[i + w + 1] + errR * 1 / 16);
          g[i + w + 1] = clamp(g[i + w + 1] + errG * 1 / 16);
          b[i + w + 1] = clamp(b[i + w + 1] + errB * 1 / 16);
        }
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    pg.pixels[i * 4] = r[i];
    pg.pixels[i * 4 + 1] = g[i];
    pg.pixels[i * 4 + 2] = b[i];
    pg.pixels[i * 4 + 3] = 255;
  }

  pg.updatePixels();
}

const BAYER_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map(row => row.map(v => (v / 16) * 255));

function ditherFloydSteinbergBW(pg) {
  pg.loadPixels();
  const w = pg.width;
  const h = pg.height;

  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const offset = i * 4;
    const r = pg.pixels[offset];
    const g = pg.pixels[offset + 1];
    const b = pg.pixels[offset + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  for (let i = 0; i < gray.length; i += 1) {
    const v = gray[i] / 255;
    gray[i] = Math.pow(v, 2.8) * 200;
  }

  const clamp = value => Math.min(255, Math.max(0, value));

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const oldVal = gray[idx];
      const newVal = oldVal < 100 ? 0 : 150;
      gray[idx] = newVal;
      const err = oldVal - newVal;

      if (x + 1 < w) {
        gray[idx + 1] = clamp(gray[idx + 1] + err * 7 / 16);
      }
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          gray[idx + w - 1] = clamp(gray[idx + w - 1] + err * 3 / 16);
        }
        gray[idx + w] = clamp(gray[idx + w] + err * 5 / 16);
        if (x + 1 < w) {
          gray[idx + w + 1] = clamp(gray[idx + w + 1] + err * 1 / 16);
        }
      }
    }
  }

  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    pg.pixels[offset] = gray[i];
    pg.pixels[offset + 1] = gray[i];
    pg.pixels[offset + 2] = gray[i];
    pg.pixels[offset + 3] = 255;
  }

  pg.updatePixels();
}

function setup() {
  pixelDensity(1);
  mainCanvas = createCanvas(SIZE * SCALE, SIZE * SCALE);
  mainCanvas.parent('output');

  modelCanvas = createGraphics(SIZE, SIZE);
  modelCanvas.pixelDensity(1);

  background(0);

  statusMsg = select('#status');
  clearBtn = select('#clearBtn');
  clearBtn.mousePressed(clearCanvas);

  const closeBtn = document.querySelector('#close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const lightbox = document.querySelector('#light-box');
      if (lightbox) {
        lightbox.style.display = 'none';
        const contentDiv = lightbox.querySelector('#light-box-content-text');
        if (contentDiv) contentDiv.innerHTML = '';
      }
      // deselect any selected star when the lightbox is closed
      stars.forEach(star => star.selected = false);
    });
  }

  pix2pix = ml5.pix2pix('./model/flies.pict', modelLoaded);
}

function draw() {
  clear();
  updateStars();
  drawResult();
  drawConnections();
  drawStars();
  updateModelCanvas();
  if(clickCounter == 0){
    ditheredResult = null;
    background(0);
  }
}

function clearCanvas() {
  instructionNumber = getRandomIntInclusive(15, 20);
  if (instructions) instructions.innerHTML = "Click <b>" + instructionNumber + "</b> spots to continue.";
  if (templateWings) templateWings.src = "./images/flies/fly" + getRandomIntInclusive(0, 299) + ".png";
  if (templateWings) templateWings.classList.remove("fadeOut");

  // close lightbox if open and clear its content
  const lightbox = document.querySelector('#light-box');
  if (lightbox) {
    lightbox.style.display = 'none';
    const contentDiv = lightbox.querySelector('#light-box-content-text');
    if (contentDiv) contentDiv.innerHTML = '';
  }

  // reset canvas/state
  background(0);
  clickCounter = 0;
  stars.forEach(s => s.selected = false);
  stars = [];
  ditheredResult = null;
  background(0);

}

function drawResult() {
  if (ditheredResult) {
    image(ditheredResult, 0, 0, SIZE * SCALE, SIZE * SCALE);
  }
}

function drawConnections() {
  stroke(...STAR_COLOR);
  strokeWeight(1);

  stars.forEach(star => {
    star.connections.forEach(neighbor => {
      line(star.x, star.y, neighbor.x, neighbor.y);
    });
  });
}

function drawStars() {
  noStroke();
  fill(...STAR_COLOR);
  textAlign(CENTER, CENTER);

  stars.forEach(star => {
    if (clickCounter >= instructionNumber && star.selected) {
      textSize(50);
    } else {
      textSize(20);
    }
    text('✷', star.x, star.y);
  });
}

function updateModelCanvas() {
  modelCanvas.background(0);
  modelCanvas.noStroke();
  modelCanvas.fill(255);

  stars.forEach(star => {
    modelCanvas.ellipse(
      star.x / SCALE,
      star.y / SCALE,
      star.radius,
      star.radius
    );
  });
}

function mousePressed() {
  if (clickCounter >= instructionNumber) {
    let clickedStar = null;
    let clickedIndex = null;

    stars.forEach((star, index) => {
      if (!clickedStar && dist(mouseX, mouseY, star.x, star.y) < 20) {
        clickedStar = star;
        clickedIndex = index;
      }
    });

    if (clickedStar) {
      const willSelect = !clickedStar.selected;
      stars.forEach(star => star.selected = false);
      clickedStar.selected = willSelect;

      const lightbox = document.querySelector("#light-box");
      if (willSelect && lightbox && clickedIndex !== null && STAR_TEXTS[clickedIndex]) {
        const contentDiv = lightbox.querySelector("#light-box-content-text");
        if (contentDiv) {
          contentDiv.innerHTML = STAR_TEXTS[clickedIndex];
        }
        lightbox.style.display = "block";
      } else if (lightbox) {
        lightbox.style.display = "none";
      }
    }

    return;
  }

  handlePointer(mouseX, mouseY);
}

function mouseDragged() {
  if (!inCanvasBounds(mouseX, mouseY)) return;
  if (clickCounter >= instructionNumber) return;

  const lastStar = stars[stars.length - 1];
  if (!lastStar || dist(mouseX, mouseY, lastStar.originX, lastStar.originY) > 25) {
    handlePointer(mouseX, mouseY);
  }
}

function touchStarted() {
  if (touches.length > 0) {
    // After all stars are placed, taps toggle selection
    if (clickCounter >= instructionNumber) {
      stars.forEach(star => {
        if (dist(touches[0].x, touches[0].y, star.x, star.y) < 20) {
          star.selected = !star.selected;
        }
      });
      return false;
    }

    handlePointer(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    handlePointer(touches[0].x, touches[0].y, true);
  }
  return false;
}

function handlePointer(x, y, isDrag = false) {
  if (!inCanvasBounds(x, y)) return;
  if (clickCounter >= instructionNumber) return;

  const star = new Star(x, y);
  clickCounter += 1;

  if (instructions) instructions.innerHTML = "Click <b>" + Math.max(0, instructionNumber - clickCounter) + "</b> spots to continue.";

  const closest = getClosestStar(x, y);
  if (closest && closest.distance < CONNECT_DISTANCE * (isDrag ? 1 : SCALE)) {
    star.connections.push(closest.star);
  }

  if (isDrag && stars.length > 0) {
    const prevStar = stars[stars.length - 1];
    if (dist(star.originX, star.originY, prevStar.originX, prevStar.originY) < CONNECT_DISTANCE) {
      star.connections.push(prevStar);
    }
  }

  stars.push(star);

  if (clickCounter === instructionNumber) {

    if (templateWings) templateWings.classList.add("fadeOut");
    if (instructions) instructions.innerHTML = "Click the stars to learn about the network";

    
  }
}

function inCanvasBounds(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function getClosestStar(x, y) {
  let closestStar = null;
  let recordDist = Infinity;

  stars.forEach(star => {
    const d = dist(x, y, star.originX, star.originY);
    if (d < recordDist) {
      recordDist = d;
      closestStar = star;
    }
  });

  return closestStar ? { star: closestStar, distance: recordDist } : null;
}

class Star {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;
    this.selected = false;
    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(1000, 2000);
    this.radius = 5;
    this.driftRange = 0;
    this.connections = [];
    this.x = x;
    this.y = y;
  }

  update() {
    this.x = this.originX + map(noise(this.noiseOffsetX), 0, 1, -this.driftRange, this.driftRange);
    this.y = this.originY + map(noise(this.noiseOffsetY), 0, 1, -this.driftRange, this.driftRange);
    this.noiseOffsetX += 0.03;
    this.noiseOffsetY += 0.03;
    if(clickCounter >= instructionNumber){
      this.driftRange = 15;
    }
  }
}

function modelLoaded() {
  statusMsg.html('Model Loaded!');
  isModelLoaded = true;

  setInterval(() => {
    if (isModelLoaded && !isTransferring && stars.length > 0 && clickCounter >= instructionNumber) {
      transfer();
    }
  }, TRANSFER_INTERVAL_MS);
}

function transfer() {
  isTransferring = true;
  statusMsg.html('Transferring...');

  pix2pix.transfer(modelCanvas.elt, (err, result) => {
    isTransferring = false;

    if (err) {
      console.error(err);
      statusMsg.html('Error: Check Developer Console.');
      return;
    }

    if (result?.src) {
      statusMsg.html('Done!');
      loadImage(result.src, p5img => {
        const tmp = createGraphics(SIZE * SCALE, SIZE * SCALE);
        tmp.pixelDensity(1);
        tmp.image(p5img, 0, 0, SIZE * SCALE, SIZE * SCALE);
        ditherFloydSteinbergBW(tmp);
        ditheredResult = tmp;
      });
    }
  });
}

function updateStars() {
  stars.forEach(star => star.update());
}

function downloadCanvasAsImage() {
  if (!ditheredResult) {
    statusMsg.html('No image available to download.');
    return;
  }
  saveCanvas(ditheredResult, 'microcosmos', 'png');
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    downloadCanvasAsImage();
  }
}