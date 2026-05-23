const SIZE = 256;
const SCALE = 4;
const CONNECT_DISTANCE = 60;
const TRANSFER_INTERVAL_MS = 500;
const STAR_COLOR = [236, 223, 172, 255];

let modelCanvas;
let mainCanvas;
let statusMsg;
let clearBtn;

let ditheredResult = null;
let stars = [];
let isModelLoaded = false;
let isTransferring = false;
let pix2pix;

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



  pix2pix = ml5.pix2pix('./model/flies.pict', modelLoaded);
}

function draw() {
  clear();
  updateStars();
  drawResult();
  drawConnections();
  drawStars();
  updateModelCanvas();
}

function clearCanvas() {
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
  textSize(20);
  textAlign(CENTER, CENTER);

  stars.forEach(star => {
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
  handlePointer(mouseX, mouseY);
}

function mouseDragged() {
  if (!inCanvasBounds(mouseX, mouseY)) return;

  const lastStar = stars[stars.length - 1];
  if (!lastStar || dist(mouseX, mouseY, lastStar.originX, lastStar.originY) > 25) {
    handlePointer(mouseX, mouseY);
  }
}

function touchStarted() {
  if (touches.length > 0) {
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

  const star = new Star(x, y);

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
    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(1000, 2000);
    this.radius = 5;
    this.driftRange = 10;
    this.connections = [];
    this.x = x;
    this.y = y;
  }

  update() {
    this.x = this.originX + map(noise(this.noiseOffsetX), 0, 1, -this.driftRange, this.driftRange);
    this.y = this.originY + map(noise(this.noiseOffsetY), 0, 1, -this.driftRange, this.driftRange);
    this.noiseOffsetX += 0.05;
    this.noiseOffsetY += 0.05;
  }
}

function modelLoaded() {
  statusMsg.html('Model Loaded!');
  isModelLoaded = true;

  setInterval(() => {
    if (isModelLoaded && !isTransferring && stars.length > 0) {
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