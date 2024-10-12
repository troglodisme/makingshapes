

//encoder 
let encoderValue = 0;
let buttonPressed = false;


//existing sketch
let images = [];
let movingPositions = [];
let lightStatus = {};
let xStatus = {};
let speeds = {};
let globalSpeedMultiplier = 0.1;
let movingVisibility = false;
let movingAlpha = 0;

let birdFrames = [];
let birdIndex = 0;
let birdX = 900;
let birdY = 250;
let birdSpeed = 0.5;
let birdAnimationSpeed = 5;
let birdAnimationCounter = 0;

let dry, fx;

let sliders = [];
let sliderCCs = [];
let showSliders = true;

let midiAccess;
let midiInput;
let midiOutputs = [];
let midiCCs = [1, 2, 3, 4, 5];

let midiInputSelect;
let ccSelects = [];

let xAlpha = 255;

function preload() {
  dry = loadSound('audio/dry.wav');
  fx = loadSound('audio/fx.wav');

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

  for (let i = 1; i <= 8; i++) {
    birdFrames.push(loadImage(`images/bird/bird${i}.png`));
  }
}

function setup() {
  createCanvas(800, 600);
  setInterval(fetchEncoderData, 100);


  dry.loop();
  fx.loop();
  dry.pause();
  fx.pause();
  toggleXImages();

  let descriptions = ['Clouds Speed', 'Clouds Opacity', 'Bird Speed', 'Bird Altitude', 'Moon Opacity'];

  for (let i = 0; i < 5; i++) {
    let slider = createSlider(0, 255, 0).class('slider');
    sliders.push(slider);

    let ccSelect = createSelect().class('cc-select');
    for (let j = 0; j < 128; j++) {
      ccSelect.option(`CC ${j}`, j);
    }
    ccSelect.selected(midiCCs[i]);
    ccSelect.changed(() => updateSliderCC(i, ccSelect.value()));
    ccSelects.push(ccSelect);

    let description = createP(descriptions[i]).class('slider-description').id(`description${i}`);
  }

  midiInputSelect = createSelect().class('cc-select');
  midiInputSelect.option('Select MIDI Input');
  midiInputSelect.changed(() => selectMIDIInput(midiInputSelect.value()));

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  
  // Position elements
  positionElements();
}

function positionElements() {
  for (let i = 0; i < 5; i++) {
    select(`#description${i}`).position(10 + i * 160, height + 10);
    ccSelects[i].position(10 + i * 160, height + 30);
    sliders[i].position(10 + i * 160, height + 60);
  }
  midiInputSelect.position(10, height + 100);
}

function draw() {
  background(0);

  images.forEach((item, index) => {
    let imgAlpha = 255;
    if (item.type === 'S') {
      image(item.img, 0, 0);
    } else if (item.type === 'L' && lightStatus[index]) {
      image(item.img, 0, 0);
    } else if (item.type === 'X' && xStatus[index]) {
      tint(255, xAlpha);
      image(item.img, 0, 0);
      noTint();
    } else if (item.type === 'M') {
      tint(255, movingAlpha);
      movingPositions[index] += speeds[index] * globalSpeedMultiplier;
      if (movingPositions[index] > width) movingPositions[index] = -item.img.width;
      image(item.img, movingPositions[index], 0);
      noTint();
    }
  });


  textSize(32);
  fill(255);
  text('Encoder Value: ' + encoderValue, 10, 50);

  updateMovingVisibility();

  birdAnimationCounter++;
  if (birdAnimationCounter % birdAnimationSpeed === 0) {
    birdIndex = (birdIndex + 1) % birdFrames.length;
  }
  image(birdFrames[birdIndex], birdX, birdY);
  birdX -= birdSpeed;
  if (birdX < -birdFrames[birdIndex].width) {
    birdX = width;
  }

  globalSpeedMultiplier = map(sliders[0].value(), 0, 255, 0.01, 1.0);
  movingAlpha = sliders[1].value();

  birdSpeed = map(sliders[2].value(), 0, 255, 0.0, 2.0);

  birdY = map(encoderValue, 100, 0, 0, height);


  xAlpha = sliders[4].value();

  if (showSliders) {
    sliders.forEach(slider => slider.show());
    ccSelects.forEach(select => select.show());
    for (let i = 0; i < 5; i++) {
      select(`#description${i}`).show();
    }
  } else {
    sliders.forEach(slider => slider.hide());
    ccSelects.forEach(select => select.hide());
    for (let i = 0; i < 5; i++) {
      select(`#description${i}`).hide();
    }
  }

  textFont('monospace');
  textSize(16);
  noStroke();
  displayStatus();
}

// Fetch the latest encoder data from the server
function fetchEncoderData() {
  fetch('/encoder-data')
    .then(response => response.json())
    .then(data => {
      encoderValue = data.encoderValue;
      buttonPressed = data.buttonPressed;
    })
    .catch(error => console.error('Error fetching data:', error));
}

function keyPressed() {
  if (key === 'l') {
    toggleRandomLights();
  } else if (key === 'm') {
    toggleXImages();
  } else if (key === '+') {
    adjustSpeed(0.1);
  } else if (key === '-') {
    adjustSpeed(-0.1);
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
      movingVisibility = !movingVisibility;
    } else {
      fx.play();
      movingVisibility = !movingVisibility;
    }
  } else if (key >= '1' && key <= '5') {
    globalSpeedMultiplier = parseFloat(key) * 0.2;
  } else if (key === 't') {
    showSliders = !showSliders;
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
  text(`FX track (x)`, 180, 520);

  let anyXVisible = Object.values(xStatus).some(status => status);
  fill(anyXVisible ? 'white' : 'grey');
  text(`Moon (m)`, 340, 520);

  let lightsOn = Object.keys(lightStatus).filter(index => lightStatus[index]).join(', ');
  fill(lightsOn.length > 0 ? 'white' : 'grey');
  text(`Windows (l / h)`, 480, 520);

  text(`Settings (t)`, 660, 520);
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

function onMIDISuccess(access) {
  midiAccess = access;

  let inputs = midiAccess.inputs.values();
  for (let input of inputs) {
    midiInputSelect.option(input.name, input.id);
  }

  let outputs = midiAccess.outputs.values();
  for (let output of outputs) {
    midiOutputs.push(output);
  }
}

function onMIDIFailure() {
  console.log('Could not access MIDI devices.');
}

function selectMIDIInput(inputId) {
  if (midiInput) {
    midiInput.onmidimessage = null;
  }

  let inputs = midiAccess.inputs;
  midiInput = inputs.get(inputId);
  if (midiInput) {
    midiInput.onmidimessage = handleMIDIMessage;
  }
}

function handleMIDIMessage(message) {
  let data = message.data;
  let command = data[0];
  let controller = data[1];
  let value = data[2];

  if (command === 176) {
    let sliderIndex = midiCCs.indexOf(parseInt(controller));
    if (sliderIndex !== -1) {
      sliders[sliderIndex].value(map(value, 0, 127, 0, 255));
    }
  }
}

function updateSliderCC(index, cc) {
  midiCCs[index] = parseInt(cc);
}
