// All the numbers for the pond, in one place (docs/06_tech_spec.md §5).
//
// Distances are a share of the SCREEN WIDTH, in percent.
// The world is always 100 units wide, so 1 unit = 1% of the screen width.

export const SETTINGS = {
  // Fish
  fishCount: 5,
  fishLength: 5.5,          // starting body length (% of screen width)
  fishSizeVariation: 0.1,   // each fish starts up to ±10% different
  crossTime: 8,             // seconds to cross the screen at full speed
  wanderSpeed: 0.45,        // share of full speed while wandering
  followDistance: 5,        // fish stay about this far from the cursor (loose circle)
  ringDrift: 0.12,          // how fast the loose circle slowly turns (radians per second)
  detourRange: 10,          // while following, landed food this close draws a fish aside
  eatDistance: 3,           // a fish eats a landed piece this close to its mouth
  growthPerBite: 0.02,      // +2% of the starting size per piece
  maxGrowth: 1.5,           // never bigger than 1.5 × the starting size
  edgeMargin: 3,            // fish keep this far inside the visible sea

  // Food
  foodPerDrop: 10,
  foodSpread: 5,            // pieces land within this distance of the drop spot
  sinkTime: 3,              // seconds sinking (cannot be eaten)
  bottomTime: 5,            // seconds resting on the bottom
  fadeTime: 1,              // fades out during the last second on the bottom
  maxFood: 50,              // sinking + landed
  holdRepeatMs: 1000,       // Space held: drop again every second

  // Ripples
  dropRippleTime: 1.5,
  dropRippleSize: 9,        // radius at the end of a drop ripple
  eatRippleTime: 1.0,
  eatRippleSize: 3.5,

  // Connection
  reconnectEveryMs: 2000,
  notConnectedGraceMs: 2000,

  // Sound
  ambientVolume: 0.35,
  plopVolume: 0.55,
};
