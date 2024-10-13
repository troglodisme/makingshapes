

const express = require('express');
const { SerialPort, ReadlineParser } = require('serialport');  // Import SerialPort and ReadlineParser

const app = express();
const portNumber = 3000;

let encoderValue = 0;
let buttonPressed = false;

// Initialize serial port correctly
const port = new SerialPort({
  path: '/dev/cu.usbmodem21201', // Replace with your correct port (e.g., 'COM3' on Windows)
  baudRate: 115200,
});

// Create a parser to handle the incoming serial data
const parser = new ReadlineParser();
port.pipe(parser);  // Pipe the serial data to the parser

// Serve static files (like your p5.js sketch) from the 'public' directory
app.use(express.static('public'));

// Read serial data and store the encoder value and button state
parser.on('data', (data) => {
  console.log(`Data from Arduino: ${data}`);

  if (data.includes('Button pressed!')) {
    buttonPressed = true;
  } else {
    encoderValue = parseInt(data.trim(), 10);  // Parse the encoder value from the serial data
    buttonPressed = false;
  }
});

// Create an endpoint to send the encoder data to p5.js
app.get('/encoder-data', (req, res) => {
  res.json({
    encoderValue,
    buttonPressed
  });
});

// Start the server
app.listen(portNumber, () => {
  console.log(`Server running at http://localhost:${portNumber}`);
});

