let encoderValue = 0;
let buttonPressed = false;

function setup() {
  createCanvas(400, 200);

  // Poll the server every 100 milliseconds to get the latest encoder data
  setInterval(fetchEncoderData, 100);
}

function draw() {
  background(220);

  // Display the encoder value
  textSize(32);
  fill(0);
  text('Encoder Value: ' + encoderValue, 10, 50);

  // Display the button state
  if (buttonPressed) {
    fill(255, 0, 0);
    text('Button Pressed!', 10, 100);
  } else {
    fill(0);
    text('Button Not Pressed', 10, 100);
  }
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
