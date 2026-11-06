# 05 — Error States

The rule for every problem is the same: **the pond keeps running.** The fish never stop because of a hardware or connection problem. The page only shows a small, calm line of text, never a pop-up or a red error box.

## 1. Summary

| # | What goes wrong | What the user sees | What still works | How it recovers |
|---|---|---|---|---|
| E1 | Button cable (USB) unplugged | "Button not connected" | Fish follow the mouse, Space drops food | Plug it back in. The server finds it within ~2 s, and the line disappears. |
| E2 | ESP32 not plugged in when the server starts | "Button not connected" | The same as E1 | Plug it in. It is found within ~2 s. |
| E3 | Node server stops while the page is open | "Button not connected" | The same as E1 | Start the server. The page reconnects within ~2 s. |
| E4 | Page opened but the server is not running | The browser shows its own "can't connect" page | Nothing | Start the server, then reload the page. |
| E5 | Food limit reached (50 pieces) | Nothing new drops, no plop | Everything else | Pieces are eaten or fade away, which makes room again. |
| E6 | Sound blocked by the browser | No sound, mute icon shows muted | Everything else | The sound starts on the first click or key press. |
| E7 | A sound file fails to load | No sound for that file | Everything else, including the mute icon | Reload the page once the file is fixed. |
| E8 | Three.js cannot load (no internet, CDN down) | A plain dark-blue page with "The sea could not load. Check the internet connection and reload." | Nothing | Reload with internet. |
| E9 | The browser cannot draw 3D (WebGL off or not supported) | A plain dark-blue page with "This browser can't show the sea. Try the latest Chrome, Firefox or Safari." | Nothing | Use a supported browser. |
| E10 | Unknown text from the ESP32 (boot messages, noise) | Nothing | Everything | Ignored automatically. |
| E11 | Button bounces (one press reads as several) | Nothing unusual | Everything | Filtered by the ESP32's 50 ms debounce. |
| E12 | Another program is using the USB port (e.g. the PlatformIO serial monitor or an upload) | "Button not connected" | The same as E1 | Close the other program. The server takes the port within ~2 s. |

## 2. Details

### E1–E3, E12: "Button not connected"
- **Shown when** the page's WebSocket to the server is closed, **or** the server reports that the ESP32 is not connected.
- **Hidden when** the WebSocket is open **and** the server reports the ESP32 as connected.
- **On page load,** the line stays hidden for up to 2 seconds while the page connects, so it does not flash on a normal start. If the page is still not connected after 2 seconds, the line appears.
- The page retries the WebSocket every 2 seconds, and the server searches for the ESP32 every 2 seconds.
- Food already in the water carries on as normal.
- A press made while disconnected is lost. Presses are not saved up for later.

### E5: Food limit
- This is a normal limit, not really an error, and no message is shown.
- If a press finds room for only some pieces, those pieces drop with a plop.
- If there is no room at all, nothing drops and no plop plays.

### E6–E7: Sound
- Problems with sound never stop the visuals.
- If the ambient file fails but the plop works, or the other way round, the file that works still plays.

### E8–E9: The page cannot draw the sea
- These are the only problems where the pond cannot run.
- The message uses the same calm style: centred, small, light text on the plain blue background.

### Tab hidden
This is not an error, but the rule is listed here so it is easy to find. Feed messages are ignored while the tab is hidden, and all food is cleared when the tab is shown again. See [02_frontend.md](02_frontend.md) section 9.
