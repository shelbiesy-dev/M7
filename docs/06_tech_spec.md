# 06 — Tech Spec

## 1. Tools and versions

| Part | Choice |
|---|---|
| Board | Freenove ESP32-S3 (WROOM) with one push button |
| Board program | Arduino C++, built and uploaded with PlatformIO (board `esp32-s3-devkitc-1`) |
| Server | Node.js, current LTS version |
| Server libraries | `express` (serves the files), `ws` (WebSocket), `serialport` (USB serial) |
| 3D drawing | Three.js, loaded from a CDN (jsDelivr) through an import map |
| Page | Plain HTML, CSS and JavaScript modules, with no build step |
| Browsers | Latest desktop Chrome, Firefox and Safari |
| Sounds | Royalty-free files from a free library (e.g. freesound.org), credited in the project |

## 2. Project folders

```
ExtraClass_2/
├── docs/                 the planning documents (this folder)
├── firmware/
│   ├── platformio.ini    board settings for PlatformIO
│   └── src/main.cpp      the ESP32 program
├── server/
│   ├── package.json
│   └── server.js         the Node.js server
└── public/               files sent to the browser
    ├── index.html
    ├── style.css
    ├── js/               the page's JavaScript modules (scene, fish, food, sound, connection)
    └── sounds/
        ├── ambient.mp3   (to add: the library sound; until then ambient.wav, a placeholder, is used)
        ├── plop.mp3      (to add: the library sound; until then plop.wav, a placeholder, is used)
        └── CREDITS.md    the source, author and licence of each sound
```

## 3. Messages

### ESP32 → server (USB serial, 115200 baud, one text line each)

| Line | Meaning |
|---|---|
| `HELLO` | The board has started and is ready. |
| `FEED` | Drop food. Sent once when the button goes down, then once every second while it is held. |

The server ignores every other line.

### Server → page (WebSocket, JSON text)

| Message | Meaning |
|---|---|
| `{"type":"feed"}` | Drop food now. |
| `{"type":"status","button":"connected"}` | The ESP32 is connected. |
| `{"type":"status","button":"disconnected"}` | The ESP32 is not connected. |

- A page receives the current status as soon as it connects.
- The page sends nothing to the server.

## 4. Addresses and settings

| Setting | Value |
|---|---|
| Page address | `http://localhost:3000` |
| WebSocket address | `ws://localhost:3000` (same server) |
| Serial speed | 115200 baud |
| USB chips searched for | CH340/CH343 (vendor ID 1a86), CP210x (vendor ID 10c4), and Espressif native USB on ESP32-S3 boards (vendor ID 303a) |
| Search / reconnect interval | 2 s, for both the server → ESP32 and the page → server |
| Button pin | 14 (a single setting, `BUTTON_PIN`, in `firmware/src/main.cpp`) |
| Debounce | 50 ms |
| Hold repeat | 1 s |

## 5. Numbers for the pond

All distances are a share of the **screen width**.

| Name | Value |
|---|---|
| Number of fish | 5 |
| Fish speed | Crosses the screen in ~8 s |
| Distance kept from the mouse | ~5% (loose circle) |
| Detour range while following | 10% |
| Eat distance | 3% |
| Growth per piece eaten | +2% of starting size |
| Largest size | 1.5 × starting size |
| Pieces per drop | ~10 (only as many as fit under the limit) |
| Drop spread | Within 5% |
| Sink time | ~3 s (cannot be eaten) |
| Time on the bottom | 5 s (fades during the last 1 s) |
| Food limit | 50 pieces (sinking + landed) |
| Drop ripple | Fades over ~1.5 s |
| Hint fade-out | ~1 s after the first drop |
| "Not connected" grace time on load | 2 s |

These numbers should be kept together in one settings section of the page code, so they can be tuned in one place.

## 6. How it will be run

1. Upload the ESP32 program: open the `firmware` folder with PlatformIO and click **Upload** (or run `pio run -t upload` in `firmware/`). Stop the server first, and close the serial monitor afterwards, because only one program can use the USB port at a time.
2. In `server/`, install the libraries, then start the server.
3. Open `http://localhost:3000` in Chrome, Firefox or Safari.
4. Click once anywhere to start the sound.

## 7. Limits and choices

- **Local only:** The server is meant for one computer and has no login or security.
- **Nothing saved:** There is no database, no local storage and no cookies.
- **Internet:** It needs internet to load Three.js from the CDN. If the project later has to work offline, Three.js can be installed locally instead.
- **Desktop only:** There is no touch support.
- **Smoothness:** The aim is a smooth 60 frames per second on a normal laptop. With 5 fish and at most 50 food pieces, the scene is small.
