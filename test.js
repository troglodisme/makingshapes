const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');

const app = express();
const server = http.createServer(app);
const io = new Server(server);  // Initialize socket.io

const portNumber = 3000;
app.use(express.static('public'));

// List available serial ports
SerialPort.list().then(
  ports => {
    console.log('Available serial ports:');
    ports.forEach(port => {
      console.log(`${port.path} - ${port.manufacturer}`);
    });

    // Now list available MIDI devices
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  },
  err => {
    console.error('Error listing serial ports: ', err);
  }
);

// Serve socket.io to the front end
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(portNumber, () => {
  console.log(`Server is running on port ${portNumber}`);
});

// MIDI functions
let midiAccess;
let midiOutputs = [];

function onMIDISuccess(access) {
  midiAccess = access;

  // Log available MIDI devices
  listMIDIDevices();

  // Handle hot-plugging of MIDI devices
  midiAccess.onstatechange = (e) => {
    console.log(`MIDI device: ${e.port.name} ${e.port.state}`);
    listMIDIDevices();
  };
}

function onMIDIFailure() {
  console.log('Could not access MIDI devices.');
}

function listMIDIDevices() {
  let inputs = midiAccess.inputs;
  let outputs = midiAccess.outputs;

  console.log('Available MIDI inputs:');
  inputs.forEach(input => console.log(input.name));

  console.log('Available MIDI outputs:');
  outputs.forEach(output => console.log(output.name));
  
  // Store the outputs for use later in the script
  midiOutputs = Array.from(outputs.values());
}

// A simpler function to test sending MIDI data to a hardcoded device
function sendTestMIDIMessage() {
  if (midiOutputs.length > 0) {
    const output = midiOutputs[0];  // Use the first available output
    const status = 0xB0;  // MIDI Control Change message
    const controller = 1;  // Example CC controller number
    const value = 127;     // Example value

    output.send([status, controller, value]);
    console.log(`Sent MIDI message: CC${controller}, Value: ${value}`);
  } else {
    console.log('No available MIDI output devices to send data.');
  }
}

// Call the test MIDI function every 5 seconds to check the connection
setInterval(sendTestMIDIMessage, 5000);
