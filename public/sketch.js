/*-------- global variables -------*/

//Use physical encoders ?
let useEncoders = false;

//Associate variables to encoders : [effect name, encoder, start value, end value]
let controls = [
  ["Clouds Speed", 1, 0.05, 1.0],
  ["Clouds Opacity", 1, 0, 255],
  ["Bird Speed", 2, 0.5, 2.0],
  ["Bird Altitude", 1, 200, 0],
  ["Nb of Birds", 2, 1, 20],
  ["Moon Opacity", 0, 0, 255],
  ["Glitch", 3, 0, 1],
  ["Hue", 0, 0, 0.2],
  ["Saturation", 1, 1, 0.5],
  ["Window Lights", 0, 0, 127],
];

/*--------------------------------*/


let socket; // Socket.io connection

// Encoders
let encoderValues = [0, 0, 0, 0];  // Array to hold 4 encoder values
let previousEncoderValues = [0, 0, 0, 0];  // To track previous encoder values
let previousEncoderSlidersValues = [];

// existing sketch variables
let images = [];
let movingPositions = [];
let lightStatus = {};
let xStatus = {};
let speeds = {};
let cloudSpeedMultiplier = 0.1;
let movingVisibility = false;
let cloudTransparency = 0;
let hueValue = 0;
let glitchValue = 0;
let windowLights = 0;
let previousWindowLights = 0;
let numberOfBirds = 1;
let previousNumberOfBirds = 1;

// let birds = [];
let birdFrames = [];
let birdSpeed = 0.5;
let birdY = 0;
let birdAnimationSpeed = 5;
let birdFlock;

let dry, fx;

//sliders
let sliders = [];
let sliderCCs = [];
let encoderSliders = [];
let showSliders = true;
let description;

let midiAccess;
let midiInput;
let midiCCs = [1, 2, 3, 4, 5, 6, 7];

let ccSelects = [];
let midiOutputSelect;  
let midiOutputs = [];

let moonTransparency = 255;

//webgl
let glitchShader;
let screen;


function preload() {
  // dry = loadSound('audio/dry.wav');
  // fx = loadSound('audio/fx.wav');

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
      xStatus[index] = false;
    }
  });

  for (let i = 1; i <= 8; i++) {
    birdFrames.push(loadImage(`images/bird/bird${i}.png`));
  }

  glitchShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(800, 480, WEBGL);

  midiButton = createButton('Request MIDI Access');
  midiButton.position(10, 10);
  midiButton.mousePressed(requestMIDI);

  screen = createGraphics(width, height);
  toggleXImages();

  birdFlock = new BirdFlock();
  birdFlock.addBird();

   // Connect to the server using socket.io
   socket = io();

   socket.on('encoderData', function(data) {
    let newEncoderValues = [data.value1, data.value2, data.value3, data.value4];
  
    // Iterate through each encoder value and send MIDI CC if the value has changed
    newEncoderValues.forEach((newValue, index) => {
      if (newValue !== previousEncoderValues[index]) {
        // Send a MIDI CC message for the changed encoder using the assigned CC number from midiCCs
        sendMIDICC(midiCCs[index], map(newValue, 0, 127, 0, 127));  // CC range 0-127
  
        // Update the previous value for that encoder
        previousEncoderValues[index] = newValue;
      }
    });
  
    // Update global encoderValues array
    encoderValues = newEncoderValues;
  });

  for (let i = 0; i < controls.length; i++) {
    let slider = createSlider(0, 127, 0).class('slider');
    sliders.push(slider);

    let ccSelect = createSelect().class('cc-select');
    for (let j = 0; j < 128; j++) {
      ccSelect.option(`CC ${j}`, j);
    }
    ccSelect.selected(midiCCs[i]);
    ccSelect.changed(() => updateSliderCC(i, ccSelect.value()));
    ccSelects.push(ccSelect);

    description = createP(controls[i][0]).class('slider-description').id(`description${i}`);
  }

  for (let i=0; i < encoderValues.length; i++) {
    let encoderSlider = createSlider(0, 127, 0).class('slider');
    encoderSliders.push(encoderSlider);
    previousEncoderSlidersValues[i] = encoderSliders[i].value();
  }

  midiInputSelect = createSelect().class('cc-select');
  midiInputSelect.option('Select MIDI Input');
  midiInputSelect.changed(() => selectMIDIInput(midiInputSelect.value()));

  midiOutputSelect = createSelect().class('cc-select');
  midiOutputSelect.option('Select MIDI Output');
  midiOutputSelect.changed(() => selectMIDIOutput(midiOutputSelect.value()));
 

  
  // Position elements
  positionElements();

  shader(glitchShader);
}

function requestMIDI() {
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function positionElements() {
  let sliderWidth = 90;
  for (let i = 0; i < sliders.length; i++) {
    select(`#description${i}`).position(10 + i * sliderWidth, height + 10);
    ccSelects[i].position(10 + i * sliderWidth, height + 30);
    sliders[i].position(10 + i * sliderWidth, height + 60);
    sliders[i].size(sliderWidth - 10);
  }
  midiInputSelect.position(10, height + 100);
  midiOutputSelect.position(150, height + 100);
  for (let i = 0; i < encoderSliders.length; i++) {
    let encoderName = "Encoder " + i;
    let encoderDescription = createP(encoderName).class('slider-description').id(`encoderDescription${i}`);
    encoderDescription.position(10 + i * sliderWidth, height + 140);
    encoderSliders[i].position(10 + i * sliderWidth, height + 160);
    encoderSliders[i].size(sliderWidth - 10);
  }

}

function draw() {
 
  if (useEncoders) {
    for (let i = 0; i < encoderSliders.length; i++) {
      encoderSliders[i].value(encoderValues[i]);
    }
    console.log('encoder 1 : ' + encoderValues[0] + ', encoder 2 : ' + encoderValues[1] + ', encoder 3 : ' + encoderValues[2] +  ', encoder 4 : '  + encoderValues[3] )
  }

  let encoderChanged = false;
  for (let i = 0; i < encoderSliders.length; i++) {
    if (encoderSliders[i].value() !== previousEncoderSlidersValues[i]) {
      encoderChanged = true;
      previousEncoderSlidersValues[i] = encoderSliders[i].value();
    }
  }
  
  for (let i = 0; i < sliders.length; i++) {
    if (encoderChanged) {
      console.log(i + ' encoder ' + controls[i][1]);
      sliders[i].value(encoderSliders[controls[i][1]].value());
    }
  }

  cloudSpeedMultiplier = map(sliders[0].value(), 0, 127, controls[0][2], controls[0][3]);
  cloudTransparency = map(sliders[1].value(), 0, 127, controls[1][2], controls[1][3]);
  birdSpeed = map(sliders[2].value(), 0, 127, controls[2][2], controls[2][3]);
  birdY = map(sliders[3].value(), 0, 127, controls[3][2], controls[3][3]);
  numberOfBirds = floor(map(sliders[4].value(), 0, 127, controls[4][2], controls[4][3]));
  moonTransparency = map(sliders[5].value(), 0, 127, controls[5][2], controls[5][3]);
  glitchValue = getNoiseValue(map(sliders[6].value(), 0, 127, controls[6][2], controls[6][3]));
  hueValue = map(sliders[7].value(), 0, 127, controls[7][2], controls[7][3]);
  saturationValue = map(sliders[8].value(), 0, 127, controls[8][2], controls[8][3]);
  windowLights = map(sliders[9].value(), 0, 127, controls[9][2], controls[9][3]);

  if (windowLights > previousWindowLights) {
    addRandomLights();
    previousWindowLights = windowLights;
  }
  else if (windowLights < previousWindowLights) {
    if (windowLights === 0) {
      turnAllLightsOff();
    }
    else {
      removeRandomLights();
    }
    previousWindowLights = windowLights;
  }

  if (numberOfBirds > previousNumberOfBirds) {
    birdFlock.addBird();
    previousNumberOfBirds = numberOfBirds;
  }
  else if (numberOfBirds < birdFlock.birds.length) {
    birdFlock.removeBird();
    previousNumberOfBirds = numberOfBirds;
  }

  updateMovingVisibility();

  images.forEach((item, index) => {
    if (item.type === 'S') {
      screen.image(item.img, 0, 0);
    } else if (item.type === 'L' && lightStatus[index]) {
      screen.image(item.img, 0, 0);
    } else if (item.type === 'X' && xStatus[index]) {
      screen.tint(255, moonTransparency);
      screen.image(item.img, 0, 0);
      screen.tint(255, 255);
    } else if (item.type === 'M') {
      screen.tint(255, cloudTransparency);
      movingPositions[index] += speeds[index] * cloudSpeedMultiplier;
      if (movingPositions[index] > width) movingPositions[index] = -item.img.width;
      screen.image(item.img, movingPositions[index], 0);
      screen.tint(255, 255);
    }
  });

  birdFlock.run();
  // for (let bird of birds) {
  //   bird.update();
  //   bird.display();
  // }

  drawScreen(glitchValue, hueValue, saturationValue);

  if (showSliders) {
    sliders.forEach(slider => slider.show());
    ccSelects.forEach(select => select.show());
    encoderSliders.forEach(slider => slider.show());
    for (let i = 0; i < sliders.length; i++) {
      select(`#description${i}`).show();
    }
    midiOutputSelect.show();
    midiInputSelect.show();
  } else {
    sliders.forEach(slider => slider.hide());
    ccSelects.forEach(select => select.hide());
    encoderSliders.forEach(slider => slider.hide());
    for (let i = 0; i < sliders.length; i++) {
      select(`#description${i}`).hide();
    }
    midiOutputSelect.hide();
    midiInputSelect.hide();
  }
}

function drawScreen(splittingValue, hueValue, saturationValue) {
  glitchShader.setUniform('texture', screen);
  glitchShader.setUniform('splitting', splittingValue);
  glitchShader.setUniform('hue', hueValue);
  glitchShader.setUniform('saturation', saturationValue);
  
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

function sendMIDICC(controller, value) {
  if (midiOutput) {  // Ensure an output is selected
    let status = 0xB0;  // MIDI Control Change message
    midiOutput.send([status, controller, value]);  // Send CC message
  }
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
    console.log("no sounds");
    // if (dry.isPlaying()) {
    //   dry.pause();
    // } else {
    //   dry.play();
    // }
  } else if (key === 'x') {
    movingVisibility = !movingVisibility;
    // if (fx.isPlaying()) {
    //   fx.pause();
    //   movingVisibility = !movingVisibility;
    // } else {
    //   fx.play();
    //   movingVisibility = !movingVisibility;
    // }
  } else if (key >= '1' && key <= '5') {
    cloudSpeedMultiplier = parseFloat(key) * 0.2;
  } else if (key === 't') {
    showSliders = !showSliders;
  }
  else if (key === 'f') {
    let fs = fullscreen();
    fullscreen(!fs);
    showSliders = fs;
  }
}

function updateMovingVisibility() {
  let fadeSpeed = 5;
  if (movingVisibility && cloudTransparency < 255) {
    cloudTransparency += fadeSpeed;
  } else if (!movingVisibility && cloudTransparency > 0) {
    cloudTransparency -= fadeSpeed;
  }
}

function displayStatus() {
  fill(255);

  // fill(dry.isPlaying() ? 'white' : 'grey');
  // text(`Dry track (z)`, 10, 520);

  // fill(fx.isPlaying() ? 'white' : 'grey');
  // text(`FX track (x)`, 180, 520);

  let anyXVisible = Object.values(xStatus).some(status => status);
  fill(anyXVisible ? 'white' : 'grey');
  text(`Moon (m)`, 340, 520);

  let lightsOn = Object.keys(lightStatus).filter(index => lightStatus[index]).join(', ');
  fill(lightsOn.length > 0 ? 'white' : 'grey');
  text(`Windows (l / h)`, 480, 520);

  text(`Settings (t)`, 660, 520);
}



function toggleXImages() {
  // Toggle the visibility of all 'X' images, including the moon
  Object.keys(xStatus).forEach((index) => {
    xStatus[index] = !xStatus[index];  // Toggle the status
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

function addRandomLights() {
  const offLights = Object.keys(lightStatus).filter(index => !lightStatus[index]);
  const numLightsToToggle = floor(random(3));
  for (let i = 0; i < numLightsToToggle; i++) {
    if (offLights.length > 0) {
      let randomOffLight = random(offLights);
      lightStatus[randomOffLight] = true; // Turn it on
    }
  }
}

function removeRandomLights() {
  const onLights = Object.keys(lightStatus).filter(index => lightStatus[index]);
  const numLightsToToggle = floor(random(3));
  for (let i = 0; i < numLightsToToggle; i++) {
    if (onLights.length > 0) {
      let randomOnLight = random(onLights);
      lightStatus[randomOnLight] = false; // Turn it off
    }
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
    console.log("midi input success");
  }
  
  let outputs = midiAccess.outputs.values();
  for (let output of outputs) {
    midiOutputs.push(output);
    midiOutputSelect.option(output.name, output.id);  // Add to output dropdown
    console.log("midi output success");

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

function selectMIDIOutput(outputId) {
  let outputs = midiAccess.outputs;
  midiOutput = outputs.get(outputId);  // Select the correct MIDI output
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

class Bird {
  constructor() {
    this.x = 820 + random(50);
    this.yOffset = random(100);
    this.y = birdY + this.yOffset;
    this.speed = birdSpeed;
    this.animationSpeed = birdAnimationSpeed;
    this.animationCounter = 0;
    this.frameIndex = 0;
    this.alive = true;
  }

  update() {
    this.y = birdY + this.yOffset;
    this.speed = birdSpeed;

    this.x -= this.speed;
    if (this.x < -birdFrames[this.frameIndex].width && this.alive) {
      this.x = width;
    }

    this.animationCounter++;
    if (this.animationCounter % this.animationSpeed === 0) {
      this.frameIndex = (this.frameIndex + 1) % birdFrames.length;
    }
  }

  display() {
    screen.image(birdFrames[this.frameIndex], this.x, this.y);
  }
}

class BirdFlock {

  constructor() {
    this.birds = [];
  }

  addBird() {
    let b = new Bird();
    this.birds.push(b);
  }

  removeBird() {
    if (this.birds.length > 0) {
      let minXBird = this.birds[0]; 
      this.birds.forEach((bird) => {
        if (bird.x < minXBird.x) {
          minXBird = bird;
        }
      });
      minXBird.alive = false;
    }
  }

  run() {
    for (let i = this.birds.length - 1; i >= 0; i--) {
      let b = this.birds[i];
      b.update();
      b.display();
      if (!b.alive && b.x < 0) {
        this.birds.splice(i, 1);
      }
    }
  }
}