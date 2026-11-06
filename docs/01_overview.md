# Overview — Dreamy Fish Pond

## 1. What is it, in one sentence?
A calm website where white fish swim in the middle of the sea, follow your mouse, and eat food that falls when you press a button.

## 2. Who uses it, and what do they do?
One person who wants to relax. They move the mouse around the sea and press the Freenove button to give the fish food.

## 3. What does it notice: a press, a scan, a booking, a reading?
Where the mouse is, and a press of the Freenove button.

## 4. What does it do back, and where: on a screen, with a light, with a gate?
On the screen. The fish slowly swim toward the mouse. When the button is pressed, food falls from where the mouse is, and the fish swim to it and eat it.

## 5. What does the screen show before anyone does anything?
A dreamy blue sea with soft light, and white fish swimming slowly around by themselves. A small line says "Move your mouse, press the button to feed."

## 6. What are the numbers? How close, how long, how many.
There are 5 fish. One press drops about 10 pieces of food. The food takes about 3 seconds to sink. If no fish eats a piece, it disappears after 5 seconds. There can be at most 50 pieces of food on the screen.

## 7. What turns it on, and what turns it off again?
The fish start following when the mouse moves over the sea. When the mouse leaves the page, they go back to swimming around by themselves. Food falls only when the button is pressed.

## 8. What happens if a second person uses it while it is already running?
There is only one mouse and one button, so they just take turns. If someone presses the button again, more food falls.

## 9. What happens when something goes wrong, such as the connection dropping?
If the button cable is unplugged, a small line says "Button not connected". The fish still follow the mouse. When the cable is plugged back in, the button works again.

## 10. Does it keep anything after it is switched off?
No. Every time the page opens, the sea starts fresh with 5 fish and no food.

---

## 11. Answers added after the questions

### Hardware and connection
- **Board:** A Freenove **ESP32-S3**, plugged into the computer with a USB cable.
- **Button pin:** **Pin 14**, the same as in the esp32-starter button exercise. It is one setting in the ESP32 program. The button is wired between the pin and GND and uses the internal pull-up.
- **ESP32 program:** An **Arduino sketch built with PlatformIO**, the same tools as the class exercises. (MicroPython was the first plan, but the board already used PlatformIO.)
- **From button to page:** A small **Node.js server** reads the USB serial port and sends each press to the page over a **WebSocket**. The same server also serves the web page.
- **Finding the port:** The server **finds the ESP32's USB port automatically** and finds it again after the cable is plugged back in.
- **Two tabs open:** Every press goes to **every open page**. Each page has its own sea.
- **Server stopped:** The page shows the same line, **"Button not connected"**. The fish keep going, and the page tries to reconnect **every 2 seconds**.

### Look
- **View:** Drawn in **3D with Three.js**, with the camera looking **straight down** into the water, like looking into a pond.
- **Fish:** **Soft, glowing, see-through white shapes** rather than realistic fish.
- **Food:** **Small warm glowing dots** in pale orange or gold.
- **Ripples:** A soft ripple spreads where food drops and where a fish eats a piece.
- **Hint line:** Shown until the **first food drop**, then it fades out. It comes back when the page is reloaded.

### How the fish behave
- **Mouse first:** While the mouse is over the sea, the fish follow the mouse. A fish leaves the mouse only to take a **small detour**: if a piece of food that has landed is within **10% of the screen width** of it, it swims over, eats it, and goes back to the mouse.
- **Mouse off the page:** If there is food, the fish **swim to the nearest piece and eat it**. If there is none, they swim around by themselves.
- **Around the mouse:** The fish gather in a **loose circle** around the cursor and keep some space from each other.
- **Speed and distances ("Calm"):** A fish takes about **8 seconds** to swim across the screen. It eats a piece when it is within **3% of the screen width** of it, and it stops about **5% of the screen width** short of the mouse so it does not sit on the cursor.
- **Eating:** Each fish goes for the piece nearest to it. The first fish to reach a piece eats it, and that piece disappears.
- **When fish can eat:** Only **after the piece has landed**. Fish cannot catch food while it is still sinking.
- **Growing:** Each piece a fish eats makes it **2% bigger**, up to **1.5 times** its starting size. Sizes start fresh every time the page opens.

### Food
- **Where it falls:** At the mouse. If the mouse is off the page, food falls at the **last place the mouse was over the sea**. If the mouse has never been over the sea, it falls at the centre.
- **Spread:** The ~10 pieces land in a **small cluster** within **5% of the screen width** of the drop spot, and drift a little as they sink.
- **Timing:** A piece sinks for about **3 seconds**, then rests on the bottom for **5 seconds**. If nobody eats it, it disappears. The 5 seconds start **when it lands**.
- **The 50-piece limit:** If a press would go over 50, **only the pieces that fit are dropped**.
- **Holding the button:** Food drops when the button goes down, then **once every second while it is held**, until the 50-piece limit is reached.
- **Keyboard:** **Space** works exactly like the button, including holding it down. This is useful for testing without the ESP32.

### Sound and controls
- **Sound:** A soft water sound plays all the time, and a gentle **plop** plays when food drops. The sounds are **free, royalty-free sounds** (for example from freesound.org), credited in the project.
- **Starting the sound:** Browsers block sound until the user clicks or presses a key, and the ESP32 button does not count. The sound therefore starts on the **first click or key press anywhere on the page**.
- **Mute:** A **small, faint speaker icon** in a corner turns the sound on and off. There are no other controls on the screen.

### Where it runs
- **Device:** A **desktop or laptop with a mouse**. Touch screens are not supported.
- **Browsers:** It must work in **Chrome, Firefox and Safari**.
- **Internet:** An internet connection is fine. Three.js may load from a CDN.
- **Setup:** Plain HTML, CSS and JavaScript files served by the Node server, with **no build step**.
- **Hidden tab:** When the tab is hidden, the fish, timers and sound **pause**. When the tab comes back, **all food is cleared**. Button presses made while the tab is hidden are ignored.

### Who reads these documents
These documents are for **the student who builds the project and the teacher who grades the plan**. They should be clear and easy to read, without going down to code.
