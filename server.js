const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort, ReadlineParser } = require('serialport');

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

    // Establish a serial connection
    const selectedPortPath = '/dev/cu.usbmodem11401';  // Change this to your specific port
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
      // console.log('Raw line:', line);
      const match = line.match(/\[([0-9, ]+)\]/);  // Match array inside the square brackets
      if (match) {
        const values = match[1].split(',').map(Number);  // Split and convert values to numbers
        if (values.length === 4) {
          const [value1, value2, value3, value4] = values;
          console.log(`Encoder 1: ${value1}, Encoder 2: ${value2}, Encoder 3: ${value3}, Encoder 4: ${value4}`);
          
          // Emit encoder values to the front end
          io.emit('encoderData', { value1, value2, value3, value4 });
        }
      }
    });
  },
  err => {
    console.error('Error listing ports: ', err);
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

