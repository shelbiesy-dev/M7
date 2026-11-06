# 07 — Acceptance Checks

The project is finished when every check below passes. Each check is something a person can do and see, without reading the code. Tick each box while testing.

**Test setup:** The ESP32 is plugged in, the server is running, and the page is open in a desktop browser, unless the check says otherwise.

## A. Opening the page
- [ ] A1. The page opens at `http://localhost:3000` and the sea fills the whole window with no scroll bars.
- [ ] A2. The sea is dreamy blue with soft moving light, seen from above.
- [ ] A3. There are exactly 5 soft, glowing white fish, swimming slowly by themselves.
- [ ] A4. There is no food in the water.
- [ ] A5. The hint line "Move your mouse, press the button to feed." is visible at the bottom.
- [ ] A6. The faint mute icon is in the bottom right corner and shows as muted.
- [ ] A7. "Button not connected" is **not** shown.
- [ ] A8. Reloading the page starts the same way again, with 5 fresh fish at their starting sizes and no food.

## B. Mouse
- [ ] B1. When the mouse moves over the sea, all fish swim calmly toward it.
- [ ] B2. The fish settle in a loose circle around the cursor, slightly away from it, without overlapping each other.
- [ ] B3. A fish takes roughly 8 seconds to swim from one side of the screen to the other.
- [ ] B4. When the mouse leaves the page, the fish go back to swimming around by themselves.
- [ ] B5. The fish never swim outside the visible sea.

## C. Button and food
- [ ] C1. One short press drops about 10 food pieces at the mouse, in a small cluster.
- [ ] C2. The food is small, warm, glowing gold or orange dots.
- [ ] C3. A soft ripple spreads where the food drops.
- [ ] C4. The food takes about 3 seconds to sink. No fish eats it while it is sinking.
- [ ] C5. After landing, fish within reach eat it, and a small ripple appears where each piece is eaten.
- [ ] C6. A landed piece nobody eats fades out and disappears about 5 seconds after landing.
- [ ] C7. The hint line fades out after the first drop and does not come back until the page is reloaded.
- [ ] C8. Holding the button drops food straight away and then again every second.
- [ ] C9. When holding or pressing many times, there are never more than 50 pieces on screen.
- [ ] C10. When the limit is nearly reached, a press drops only the pieces that fit. When it is full, a press drops nothing and plays no plop.
- [ ] C11. One quick press never drops food twice (no button bounce).

## D. Fish and food together
- [ ] D1. While following the mouse, a fish turns aside to eat a landed piece close to it (within ~10% of the screen width), then returns to the mouse.
- [ ] D2. While following the mouse, fish ignore landed food that is far away.
- [ ] D3. With the mouse off the page, the fish swim to the nearest landed pieces and eat them all.
- [ ] D4. A press with the mouse off the page drops food where the mouse was last over the sea.
- [ ] D5. A press before the mouse has ever been over the sea drops food at the centre.
- [ ] D6. A fish grows a little with each piece it eats and stops growing at about 1.5 times its starting size.
- [ ] D7. Each piece is eaten by only one fish.

## E. Keyboard
- [ ] E1. Pressing Space drops food exactly like the button.
- [ ] E2. Holding Space drops food straight away and then once every second, not faster.
- [ ] E3. Space works even while "Button not connected" is shown.

## F. Sound
- [ ] F1. No sound plays before the first click or key press.
- [ ] F2. After the first click anywhere, the soft water sound starts and the mute icon shows as on.
- [ ] F3. Each drop plays one gentle plop, not one per piece.
- [ ] F4. Clicking the mute icon turns all sound off, and clicking again turns it back on.
- [ ] F5. The sound credits are listed in `public/sounds/CREDITS.md`.

## G. Connection problems
- [ ] G1. Unplugging the ESP32 cable shows "Button not connected" within about 2 seconds. The fish keep following the mouse.
- [ ] G2. Plugging it back in hides the line within about 2 seconds, and the button works again without reloading.
- [ ] G3. Stopping the server shows "Button not connected". Starting it again hides the line within about 2 seconds, without reloading.
- [ ] G4. Starting the server with the ESP32 unplugged, then plugging it in, connects within about 2 seconds.
- [ ] G5. A normal page load does not briefly flash "Button not connected".
- [ ] G6. Turning off WebGL, or blocking the CDN, shows the calm message from [05_error_states.md](05_error_states.md) instead of a broken page.

## H. Tabs and windows
- [ ] H1. With two tabs open side by side (two windows), one press drops food in both, and each has its own sea.
- [ ] H2. While a tab is hidden, its sound stops and button presses do nothing in it.
- [ ] H3. When the hidden tab is shown again, all food is gone, and the fish and sound carry on.

## I. Browsers
- [ ] I1. Checks A–H pass in the latest Chrome.
- [ ] I2. Checks A–H pass in the latest Firefox.
- [ ] I3. Checks A–H pass in the latest Safari.
- [ ] I4. The animation looks smooth on a normal laptop, with no visible stutter, even with 50 food pieces.
