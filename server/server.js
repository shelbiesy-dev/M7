// Dreamy Fish Pond — Node.js server
//
// Jobs (see docs/03_backend.md):
//   1. Serve the page (public/) at http://localhost:3000
//   2. Find the ESP32 on USB serial automatically
//   3. Read "FEED" lines and send {"type":"feed"} to every open page
//   4. Tell every page whether the button is connected
//   5. Search again every 2 s after the cable is unplugged
//
// The server keeps no state between runs and applies no game rules.

import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { SerialPort, ReadlineParser } from 'serialport';

// ---------- Settings (docs/06_tech_spec.md §4) ----------
const HTTP_PORT = 3000;
const BAUD_RATE = 115200;
const SEARCH_EVERY_MS = 2000;
// USB-to-serial chips used on Freenove ESP32 boards:
//   1a86 = WCH CH340 / CH343, 10c4 = Silicon Labs CP210x, 303a = Espressif native USB (ESP32-S3)
const ESP32_VENDOR_IDS = ['1a86', '10c4', '303a'];

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', 'public');

function log(message) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${message}`);
}

// ---------- 1. Serve the page ----------
const app = express();
app.use(express.static(publicDir));
const httpServer = createServer(app);

// ---------- WebSocket: pages ----------
const wss = new WebSocketServer({ server: httpServer });
let buttonConnected = false;

function statusMessage() {
  return JSON.stringify({ type: 'status', button: buttonConnected ? 'connected' : 'disconnected' });
}

function broadcast(text) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(text);
  }
}

function setButtonConnected(value) {
  if (value === buttonConnected) return;
  buttonConnected = value;
  broadcast(statusMessage());
}

wss.on('connection', (socket) => {
  // A page that connects later is told the current status straight away.
  socket.send(statusMessage());
  log(`Page connected (${wss.clients.size} open)`);
  socket.on('close', () => log(`Page disconnected (${wss.clients.size} open)`));
  socket.on('error', () => {}); // a page closing abruptly is not a server problem
});

// ---------- 2–5. ESP32 over USB serial ----------
let port = null;          // the open SerialPort, or null while searching
let searching = false;
let lastOpenError = '';   // so a busy port is logged once, not every 2 s
let saidSearching = false;

function handleLine(raw) {
  const line = raw.trim();
  if (line === 'FEED') {
    log('Feed received');
    broadcast(JSON.stringify({ type: 'feed' }));
  } else if (line === 'HELLO') {
    log('ESP32 says hello (ready)');
  }
  // Every other line (MicroPython boot text, noise) is ignored — E10.
}

function openPort(portPath) {
  return new Promise((resolve) => {
    const serial = new SerialPort({ path: portPath, baudRate: BAUD_RATE, autoOpen: false });

    serial.open((err) => {
      if (err) {
        // E12: another program (e.g. Thonny) may be holding the port.
        const message = `Found ESP32 at ${portPath} but could not open it (${err.message}). ` +
          'Is another program such as Thonny using it? Retrying every 2 s.';
        if (message !== lastOpenError) log(message);
        lastOpenError = message;
        resolve();
        return;
      }

      lastOpenError = '';
      saidSearching = false;
      port = serial;
      // Release DTR/RTS so the ESP32's auto-reset circuit lets the board run normally.
      serial.set({ dtr: false, rts: false }, () => {});
      log(`ESP32 found on ${portPath}`);
      setButtonConnected(true);

      const parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));
      parser.on('data', handleLine);

      serial.on('close', () => {
        port = null;
        log('ESP32 disconnected, searching again');
        setButtonConnected(false);
      });
      serial.on('error', (e) => log(`Serial error: ${e.message}`));
      resolve();
    });
  });
}

async function searchForEsp32() {
  if (port || searching) return;
  searching = true;
  try {
    const ports = await SerialPort.list();
    const found = ports.find(
      (p) => p.vendorId && ESP32_VENDOR_IDS.includes(p.vendorId.toLowerCase())
    );
    if (found) {
      // On macOS, the "cu." device opens without waiting for a carrier signal.
      const portPath = process.platform === 'darwin'
        ? found.path.replace('/dev/tty.', '/dev/cu.')
        : found.path;
      await openPort(portPath);
    } else if (!saidSearching) {
      log('ESP32 not found yet, searching every 2 s');
      saidSearching = true;
    }
  } catch (e) {
    log(`Could not list serial ports: ${e.message}`);
  } finally {
    searching = false;
  }
}

// ---------- Start ----------
httpServer.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    log(`Port ${HTTP_PORT} is already in use. Is the server already running in another terminal?`);
  } else {
    log(`Server error: ${e.message}`);
  }
  process.exit(1);
});

httpServer.listen(HTTP_PORT, () => {
  log(`Dreamy Fish Pond is running — open http://localhost:${HTTP_PORT}`);
  searchForEsp32();
  setInterval(searchForEsp32, SEARCH_EVERY_MS);
});

function shutdown() {
  log('Stopping');
  for (const client of wss.clients) client.terminate();
  if (port && port.isOpen) port.close(() => process.exit(0));
  else process.exit(0);
  setTimeout(() => process.exit(0), 500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
