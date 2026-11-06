// Connection to the Node server (docs/02_frontend.md §10, docs/05_error_states.md).
//
// Messages from the server:
//   {"type":"feed"}                               drop food
//   {"type":"status","button":"connected"}        the ESP32 is plugged in
//   {"type":"status","button":"disconnected"}     the ESP32 is not plugged in
//
// The page shows "Button not connected" unless the WebSocket is open AND the
// button is connected. It stays quiet for the first 2 s so a normal start
// doesn't flash the message.

import { SETTINGS } from './settings.js';

export function createConnection({ onFeed, onStatusChange }) {
  let socket = null;
  let socketOpen = false;
  let buttonConnected = false;
  let graceOver = false;

  function report() {
    const ok = socketOpen && buttonConnected;
    // during the grace time, only an "all good" is shown
    onStatusChange(ok || !graceOver ? 'ok' : 'not-connected');
  }

  function connect() {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      socket = new WebSocket(`${scheme}://${location.host}`);
    } catch {
      setTimeout(connect, SETTINGS.reconnectEveryMs);
      return;
    }

    socket.addEventListener('open', () => {
      socketOpen = true;
      report();
    });

    socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'feed') {
        onFeed();
      } else if (message.type === 'status') {
        buttonConnected = message.button === 'connected';
        report();
      }
    });

    socket.addEventListener('close', () => {
      socketOpen = false;
      buttonConnected = false;
      report();
      setTimeout(connect, SETTINGS.reconnectEveryMs);   // try again every 2 s
    });

    socket.addEventListener('error', () => {
      // 'close' always follows, which schedules the retry
    });
  }

  setTimeout(() => { graceOver = true; report(); }, SETTINGS.notConnectedGraceMs);
  connect();
  report();
}
