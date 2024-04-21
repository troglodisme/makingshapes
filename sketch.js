// Global variables to manage images and their properties
let images = [];
let movingPositions = [];
let lightStatus = {};  // To track the on/off status of each light image
let xStatus = {};      // To track the on/off status of each X image
let speeds = {};       // To control speeds for moving images
let globalSpeedMultiplier = 0.1; // Adjusts animation speed globally
let movingVisibility = false; // Toggle visibility of moving images
let movingAlpha = 0; // Initialize alpha for moving images at 0 (invisible)

// Sound objects
let dry, fx;

function preload() {
  dry = loadSound('audio/dry.wav');
  fx = loadSound('audio/fx.wav');

  let filenames = [
    '001_S.png', '002_S.png', '003_S.png', '004_X.png', '005_M.png', '006_S.png',
    '007_X.png', '008_S.png', '009_M.png', '010_S.png', '011_X.png', '012_S.png', '013_X.png'
  ];

  // Adding light images from 014 to 133
  for (let i = 14; i <= 133; i++) {
    filenames.push(`${nf(i, 3)}_L.png`);
  }

  // Load images and classify their types
  filenames.forEach((filename, index) => {
    let img = loadImage(`images/${filename}`);
    let type = filename.split('_')[1][0];
    images.push({ img: img, type: type });

    if (type === 'M') {
      movingPositions[index] = -800;  // Set initial positions off-screen
      speeds[index] = filename.includes('005') ? 1.5 : filename.includes('009') ? 0.5 : 1;
    } else if (type === 'L') {
      lightStatus[index] = false;
    } else if (type === 'X') {
      xStatus[index] = true;
    }
  });
}

function setup() {
  createCanvas(800,600);
  dry.loop();
  fx.loop();
  dry.pause();
  fx.pause();
  toggleXImages();
}

function draw() {
  background(0);
  images.forEach((item, index) => {
    let imgAlpha = 255; // Default opacity
    if (item.type === 'S') {
      image(item.img, 0, 0);
    } else if (item.type === 'L' && lightStatus[index]) {
      image(item.img, 0, 0);
    } else if (item.type === 'X' && xStatus[index]) {
      image(item.img, 0, 0);
    } else if (item.type === 'M') {
      tint(255, movingAlpha); // Apply fading effect
      movingPositions[index] += speeds[index] * globalSpeedMultiplier;
      if (movingPositions[index] > width) movingPositions[index] = -item.img.width;
      image(item.img, movingPositions[index], 0);
      noTint();
    }
  });

  updateMovingVisibility(); // Adjust the visual fading

  // UI display logic
  textFont('monospace');
  textSize(16);
  noStroke();
  displayStatus();
}

function keyPressed() {
  if (key === 'l') {
    toggleRandomLights();
  } else if (key === 'm') {
    toggleXImages();
  } else if (key === '+') {
    adjustSpeed(0.1);  // Increase speed of moving images
  } else if (key === '-') {
    adjustSpeed(-0.1);  // Decrease speed of moving images
  } else if (key === 'h') {
    turnAllLightsOff();
  } else if (key === 'z') {
    if (dry.isPlaying()) {
      dry.pause();
    } else {
      dry.play();
    }
  } else if (key === 'x') {
    if (fx.isPlaying()) {
      fx.pause();
      movingVisibility = !movingVisibility
    } else {
      fx.play();
      movingVisibility = !movingVisibility

    }
  } else if (key >= '1' && key <= '5') {
    globalSpeedMultiplier = parseFloat(key) * 0.2;
  }
}

function updateMovingVisibility() {
  let fadeSpeed = 5;
  if (movingVisibility && movingAlpha < 255) {
    movingAlpha += fadeSpeed;
  } else if (!movingVisibility && movingAlpha > 0) {
    movingAlpha -= fadeSpeed;
  }
}

function displayStatus() {
  fill(255);

  fill(dry.isPlaying() ? 'white' : 'grey');
  text(`Dry track (z)`, 10, 520);

  fill(fx.isPlaying() ? 'white' : 'grey');
  text(`FX track/clouds (x)`, 180, 520);

  let anyXVisible = Object.values(xStatus).some(status => status);
  fill(anyXVisible ? 'white' : 'grey');
  text(`Moon (m)`, 400, 520);

  // text(`Moon (m): ${anyXVisible ? 'on' : 'off'}`, 430, 520);

  let lightsOn = Object.keys(lightStatus).filter(index => lightStatus[index]).join(', ');
  fill(lightsOn.length > 0 ? 'white' : 'grey');
  text(`Windows (l / h)`, 520, 520);
  // text(`Windows (l/h): ${lightsOn}`, 500, 520);

}

function toggleXImages() {
  Object.keys(xStatus).forEach((index) => {
    xStatus[index] = !xStatus[index];
  });
}

function adjustSpeed(change) {
  Object.keys(speeds).forEach((index) => {
    if (images[index].type === 'M') {
      speeds[index] += change;
    }
  });
}

function toggleRandomLights() {
  const lightIndices = Object.keys(lightStatus);
  const numLightsToToggle = floor(random(1, lightIndices.length / 2));
  for (let i = 0; i < numLightsToToggle; i++) {
    let index = random(lightIndices);
    lightStatus[index] = !lightStatus[index];
  }
}

function turnAllLightsOff() {
  Object.keys(lightStatus).forEach(index => {
    lightStatus[index] = false;
  });
}
