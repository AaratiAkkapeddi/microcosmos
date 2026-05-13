const SIZE = 256;
const DISPLAY_SIZE = 1024;
const SCALE = 4;
let modelCanvas;
let displayCanvas;
let inputImg, inputCanvas, output, statusMsg, pix2pix, randomBtn, clearBtn, transferBtn;

let stars = [];

// SAFETY FLAGS
let isModelLoaded = false;
let isTransferring = false;
const BAYER_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
].map(row => row.map(v => (v / 16) * 255));

function ditherColorBayer(pg, levels = 8) {
  pg.loadPixels();
  const step = 255 / (levels - 1);

  for (let y = 0; y < pg.height; y++) {
    for (let x = 0; x < pg.width; x++) {
      let idx = 4 * (y * pg.width + x);
      let threshold = BAYER_4x4[y % 4][x % 4];

      for (let c = 0; c < 3; c++) {
        let val = pg.pixels[idx + c];
        // Quantize to nearest level with Bayer threshold bias
        let quantized = Math.floor((val + threshold * (step / 255)) / step) * step;
        pg.pixels[idx + c] = Math.min(255, Math.max(0, Math.round(quantized)));
      }
    }
  }
  pg.updatePixels();
}
function ditherFloydSteinberg(pg) {
  pg.loadPixels();
  let w = pg.width, h = pg.height;

  // Work on float arrays per channel to carry error
  let r = new Float32Array(w * h);
  let g = new Float32Array(w * h);
  let b = new Float32Array(w * h);

  // Copy pixels into float arrays
  for (let i = 0; i < w * h; i++) {
    r[i] = pg.pixels[i * 4];
    g[i] = pg.pixels[i * 4 + 1];
    b[i] = pg.pixels[i * 4 + 2];
  }

  // Number of color levels per channel — 2 = harsh, 4 = balanced, 8 = subtle
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

      // Distribute error to neighbours
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

  // Write back
  for (let i = 0; i < w * h; i++) {
    pg.pixels[i * 4] = r[i];
    pg.pixels[i * 4 + 1] = g[i];
    pg.pixels[i * 4 + 2] = b[i];
    pg.pixels[i * 4 + 3] = 255;
  }

  pg.updatePixels();
}




function setup() {
  inputCanvas = createCanvas(SIZE * SCALE, SIZE * SCALE);
  inputCanvas.class('border-box').parent('input');
  modelCanvas = createGraphics(SIZE, SIZE);
  modelCanvas.pixelDensity(1);
  displayCanvas = createGraphics(SIZE * SCALE, SIZE * SCALE); // ← after modelCanvas
  displayCanvas.pixelDensity(1);
  displayCanvas.parent('output'); // put it where your <img> was

  // hide the original output img if needed

  background(0);


  statusMsg = select('#status');
  // transferBtn = select('#transferBtn');

  clearBtn = select('#clearBtn');
  clearBtn.mousePressed(function () {
    clearCanvas();
    setTimeout(function () { displayCanvas.background(0) }, 100);
  });

  // randomBtn = select('#randomBtn');
  // randomBtn.mousePressed(function() {
  //   let src =['images/seg0.png', 'images/seg1.jpg', 'images/seg2.jpg', 'images/seg3.jpg', 'images/seg4.jpg', 'images/seg5.png', 'images/seg6.jpg', 'images/seg7.jpg', 'images/seg8.jpg', 'images/seg9.jpg', 'images/seg10.jpg', 'images/seg11.jpg', 'images/seg12.jpg'];
  //   let index = int(random(0, 13));
  //   inputImg = loadImage(src[index]);
  // });

  pixelDensity(1);
  pix2pix = ml5.pix2pix('./model/flies.pict', modelLoaded);
}

function draw() {

  background(0);


  // 1. Draw all FIXED connection lines first
  for (let i = 0; i < stars.length; i++) {
    for (let j = 0; j < stars[i].connections.length; j++) {
      let neighbor = stars[i].connections[j];
      stroke("#ecdfac");
      strokeWeight(1);
      line(stars[i].x, stars[i].y, neighbor.x, neighbor.y);
      displayCanvas.stroke(236, 223, 172, 255);
      displayCanvas.strokeWeight(1);

      if (mouseIsPressed) {
        displayCanvas.line(stars[i].x, stars[i].y, neighbor.x, neighbor.y)
      }
    }
  }

  // 2. Update and draw the stars on top
  for (let i = 0; i < stars.length; i++) {
    stars[i].update();
    stars[i].display();
  }

  // --- MODEL INPUT CANVAS (clean version) ---
  modelCanvas.background(0);

  // ONLY draw stars (no lines, no stroke)
  for (let i = 0; i < stars.length; i++) {
    modelCanvas.noStroke();
    modelCanvas.fill(255);
    modelCanvas.ellipse(stars[i].x / SCALE, stars[i].y / SCALE, stars[i].radius, stars[i].radius);
  }
  for (let i = 0; i < stars.length; i++) {
    fill("#000");
    ellipse(stars[i].x, stars[i].y, stars[i].radius, stars[i].radius);
    fill("#ecdfac");
    textSize((sin(frameCount * random(2)) + 20));
    textAlign(CENTER);
    text("✷", stars[i].x, stars[i].y + 10);

    displayCanvas.fill(236, 223, 172, 255);
    displayCanvas.textSize(20);
    displayCanvas.textAlign(CENTER);
    if (mouseIsPressed) {
      displayCanvas.text("✷", stars[i].x, stars[i].y + 10);
    }
  }
}

// When you click, drop a new floating star
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let newStar = new Star(mouseX, mouseY);

    // Check if we are clicking near an existing star to branch off it!
    let closestStar = null;
    let recordDist = Infinity;
    for (let i = 0; i < stars.length; i++) {
      let d = dist(mouseX, mouseY, stars[i].originX, stars[i].originY);
      if (d < recordDist) {
        recordDist = d;
        closestStar = stars[i];
      }
    }

    // If we clicked within 60px of an existing star, branch off it
    if (closestStar && recordDist < 60 * SCALE) {
      newStar.connections.push(closestStar);
    }

    stars.push(newStar);
  }
}

// Allow the user to "paint" stars by dragging
function mouseDragged() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Drop a star every 25 pixels
    if (stars.length === 0 || dist(mouseX, mouseY, stars[stars.length - 1].originX, stars[stars.length - 1].originY) > 25) {
      let newStar = new Star(mouseX, mouseY);

      // Permanently connect this new star to the immediate previous one
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

// THE TETHERED STAR PHYSICS CLASS
class Star {
  constructor(x, y) {
    this.originX = x;
    this.originY = y;

    this.noiseOffsetX = random(0, 1000);
    this.noiseOffsetY = random(1000, 2000);

    this.radius = 5;
    this.driftRange = 10; // Tighter drift for a cleaner look

    // Array to hold permanent connections to other stars
    this.connections = [];
  }

  update() {
    this.x = this.originX + map(noise(this.noiseOffsetX), 0, 1, -this.driftRange, this.driftRange);
    this.y = this.originY + map(noise(this.noiseOffsetY), 0, 1, -this.driftRange, this.driftRange);

    this.noiseOffsetX += 0.05;
    this.noiseOffsetY += 0.05;
  }

  display() {
    noStroke();
    fill(255);
    ellipse(this.x, this.y, this.radius, this.radius);
  }
}

function modelLoaded() {
  statusMsg.html('Model Loaded!');
  isModelLoaded = true;

  // transferBtn.mousePressed(function() {
  //   if (!isTransferring) transfer();
  // });

  // THE AUTO-GENERATOR TIMER
  setInterval(() => {
    if (isModelLoaded && !isTransferring && stars.length > 0) {
      transfer();
    }
  }, 10);
}

function clearCanvas() {
  stars = [];
  inputImg = null;
  background(0);
}

// function transfer() {
//   isTransferring = true;
//   statusMsg.html('Transferring...');

//   const canvasElement = select('canvas').elt;

//   pix2pix.transfer(modelCanvas.elt, function (err, result) {
//     // pix2pix.transfer(canvasElement, function(err, result) {
//     isTransferring = false;

//     if (err) {
//       console.error(err);
//       statusMsg.html('Error: Check Developer Console.');
//       return;
//     }
//     if (result && result.src) {
//       statusMsg.html('Done!');
//       output.elt.src = result.src;
//     }
//   });
// }

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

      // Load result into an image, draw onto displayCanvas, then dither
      // loadImage(result.src, function(img) {
      //   displayCanvas.image(img, 0, 0, SIZE, SIZE);
      //   ditherColorBayer(displayCanvas, 3); // ← tweak levels here
      // });
      loadImage(result.src, function (p5img) {
        displayCanvas.image(p5img, 0, 0, SIZE * SCALE, SIZE * SCALE);
        //   for (let i = 0; i < stars.length; i++) {
        //   for (let j = 0; j < stars[i].connections.length; j++) {
        //     let neighbor = stars[i].connections[j];
        //     displayCanvas.stroke(236, 223, 172,255);
        //     displayCanvas.strokeWeight(1);
        //     displayCanvas.line(stars[i].x, stars[i].y, neighbor.x, neighbor.y)
        //   }
        // }
        //         for (let i = 0; i < stars.length; i++) {

        //   displayCanvas.fill(236, 223, 172,255);
        //   displayCanvas.textSize((sin(frameCount * random(2) )+ 20));
        //   displayCanvas.textAlign(CENTER);
        //   if(displayCanvas.mouseX > 0 && displayCanvas.mouseX < displayCanvas.width){
        //     displayCanvas.text("✷",stars[i].x, stars[i].y + 10);
        //   }
        //   // displayCanvas.text("✷",stars[i].x, stars[i].y + 10);
        // }
        ditherFloydSteinberg(displayCanvas);
      });
    }
  });
}