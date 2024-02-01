let images = [];
let numImages = 12;
let image10Visible = true;
let image3Animate = true; // Boolean to toggle animation of image 3
let image3X = 0; // Horizontal position of image 3
let image3Speed = 2; // Speed of image 3 animation
let toggleButton, toggleAnimationButton, speedSlider;

function preload() {
  for (let i = 0; i < numImages; i++) {
    images[i] = loadImage((i + 1) + '.png');
  }
}

function setup() {
  createCanvas(800, 480);

  toggleButton = createButton('Light');
  toggleButton.position(20, 500);
  toggleButton.mousePressed(toggleImage10);

  toggleAnimationButton = createButton('Toggle Animation');
  toggleAnimationButton.position(100, 500);
  toggleAnimationButton.mousePressed(toggleAnimation);

  speedSlider = createSlider(0, 5, 0.1, 0.1); // Min, Max, Default, Step
  speedSlider.position(220, 500);


}

function draw() {

  image3Speed = speedSlider.value(); // Get the current value of the slider

  for (let i = 0; i < images.length; i++) {
    if (images[i]) {
      if (i === 2 && image3Animate) { // Check if animation is enabled for image 3
        if (image3X > width) {
          image3X = -images[i].width;
        }
        image(images[i], image3X, 0);
        image3X += image3Speed;
      } else if (i !== 9 || image10Visible) {
        image(images[i], 0, 0);
      }
    }
  }
}

function toggleImage10() {
  image10Visible = !image10Visible;
  redraw();
}

function toggleAnimation() {
  image3Animate = !image3Animate;
  if (!image3Animate) {
    image3X = 0; // Reset position when animation is turned off
  }
  redraw();
}
