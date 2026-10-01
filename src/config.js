export const Status = Object.freeze({ ALIVE: 0, DEAD: 1, SPAWNING: 2, CHOOSING: 3 });
export const Shape = Object.freeze({ CIRCLE: 0, SQUARE: 1, TRIANGLE: 2 });
export const Relation = Object.freeze({ SELF: 0, ABOVE: 1, BELOW: 2 });
export const AbilitySlot = Object.freeze({ PRIMARY: "primary", SECONDARY: "secondary" });

export const NetEvent = Object.freeze({
  HELLO: "hello",
  STATE: "state",
  BYE: "bye",
  CATCH: "catch",
  FOOD_SPAWN: "food-spawn",
  FOOD_EATEN: "food-eaten",
  FOOD_SYNC: "food-sync",
  ABILITY: "ability",
});

/**
 * @typedef {Object} AbilityEvent
 * @property {string} id
 * @property {number} classId
 * @property {"primary"|"secondary"} slot
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} classId
 * @property {number} status
 * @property {number} x
 * @property {number} y
 * @property {number} tx
 * @property {number} ty
 * @property {number} vx
 * @property {number} vy
 * @property {number} aim
 * @property {number} score
 * @property {number} scoredAt
 * @property {number} boostLeft
 * @property {number} stateTimer
 * @property {number} lastSeen
 * @property {boolean} isDummy
 * @property {Object|null} classState
 * @property {{primary: number, secondary: number}} cooldowns
 */

/**
 * @typedef {Object} Food
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} warningLeft
 */


export const RELATION_COLORS = Object.freeze({
  [Relation.SELF]: "#5bc8ff",
  [Relation.ABOVE]: "#3ddc84",
  [Relation.BELOW]: "#ff4d4d",
});

export const FOOD_COLOR = "#3ddc84";
export const MAP_CELL = 50;
export const WALL_BOUNCE = 0.5;
export const REMOTE_SNAP_DIST = 100;
export const VISION_RAYS = 720;
export const SPAWN_CLEARANCE = 20;

export const SCORE_PLAYER = 10;
export const SCORE_FOOD = 6;

export const DEAD_S = 3;
export const SPAWN_WARNING_S = 1.5;
export const FOOD_WARNING_S = 1.5;

export const ROUND_S = 120;
export const ROUND_RESULT_S = 5;

export const FOOD_INTERVAL_S = 3;
export const FOOD_MAX = 8;
export const FOOD_RADIUS = 7;

export const BOOST_S = 0;
export const BOOST_MULT = 1.0;

export const SEND_HZ = 10;
export const STALE_S = 5;

export const SPAWN_SAMPLES = 12;
export const RANK_FLASH_S = 3;
