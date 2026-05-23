const SIZE = 256;
const DISPLAY_SIZE = 1024;
const SCALE = 4;
let modelCanvas;
let mainCanvas;
let statusMsg, clearBtn;
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
  let w = pg.width, h = pg.height;

  let gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    let r = pg.pixels[i * 4];
    let g = pg.pixels[i * 4 + 1];
    let b = pg.pixels[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  for (let i = 0; i < w * h; i++) {
    let v = gray[i] / 255;
    gray[i] = Math.pow(v, 2.8) * 200;
  }

  function clamp(val) { return Math.min(255, Math.max(0, val)); }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = y * w + x;
      let oldVal = gray[i];
      let newVal = oldVal < 100 ? 0 : 150;
      gray[i] = newVal;
      let err = oldVal - newVal;

      if (x + 1 < w)        gray[i + 1]     = clamp(gray[i + 1]     + err * 7 / 16);
      if (y + 1 < h) {
        if (x - 1 >= 0)      gray[i + w - 1] = clamp(gray[i + w - 1] + err * 3 / 16);
                              gray[i + w]     = clamp(gray[i + w]     + err * 5 / 16);
        if (x + 1 < w)       gray[i + w + 1] = clamp(gray[i + w + 1] + err * 1 / 16);
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    pg.pixels[i * 4]     = gray[i];
    pg.pixels[i * 4 + 1] = gray[i];
    pg.pixels[i * 4 + 2] = gray[i];
    pg.pixels[i * 4 + 3] = 255;
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
  clearBtn.mousePressed(function () {
    stars = [];
    ditheredResult = null;
    background(0);
  });

  pix2pix = ml5.pix2pix('./model/flies.pict', modelLoaded);
}

function draw() {
  // background(0);
  clear();

  // Draw dithered pix2pix result if available
  if (ditheredResult) {
    image(ditheredResult, 0, 0, SIZE * SCALE, SIZE * SCALE);
  }

  // Update stars and draw connection lines
  for (let i = 0; i < stars.length; i++) {
    stars[i].update();
    for (let j = 0; j < stars[i].connections.length; j++) {
      let neighbor = stars[i].connections[j];
      stroke(236, 223, 172, 255);
      strokeWeight(1);
      line(stars[i].x, stars[i].y, neighbor.x, neighbor.y);
    }
  }

  // Draw star glyphs
  for (let i = 0; i < stars.length; i++) {
    noStroke();
    fill(236, 223, 172, 255);
    textSize(20);
    textAlign(CENTER);
    text("✷", stars[i].x, stars[i].y + 10);
  }

  // Update modelCanvas (clean input for pix2pix)
  modelCanvas.background(0);
  for (let i = 0; i < stars.length; i++) {
    modelCanvas.noStroke();
    modelCanvas.fill(255);
    modelCanvas.ellipse(stars[i].x / SCALE, stars[i].y / SCALE, stars[i].radius, stars[i].radius);
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let newStar = new Star(mouseX, mouseY);

    let closestStar = null;
    let recordDist = Infinity;
    for (let i = 0; i < stars.length; i++) {
      let d = dist(mouseX, mouseY, stars[i].originX, stars[i].originY);
      if (d < recordDist) {
        recordDist = d;
        closestStar = stars[i];
      }
    }

    if (closestStar && recordDist < 60 * SCALE) {
      newStar.connections.push(closestStar);
    }

    stars.push(newStar);
  }
}

function mouseDragged() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    if (stars.length === 0 || dist(mouseX, mouseY, stars[stars.length - 1].originX, stars[stars.length - 1].originY) > 25) {
      let newStar = new Star(mouseX, mouseY);

      if (stars.length > 0) {
        let prevStar = stars[stars.length - 1];
        let d = dist(newStar.originX, newStar.originY, prevStar.originX, prevStar.originY);
        if (d < 60) {
          newStar.connections.push(prevStar);
        }
      }

      stars.push(newStar);
    }
  }
}

function touchStarted() {
  if (touches.length > 0) {
    mouseX = touches[0].x;
    mouseY = touches[0].y;
    mousePressed();
  }
  return false;
}

function touchMoved() {
  if (touches.length > 0) {
    mouseX = touches[0].x;
    mouseY = touches[0].y;
    mouseDragged();
  }
  return false;
}

class Star {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;
    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(1000, 2000);
    // this.noiseOffsetX = 0;
    // this.noiseOffsetY = 0;
    this.radius = 5;
    this.driftRange = 10;
    this.connections = [];
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
  }, 500);
}

function transfer() {
  isTransferring = true;
  statusMsg.html('Transferring...');

  pix2pix.transfer(modelCanvas.elt, function (err, result) {
    isTransferring = false;

    if (err) {
      console.error(err);
      statusMsg.html('Error: Check Developer Console.');
      return;
    }

    if (result && result.src) {
      statusMsg.html('Done!');
      loadImage(result.src, function (p5img) {
        let tmp = createGraphics(SIZE * SCALE, SIZE * SCALE);
        tmp.pixelDensity(1);
        tmp.image(p5img, 0, 0, SIZE * SCALE, SIZE * SCALE);
        ditherFloydSteinbergBW(tmp);
        ditheredResult = tmp;
      });
    }
  });
}