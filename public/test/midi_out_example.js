let midiAccess;  // Store the MIDI access object
let midiOutput;  // Store the selected MIDI output device
let midiOutputSelect;  // Dropdown to select MIDI output
let ccSelect;  // Dropdown to select MIDI CC number
let midiSlider;  // Slider to control the MIDI output
let selectedCC = 1;  // Default CC number

function setup() {
  createCanvas(400, 200);

  // Create the MIDI slider (0-127 range)
  midiSlider = createSlider(0, 127, 0);
  midiSlider.position(20, 50);
  midiSlider.input(sendMIDICC);  // Send MIDI message when slider is adjusted

  // Dropdown to select the MIDI Control Change number
  ccSelect = createSelect();
  ccSelect.position(20, 100);
  for (let i = 0; i < 128; i++) {
    ccSelect.option(`CC ${i}`, i);
  }
  ccSelect.selected(selectedCC);
  ccSelect.changed(() => selectedCC = parseInt(ccSelect.value()));  // Update selected CC number

  // Dropdown to select the MIDI output device
  midiOutputSelect = createSelect();
  midiOutputSelect.position(20, 150);
  midiOutputSelect.option('Select MIDI Output');
  midiOutputSelect.changed(() => selectMIDIOutput(midiOutputSelect.value()));

  // Request MIDI access
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function draw() {
  background(220);
  textSize(16);
  fill(0);
  text(`MIDI CC Output: ${selectedCC}`, 20, 30);
  text(`Slider Value: ${midiSlider.value()}`, 20, 80);
}

// Send a MIDI CC message based on the slider value
function sendMIDICC() {
  if (midiOutput) {
    let value = midiSlider.value();  // Get the slider value (0-127)
    let status = 0xB0;  // MIDI Control Change message
    midiOutput.send([status, selectedCC, value]);  // Send the MIDI CC message
    console.log(`Sent CC: ${selectedCC}, Value: ${value}`);  // Log to console for debugging
  }
}

// Populate MIDI output select dropdown
function onMIDISuccess(access) {
  midiAccess = access;  // Store the MIDI access object

  let outputs = midiAccess.outputs.values();
  for (let output of outputs) {
    midiOutputSelect.option(output.name, output.id);
  }
}

function onMIDIFailure() {
  console.log('Could not access MIDI devices.');
}

// Select the MIDI output device
function selectMIDIOutput(outputId) {
  let outputs = midiAccess.outputs;
  midiOutput = outputs.get(outputId);  // Set the selected MIDI output
}
