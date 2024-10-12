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




// //import express
// const express = require('express');
// const app = express();
// const portNumber = 3000;

// // Serve static files from 'public'
// app.use(express.static('public'));

// //import serial port
// const { SerialPort, ReadlineParser } = require('serialport');

// // Initialize the serial port (make sure the path and baud rate are correct for your setup)
// const port = new SerialPort({
//   path: '/dev/cu.usbmodem21201', // Replace with your correct port (e.g., 'COM3' on Windows)
//   baudRate: 115200,
// });

// // Create a Readline parser to handle incoming serial data
// const parser = new ReadlineParser();
// port.pipe(parser);

// // Handle incoming data from Arduino
// parser.on('data', (data) => {
//   console.log(`Received data from Arduino: ${data}`);
// });

// // Send a command to Arduino via a web endpoint
// app.get('/send-command', (req, res) => {
//   const command = req.query.command || 'LED_ON';
//   console.log(`Sending command to Arduino: ${command}`);

//   port.write(`${command}\n`, (err) => {
//     if (err) {
//       return res.status(500).send(`Error writing to port: ${err.message}`);
//     }
//     res.send(`Command "${command}" sent to Arduino`);
//   });
// });

// // Start the server
// app.listen(portNumber, () => {
//   console.log(`Server is running on http://localhost:${portNumber}`);
// });








// //Import express
// let express = require('express');

// // Create the Express app
// let app = express();

// // Set the port used for server traffic.
// let port = 3000;

// // Middleware to serve static files from 'public' directory
// app.use(express.static('public'));

// //Step 3 code goes here
// //Initialize file system module
// // Middleware to serve static files from 'songs' directory
// // Middleware for parsing JSON files
// // API endpoint to get songs folder
// // File directory endpoint to get list of file names
// // Read file names into a JSON object - throw error otherwise

// //Run server at port
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
