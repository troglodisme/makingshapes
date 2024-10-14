#include "Adafruit_seesaw.h"

#define SS_SWITCH 24  // All encoders share the same SS_SWITCH pin
#define SEESAW_ADDR1 0x36
#define SEESAW_ADDR2 0x37
#define SEESAW_ADDR3 0x38
#define SEESAW_ADDR4 0x3A

Adafruit_seesaw ss1, ss2, ss3, ss4;

int32_t encoder_position1, encoder_position2, encoder_position3, encoder_position4;  // Current encoder positions
int encoder_value1 = 0, encoder_value2 = 0, encoder_value3 = 0, encoder_value4 = 0;  // Values mapped to 0-127
int button_state1 = 1, button_state2 = 1, button_state3 = 1, button_state4 = 1;      // Initial button states (1 = not pressed, 0 = pressed)

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

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
  // Read button states and encoder values
  button_state1 = checkButton(ss1);
  button_state2 = checkButton(ss2);
  button_state3 = checkButton(ss3);
  button_state4 = checkButton(ss4);

  readEncoder(ss1, encoder_position1, encoder_value1);
  readEncoder(ss2, encoder_position2, encoder_value2);
  readEncoder(ss3, encoder_position3, encoder_value3);
  readEncoder(ss4, encoder_position4, encoder_value4);

  // Print encoder values as an array
  Serial.print("encoderValues = [");
  Serial.print(encoder_value1);
  Serial.print(", ");
  Serial.print(encoder_value2);
  Serial.print(", ");
  Serial.print(encoder_value3);
  Serial.print(", ");
  Serial.print(encoder_value4);
  Serial.println("]");

  // Print button states as an array
  Serial.print("buttonStates = [");
  Serial.print(button_state1);
  Serial.print(", ");
  Serial.print(button_state2);
  Serial.print(", ");
  Serial.print(button_state3);
  Serial.print(", ");
  Serial.print(button_state4);
  Serial.println("]");

  delay(100);  // Adjust delay as necessary
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

  // did we move around?
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
