let screen;
let glitchShader;
let img;
let splittingValue;
let hueValue;

let images = [];
let movingPositions = [];
let lightStatus = {};
let xStatus = {};
let speeds = {};
let globalSpeedMultiplier = 0.1;
let xAlpha = 255;
let movingAlpha = 0;

function preload() {
  glitchShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(600, 600, WEBGL);
  screen = createGraphics(width, height);
  
  screen.background(50);
  
  img = loadImage(`images/keany.png`);
  let filenames = [
    '001_S.png', '002_S.png', '003_S.png', '004_X.png', '005_L.png', '006_L.png',
    '007_L.png', '008_L.png', '009_L.png', '010_L.png', '011_L.png', '012_L.png', '013_L.png',
    '014_L.png', '015_L.png', '016_L.png', '017_L.png', '018_L.png', '019_L.png', '020_L.png',
    '021_L.png', '022_L.png', '023_L.png', '024_L.png', '025_L.png', '026_L.png', '027_L.png',
    '028_L.png', '029_L.png', '030_L.png', '031_L.png', '032_L.png', '033_L.png', '034_L.png',
    '035_L.png', '036_L.png', '037_L.png', '038_L.png', '039_L.png', '040_L.png', '041_L.png',
    '042_L.png', '043_L.png', '044_L.png', '045_L.png', '046_L.png', '047_L.png', '048_L.png',
    '049_L.png', '050_L.png', '051_L.png', '052_L.png', '053_L.png', '054_L.png', '055_L.png',
    '056_L.png', '057_L.png', '058_L.png', '059_L.png', '060_L.png', '061_L.png', '062_L.png',
    '063_L.png', '064_L.png', '065_L.png', '066_L.png', '067_L.png', '068_L.png', '069_L.png',
    '070_L.png', '071_L.png', '072_L.png', '073_L.png', '074_L.png', '075_L.png', '076_L.png',
    '077_L.png', '078_L.png', '079_L.png', '080_L.png', '081_L.png', '082_L.png', '083_L.png',
    '084_L.png', '085_L.png', '086_M.png', '087_S.png', '088_X.png', '089_S.png', '090_L.png',
    '091_L.png', '092_L.png', '093_L.png', '094_L.png', '095_L.png', '096_L.png', '097_L.png',
    '098_L.png', '099_L.png', '100_L.png', '101_L.png', '102_L.png', '103_L.png', '104_L.png',
    '105_L.png', '106_L.png', '107_L.png', '108_L.png', '109_L.png', '110_L.png', '111_L.png',
    '112_L.png', '113_L.png', '114_L.png', '115_L.png', '116_L.png', '117_L.png', '118_L.png',
    '119_M.png', '120_S.png', '121_X.png', '122_S.png', '123_X.png', '124_L.png', '125_L.png',
    '126_L.png', '127_L.png', '128_L.png', '129_L.png', '130_L.png', '131_L.png', '132_L.png',
    '133_L.png', '134_L.png', '135_L.png'
  ];

  filenames.forEach((filename, index) => {
    let img = loadImage(`images/${filename}`);
    let type = filename.split('_')[1][0];
    images.push({ img: img, type: type });

    if (type === 'M') {
      movingPositions[index] = -800;
      speeds[index] = filename.includes('086') ? 1.5 : filename.includes('119') ? 0.5 : 1;
    } else if (type === 'L') {
      lightStatus[index] = false;
    } else if (type === 'X') {
      xStatus[index] = true;
    }
  });

  splittingValue = document.getElementById('splitting').value;
  hueValue = document.getElementById('hue').value;

  shader(glitchShader);
}

function draw() {
  images.forEach((item, index) => {
    if (item.type === 'S') {
      screen.image(item.img, 0, 0);
    } else if (item.type === 'L' && lightStatus[index]) {
      screen.image(item.img, 0, 0);
    } else if (item.type === 'X' && xStatus[index]) {
      screen.tint(255, xAlpha);
      screen.image(item.img, 0, 0);
      screen.noTint();
    } else if (item.type === 'M') {
      screen.tint(255, movingAlpha);
      movingPositions[index] += speeds[index] * globalSpeedMultiplier;
      if (movingPositions[index] > width) movingPositions[index] = -item.img.width;
      screen.image(item.img, movingPositions[index], 0);
      screen.noTint();
    }
  });

  splittingValue = document.getElementById('splitting').value;
  hueValue = document.getElementById('hue').value;
  drawScreen(splittingValue, hueValue);
}


function drawScreen(splittingValue, hueValue) {
  glitchShader.setUniform('texture', screen);

  glitchShader.setUniform('splitting', getNoiseValue(splittingValue));
  glitchShader.setUniform('hue', hueValue);
  
  rect(-width/2, -height/2, width, height);
}

function getNoiseValue(intensity) { 
  let v = noise(millis()/100);
  const cutOff = 1-intensity;
  
  if(v < cutOff) {
    return 0;
  }
  
  v = pow((v-cutOff) * 1/(1-cutOff), 2);
  
  return v;
}