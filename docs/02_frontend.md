# 02 — Frontend

The frontend is the web page: the sea, the fish, the food, the sound, and the few small things written on the screen. It runs in the browser and draws everything with Three.js.

## 1. Screen layout

The sea fills the whole browser window. There are no scroll bars, menus or buttons, apart from the mute icon.

| Element | Where | What it looks like |
|---|---|---|
| Sea | Whole window | A dreamy blue, slightly darker toward the edges, with soft moving light patterns (caustics) on the bottom. |
| Fish (5) | In the water | Soft, glowing, see-through white shapes with a gentle tail sway. |
| Food | Falls from the drop spot | Small warm glowing dots, pale orange or gold. |
| Hint line | Bottom centre | Small, light text: "Move your mouse, press the button to feed." |
| Status line | Top centre | Small, light text: "Button not connected". Shown only when there is a problem. |
| Mute icon | Bottom right corner | A small, faint speaker icon that becomes clearer when the mouse is over it. |

If the window is resized, the sea fills the new size. All distances are measured as a share of the **screen width**, so the pond feels the same at every size.

## 2. The view

- The camera looks **straight down** into the water, like looking into a pond.
- There are three depths:
  - **Surface:** where food appears.
  - **Swimming level:** where the fish swim.
  - **Bottom:** where food comes to rest.
- When food sinks, it moves away from the viewer. It gets a little smaller and softer as it goes down.
- The mouse position is turned into a point on the water, so the fish and the food line up with the cursor.

## 3. Fish

### Look
- There are 5 fish. Each is a soft, glowing white shape: a rounded body that narrows into a tail.
- They are partly see-through and have a faint glow around them.
- The tail sways while the fish swims. It sways faster when the fish swims faster.
- Each fish starts at a slightly different size and position, so they do not look identical.

### Behaviour

Each fish is always doing one of four things:

| Behaviour | When | What the fish does |
|---|---|---|
| **Wander** | The mouse is off the page and there is no landed food | Swims slowly along gentle, curving paths and stays inside the sea. |
| **Follow** | The mouse is over the sea | Swims toward the mouse and settles in a loose circle around it, about 5% of the screen width from the cursor, keeping some space from the other fish. |
| **Detour** | Following, and a landed piece of food is within 10% of the screen width | Turns aside, eats the piece, then goes back to following. |
| **Chase** | The mouse is off the page and there is landed food | Swims to the nearest landed piece and eats it, then looks for the next one. |

- **Speed:** A calm pace, about 8 seconds to cross the screen. Fish speed up and slow down smoothly and never turn sharply.
- **Eating:** When a fish is within 3% of the screen width of a landed piece, it eats it. The piece disappears and a small ripple appears.
- **Shared targets:** Two fish may head for the same piece. The first to arrive eats it, and the other picks a new target.
- **Growing:** Each piece eaten makes the fish 2% bigger than its starting size, up to 1.5 times its starting size. After that it keeps eating but stops growing.
- **Edges:** Fish always stay inside the visible sea.

## 4. Food

- **Drop:** One press (or one repeat while the button is held) drops about 10 pieces.
- **Drop spot:**
  - Where the mouse is.
  - If the mouse is off the page: the last place the mouse was over the sea.
  - If the mouse has never been over the sea: the centre.
- **Spread:** The pieces land in a small cluster within 5% of the screen width of the drop spot, and drift slightly as they sink.
- **Life of one piece:**
  1. It appears at the surface, and a ripple spreads at the drop spot.
  2. It sinks for about 3 seconds. Fish cannot eat it yet.
  3. It rests on the bottom for 5 seconds, and fish can eat it.
  4. If nobody eats it, it fades out during its last second and disappears.
- **Limit:** At most 50 pieces at once, counting both sinking and landed pieces. If a press would go over 50, only the pieces that fit are dropped. If there is no room at all, nothing drops and no plop plays.
- Food always stays inside the visible sea.

## 5. Ripples

- **Drop ripple:** A soft ring spreads from the drop spot and fades over about 1.5 seconds.
- **Eat ripple:** A smaller ring spreads where a fish eats a piece.
- Ripples are only for looks. They do not change how the fish behave.

## 6. Text on the screen

- **Hint line:** "Move your mouse, press the button to feed."
  - It is shown when the page opens.
  - It fades out over about 1 second after the first food drop.
  - It does not come back until the page is reloaded.
- **Status line:** "Button not connected". See [05_error_states.md](05_error_states.md) for when it shows and hides.

## 7. Sound

- **Ambient:** A soft water sound that loops quietly the whole time.
- **Plop:** A gentle plop, played once per drop. A single drop of ~10 pieces plays one plop, not ten.
- **Starting:** Browsers block sound until the user clicks or presses a key on the page. The sound starts on the first click or key press anywhere. A button press on the ESP32 does not count.
- **Mute icon:**
  - It shows as *muted* until the sound has started.
  - Clicking it switches the sound off and on.
  - If the very first click of the visit is on the icon, it starts the sound (turns it on).
  - The mute choice is not saved. Every visit starts the same way.

## 8. Input

| Input | Effect |
|---|---|
| Mouse moves over the sea | The fish follow (mouse first). |
| Mouse leaves the page | The fish wander, or chase food if there is any. The last mouse spot is remembered as the drop spot. |
| Feed message from the server | Drops food. |
| **Space** pressed | Drops food immediately, then once every second while held, exactly like the button. The computer's own key repeat is ignored. |
| Click or key press | Starts the sound the first time. |
| Click on the mute icon | Switches the sound on or off. |

Touch input is not supported.

## 9. When the tab is hidden

- While the tab is hidden, the fish, food timers, ripples and sound all pause.
- Feed messages that arrive while the tab is hidden are ignored.
- When the tab is visible again:
  - All food is cleared.
  - The fish carry on from where they were and keep their sizes.
  - The sound resumes, unless it is muted.

## 10. Connection to the server

- The page opens a WebSocket to the same server that served it.
- It listens for two kinds of message: **feed** and **button status**. The exact messages are listed in [06_tech_spec.md](06_tech_spec.md).
- If the WebSocket closes, the page shows "Button not connected" and tries to reconnect every 2 seconds.
