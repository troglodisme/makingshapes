#include <Wire.h>
#include "Adafruit_Trellis.h"
#include "Adafruit_seesaw.h"

// Trellis setup
#define MOMENTARY 0
#define LATCHING 1

// Boolean to control whether notes stay on or are temporary, controlled by GPIO 20
bool areNotesStayingOn = true;

// Another boolean state controlled by GPIO 21
bool switchState = false;

// Trellis setup
Adafruit_Trellis matrix0 = Adafruit_Trellis();
Adafruit_TrellisSet trellis = Adafruit_TrellisSet(&matrix0);
#define NUMTRELLIS 1
#define numKeys (NUMTRELLIS * 16)
#define INTPIN A2

bool matrixStates[numKeys] = {0};  // Array to store the state of each Trellis button (pressed or not)

// Seesaw encoder setup
#define SS_SWITCH 24  // All encoders share the same SS_SWITCH pin

#define SEESAW_ADDR1 0x3A
#define SEESAW_ADDR2 0x38
#define SEESAW_ADDR3 0x36
#define SEESAW_ADDR4 0x37

Adafruit_seesaw ss1, ss2, ss3, ss4;

int32_t encoder_position1, encoder_position2, encoder_position3, encoder_position4;  // Current encoder positions
int encoder_value1 = 0, encoder_value2 = 0, encoder_value3 = 0, encoder_value4 = 0;  // Values mapped to 0-127
int button_state1 = 1, button_state2 = 1, button_state3 = 1, button_state4 = 1;      // Initial button states (1 = not pressed, 0 = pressed)

// GPIO switches
int switchStates[2] = {0, 0};  // Array to store the state of the two GPIO switches
#define SWITCH_PIN_1 4  // GPIO 4, controls areNotesStayingOn
#define SWITCH_PIN_2 5  // GPIO 5, controls switchState

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  // Setup GPIO pins for the switches
  pinMode(SWITCH_PIN_1, INPUT_PULLUP);
  pinMode(SWITCH_PIN_2, INPUT_PULLUP);

  // Trellis setup
  Serial.println("Trellis and Encoder Demo");
  pinMode(INTPIN, INPUT);
  digitalWrite(INTPIN, HIGH);
  trellis.begin(0x70);

  for (uint8_t i = 0; i < numKeys; i++) {
    trellis.setLED(i);
    trellis.writeDisplay();
    delay(50);
  }
  for (uint8_t i = 0; i < numKeys; i++) {
    trellis.clrLED(i);
    trellis.writeDisplay();
    delay(50);
  }

  // Seesaw encoder setup
  if (!ss1.begin(SEESAW_ADDR1) || !ss2.begin(SEESAW_ADDR2) || !ss3.begin(SEESAW_ADDR3) || !ss4.begin(SEESAW_ADDR4)) {
    Serial.println("Couldn't find all seesaws");
    while (1) delay(10);
  }

  setupEncoder(ss1, encoder_position1, 4991);
  setupEncoder(ss2, encoder_position2, 4991);
  setupEncoder(ss3, encoder_position3, 4991);
  setupEncoder(ss4, encoder_position4, 4991);
}

void loop() {
  delay(30);  // Necessary delay for the trellis

  // Trellis input handling
  if (trellis.readSwitches()) {
    for (uint8_t i = 0; i < numKeys; i++) {
      if (trellis.justPressed(i)) {
        if (!areNotesStayingOn) {
          trellis.setLED(i);  // Momentary: turn on when pressed
        }

        // Latching mode: Toggle the LED and update the state array
        if (areNotesStayingOn) {
          if (trellis.isLED(i)) {
            trellis.clrLED(i);  // Turn off the LED
            matrixStates[i] = 0;  // Track state as off
          } else {
            trellis.setLED(i);  // Turn on the LED
            matrixStates[i] = 1;  // Track state as on
          }
        } else {
          matrixStates[i] = 1;  // Momentary: Mark as pressed
        }

        trellis.writeDisplay();
      }

      // For momentary mode, turn off the LED when released
      if (!areNotesStayingOn && trellis.justReleased(i)) {
        trellis.clrLED(i);
        matrixStates[i] = 0;  // Mark as released
        trellis.writeDisplay();
      }
    }
  }

  // Read switch states
  switchStates[0] = digitalRead(SWITCH_PIN_1);  // Read GPIO 20
  switchStates[1] = digitalRead(SWITCH_PIN_2);  // Read GPIO 21

  // Update areNotesStayingOn based on the first switch (GPIO 20)
  areNotesStayingOn = (switchStates[0] == LOW);

  // Update switchState based on the second switch (GPIO 21)
  switchState = (switchStates[1] == LOW);

  // Seesaw encoder and button handling
  button_state1 = checkButton(ss1);
  button_state2 = checkButton(ss2);
  button_state3 = checkButton(ss3);
  button_state4 = checkButton(ss4);

  readEncoder(ss1, encoder_position1, encoder_value1);
  readEncoder(ss2, encoder_position2, encoder_value2);
  readEncoder(ss3, encoder_position3, encoder_value3);
  readEncoder(ss4, encoder_position4, encoder_value4);

  // multi line serial

  // Serial.print("switchStates = [");
  // Serial.print(switchStates[0]); Serial.print(", ");
  // Serial.print(switchStates[1]); Serial.println("]");

  // Serial.print("buttonStates = [");
  // Serial.print(button_state1); Serial.print(", ");
  // Serial.print(button_state2); Serial.print(", ");
  // Serial.print(button_state3); Serial.print(", ");
  // Serial.print(button_state4); Serial.println("]");

  // Serial.print("encoderValues = [");
  // Serial.print(encoder_value1); Serial.print(", ");
  // Serial.print(encoder_value2); Serial.print(", ");
  // Serial.print(encoder_value3); Serial.print(", ");
  // Serial.print(encoder_value4); Serial.println("]");

  // Serial.print("matrixStates = [");
  // for (uint8_t i = 0; i < numKeys; i++) {
  //   Serial.print(matrixStates[i]);
  //   if (i < numKeys - 1) {
  //     Serial.print(", ");
  //   }
  // }
  // Serial.println("]");


// single line serial
Serial.print("switchStates = [");
Serial.print(switchStates[0]); Serial.print(", ");
Serial.print(switchStates[1]); Serial.print("];");

Serial.print("buttonStates = [");
Serial.print(button_state1); Serial.print(", ");
Serial.print(button_state2); Serial.print(", ");
Serial.print(button_state3); Serial.print(", ");
Serial.print(button_state4); Serial.print("];");

Serial.print("encoderValues = [");
Serial.print(encoder_value1); Serial.print(", ");
Serial.print(encoder_value2); Serial.print(", ");
Serial.print(encoder_value3); Serial.print(", ");
Serial.print(encoder_value4); Serial.print("];");

Serial.print("matrixStates = [");
for (uint8_t i = 0; i < numKeys; i++) {
  Serial.print(matrixStates[i]);
  if (i < numKeys - 1) {
    Serial.print(", ");
  }
}
Serial.println("];");


  delay(25);  // Adjust delay as necessary
}

void setupEncoder(Adafruit_seesaw& ss, int32_t& encoder_position, int expectedVersion) {
  uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);
  if (version != expectedVersion) {
    Serial.print("Wrong firmware loaded? ");
    Serial.println(version);
    while (1) delay(10);
  }
  Serial.print("Found Product ");
  Serial.println(expectedVersion);

  ss.pinMode(SS_SWITCH, INPUT_PULLUP);
  encoder_position = ss.getEncoderPosition();
  delay(10);
  ss.setGPIOInterrupts((uint32_t)1 << SS_SWITCH, 1);
  ss.enableEncoderInterrupt();
}

int checkButton(Adafruit_seesaw& ss) {
  return ss.digitalRead(SS_SWITCH);  // Return button state (0 if pressed, 1 if not pressed)
}

void readEncoder(Adafruit_seesaw& ss, int32_t& encoder_position, int& encoder_value) {
  int32_t new_position = ss.getEncoderPosition();

  // Did we move around?
  if (encoder_position != new_position) {
    int32_t delta = new_position - encoder_position;
    delta *= -2;  // Multiply delta by -1 to reverse direction and adjust faster movement

    // Adjust the encoder value and constrain it between 0 and 127
    encoder_value += delta;
    if (encoder_value < 0) {
      encoder_value = 0;
    } else if (encoder_value > 127) {
      encoder_value = 127;
    }

    encoder_position = new_position;  // Save new position for next iteration
  }
}
