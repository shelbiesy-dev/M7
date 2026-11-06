# 03 — Backend

The backend has two parts:

1. **The ESP32 program** (Arduino C++, built and uploaded with PlatformIO). It watches the button and reports presses over the USB cable.
2. **The Node.js server.** It serves the web page, reads the USB serial port, and passes presses on to every open page.

The backend stores nothing. Nothing is saved between runs.

## 1. Wiring

| From | To |
|---|---|
| One leg of the push button | ESP32 **pin 14** (the same wiring as the esp32-starter button exercise) |
| Other leg of the push button | ESP32 **GND** |
| ESP32 USB port | Computer USB port |

- The pin uses the ESP32's **internal pull-up**, so no extra resistor is needed.
- The pin reads *high* when the button is up and *low* when it is pressed.
- The pin number is a single setting (`BUTTON_PIN`) at the top of the ESP32 program, so it is easy to change if the button moves.

## 2. ESP32 program (PlatformIO, Arduino)

### What it does
1. Starts when the ESP32 powers on and sends a short **hello** line, so the server knows the board is ready.
2. Checks the button many times a second.
3. **Debounce:** It treats the button as pressed only once it has stayed down for about 50 ms. This stops a single press from counting twice.
4. When the button goes down, it sends one **feed** line at once.
5. While the button stays down, it sends another **feed** line **every 1 second**.
6. When the button is released, it stops sending, and the next press starts again from step 4.

### Notes
- The ESP32 does not know about the 50-piece limit. It only reports presses, and the page decides how much food fits.
- Messages are plain text lines over USB serial at 115200 baud. The exact words are in [06_tech_spec.md](06_tech_spec.md).
- The ESP32 may print other lines at start-up, such as boot messages. The server ignores any line it does not recognise.

## 3. Node.js server

### Jobs
1. **Serve the page.** It sends the HTML, CSS, JavaScript and sound files to the browser at `http://localhost:3000`.
2. **Find the ESP32.** It looks through the computer's USB serial devices for one that matches the ESP32's USB chip (the CH340 or CP210x used on Freenove boards) and opens it.
3. **Read presses.** It reads text lines from the port. For every **feed** line, it sends a feed message to all connected pages.
4. **Report status.** It tells every page whether the button is connected:
   - It sends **connected** when the port opens.
   - It sends **not connected** when the port closes or cannot be found.
   - A page that connects later is told the current status straight away.
5. **Reconnect.** If the cable is unplugged, it searches for the ESP32 again **every 2 seconds** and reopens the port as soon as the board is back.

### Several pages
- Any number of tabs or windows can be connected at once.
- Every feed message goes to **all** of them, and each page runs its own sea.

### What the server does not do
- It does not count food, move fish or apply any limits. All of that happens in the page.
- It does not save anything.
- It does not need a login, and it only needs to be used on the same computer.

### Start-up order
The parts can be started in any order:
- If the server starts without the ESP32, it keeps searching.
- If the page opens before the server, the page keeps retrying.
- If the ESP32 is plugged in later, it is found within about 2 seconds.

## 4. Log messages (in the terminal)

The server prints short lines so you can see what is happening:

- Server started, with the address to open.
- ESP32 found, with the port name.
- ESP32 disconnected, searching again.
- Page connected or disconnected, with how many pages are open.
- Feed received.
