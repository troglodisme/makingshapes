const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort, ReadlineParser } = require('serialport');

const app = express();
const server = http.createServer(app);
const io = new Server(server);  // Initialize socket.io

const portNumber = 3000;
app.use(express.static('public'));

const { WebMidi } = require("webmidi");

// List available serial ports
SerialPort.list().then(
  ports => {
    console.log('Available serial ports:');
    ports.forEach(port => {
      console.log(`${port.path} - ${port.manufacturer}`);
    });

    const selectedPortPath = '/dev/tty.usbmodem21401';  // Change this to your specific port
    const portExists = ports.some(port => port.path === selectedPortPath);

    if (!portExists) {
      console.log(`The serial port ${selectedPortPath} is not available. Server will continue without serial communication.`);
      return;
    }

    // Establish a serial connection
    console.log(`Attempting to connect to port: ${selectedPortPath}`);
    const port = new SerialPort({ path: selectedPortPath, baudRate: 115200 }, function (err) {
      if (err) {
        return console.log('Error: ', err.message);
      }
    });

    port.write('main screen turn on', function (err) {
      if (err) {
        return console.log('Error on write: ', err.message);
      }
      console.log('message written');
    });

    // Pipe the data into another stream (like a parser or standard out)
    const parser = new ReadlineParser();
    port.pipe(parser);

    parser.on('data', function (line) {
      // Expecting single line output from Arduino, split by ';'
      try {
        line = line.trim();  // Remove any trailing whitespace

        // Matching the pattern "key = [value1, value2, ...];"
        const parts = line.match(/switchStates\s*=\s*\[.*?\];|buttonStates\s*=\s*\[.*?\];|encoderValues\s*=\s*\[.*?\];|matrixStates\s*=\s*\[.*?\];/g);

        if (parts && parts.length === 4) {
          const switchStates = parts[0].match(/\d+/g).map(Number);  // Extract digits and convert to numbers
          const buttonStates = parts[1].match(/\d+/g).map(Number);
          const encoderValues = parts[2].match(/\d+/g).map(Number);
          const matrixStates = parts[3].match(/\d+/g).map(Number);

          console.log(`Switch States: ${switchStates}`);
          console.log(`Button States: ${buttonStates}`);
          console.log(`Encoder Values: ${encoderValues}`);
          console.log(`Matrix States: ${matrixStates}`);

          // Emit all data to the front end
          io.emit('serialData', {
            switchStates,
            buttonStates,
            encoderValues,
            matrixStates
          });
        } else {
          console.log('Unexpected data format:', line);
        }
      } catch (error) {
        console.log('Error parsing incoming data:', error);
      }
    });
  },
  err => {
    console.error('Error listing ports: ', err);
    console.log('Server will continue without serial communication.');
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

//webmidi

WebMidi
  .enable()
  .then(onEnabled)
  .catch(err => alert(err)); 

function onEnabled() {
  
  // Inputs
  WebMidi.inputs.forEach(input => console.log("Input:", input.manufacturer, input.name));
  
  // Outputs
  WebMidi.outputs.forEach(output => console.log("Output:", output.manufacturer, output.name));

}
