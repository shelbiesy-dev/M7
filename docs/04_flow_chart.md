# 04 — Flow Charts

These charts are written in Mermaid, which VS Code, GitHub and many Markdown viewers draw as diagrams. Each chart has a short explanation under it.

## 1. The whole system

```mermaid
flowchart LR
    B[Push button] -->|wire| E[ESP32-S3<br/>PlatformIO sketch]
    E -->|USB serial<br/>hello / feed| S[Node.js server]
    S -->|WebSocket<br/>feed / status| P1[Browser page 1]
    S -->|WebSocket| P2[Browser page 2...]
    M[Mouse] --> P1
    K[Space key] --> P1
    S -->|serves files| P1
```

The button talks to the ESP32. The ESP32 talks to the server over USB, and the server talks to every open page. The mouse and the Space key go straight to the page.

## 2. One button press

```mermaid
flowchart TD
    A[Button goes down] --> B{Down for 50 ms?}
    B -- no --> Z[Ignore: bounce]
    B -- yes --> C[ESP32 sends feed]
    C --> D[Server sends feed to all pages]
    D --> E{Page tab visible?}
    E -- no --> Y[Ignore]
    E -- yes --> F{Room under 50 pieces?}
    F -- none --> X[Nothing drops, no plop]
    F -- some --> G[Drop up to 10 pieces at drop spot]
    G --> H[Plop + drop ripple]
    H --> I{First drop this visit?}
    I -- yes --> J[Fade out hint line]
    I -- no --> K[Done]
    C --> L{Still held after 1 s?}
    L -- yes --> C
    L -- no --> M[Stop]
```

Holding the button repeats the feed every second. The page decides how many pieces fit under the limit.

## 3. Where food drops

```mermaid
flowchart TD
    A[Feed arrives] --> B{Mouse over sea now?}
    B -- yes --> C[Drop at mouse]
    B -- no --> D{Mouse was ever over sea?}
    D -- yes --> E[Drop at last mouse spot]
    D -- no --> F[Drop at centre]
```

## 4. Life of one food piece

```mermaid
stateDiagram-v2
    [*] --> Sinking: dropped
    Sinking --> Landed: after ~3 s
    Landed --> Eaten: a fish comes within 3%
    Landed --> Fading: 4 s after landing
    Fading --> Gone: 1 s later (5 s total on the bottom)
    Eaten --> Gone: eat ripple
    Sinking --> Gone: tab returns from hidden (food cleared)
    Landed --> Gone: tab returns from hidden
    Gone --> [*]
```

Fish cannot eat a piece while it is sinking. Once it lands, it lasts 5 seconds and fades out during its last second.

## 5. What each fish does

```mermaid
flowchart TD
    A[Each moment] --> B{Mouse over sea?}
    B -- yes --> C{Landed food within 10%?}
    C -- yes --> D[Detour: swim to it]
    C -- no --> E[Follow: loose circle ~5% from mouse]
    B -- no --> F{Any landed food?}
    F -- yes --> G[Chase: swim to nearest piece]
    F -- no --> H[Wander slowly]
    D --> I{Within 3% of food?}
    G --> I
    I -- yes --> J[Eat: piece gone, ripple, grow 2% up to 1.5x]
    I -- no --> A
    J --> A
    E --> A
    H --> A
```

## 6. Connection status on the page

```mermaid
stateDiagram-v2
    [*] --> Connecting: page opens
    Connecting --> Ready: WebSocket open + button connected
    Connecting --> NotConnected: no answer within 2 s
    Ready --> NotConnected: cable unplugged
    Ready --> NotConnected: server stops
    NotConnected --> Ready: cable plugged back / server back
    NotConnected --> NotConnected: retry every 2 s
    note right of NotConnected
        Shows "Button not connected".
        Fish still follow the mouse.
        Space still drops food.
    end note
```

## 7. Tab hidden and shown

```mermaid
flowchart TD
    A[Tab hidden] --> B[Pause fish, timers, ripples, sound]
    B --> C[Ignore feed messages]
    C --> D[Tab visible again]
    D --> E[Clear all food]
    E --> F[Resume fish and sound]
```
