#include <Arduino.h>

// Dreamy Fish Pond — ESP32 button program (docs/03_backend.md).
//
// Wiring (same as esp32-starter/03_button):
//   one leg of the push button -> pin 14
//   other leg                   -> GND
//   INPUT_PULLUP is used, so the pin reads HIGH when up and LOW when pressed.
//
// Sends one text line per event over USB serial (115200 baud):
//   HELLO  once at start-up
//   FEED   when the button goes down, then once every second while it is held

// ---------- Settings ----------
const int BUTTON_PIN = 14;                 // change this one number if the button moves
const unsigned long DEBOUNCE_MS = 50;      // the button must stay in a new state this long
const unsigned long REPEAT_MS = 1000;      // while held, send FEED again every second

bool stableDown = false;                   // the debounced state
bool lastRaw = false;                      // the most recent raw reading
unsigned long rawChangedAt = 0;
unsigned long nextRepeatAt = 0;

bool isDown() {
  return digitalRead(BUTTON_PIN) == LOW;
}

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(115200);
  delay(300);                              // let the USB serial settle after boot
  Serial.println("HELLO");

  stableDown = isDown();
  lastRaw = stableDown;
  rawChangedAt = millis();
}

void loop() {
  unsigned long now = millis();
  bool raw = isDown();

  // Restart the debounce timer whenever the raw reading flips.
  if (raw != lastRaw) {
    lastRaw = raw;
    rawChangedAt = now;
  }

  // Accept the new state only after it has been steady for DEBOUNCE_MS.
  if (raw != stableDown && now - rawChangedAt >= DEBOUNCE_MS) {
    stableDown = raw;
    if (stableDown) {
      Serial.println("FEED");
      nextRepeatAt = now + REPEAT_MS;
    }
  }

  // Holding the button keeps dropping food once a second.
  if (stableDown && (long)(now - nextRepeatAt) >= 0) {
    Serial.println("FEED");
    nextRepeatAt += REPEAT_MS;
  }

  delay(5);
}
