/**
 * @typedef {Object} Controls
 * @property {{x: number, y: number}} move
 * @property {{x: number, y: number}} aim
 * @property {boolean} primary
 * @property {boolean} secondary
 * @property {boolean} primaryPressed
 * @property {boolean} secondaryPressed
 */

/**
 * @typedef {Object} ClassContext
 * @property {import("../config.js").Player} self
 * @property {Controls} controls
 * @property {number} dt
 * @property {Object} game
 * @property {{send: (event: string, payload: Object) => void}} net
 */

/**
 * @typedef {Object} MovementIntent
 * @property {number} moveX
 * @property {number} moveY
 * @property {number} accel
 * @property {number} friction
 * @property {number} maxSpeed
 * @property {boolean} phase Ignore map walls during movement.
 */

/**
 * @typedef {Object} Ability
 * @property {number} cooldown
 * @property {(ctx: ClassContext) => (void|false)} use
 * @property {string} [label]
 * @property {string} [sound] URL of an mp3 asset
 * @property {(player: import("../config.js").Player) => number} [meter] Returns ability charge from 0 to 1.
 */

/**
 * @typedef {Object} ClassDef
 * @property {string} name
 * @property {number} shape
 * @property {string} symbol
 * @property {number} radius
 * @property {number} accel
 * @property {number} maxSpeed
 * @property {number} friction
 * @property {() => Object} [createState]
 * @property {(ctx: ClassContext) => void} [update]
 * @property {(ctx: ClassContext, intent: MovementIntent) => void} [adjustIntent]
 * @property {(player: import("../config.js").Player) => Object} [netState]
 * @property {(player: import("../config.js").Player) => void} [onScore]
 * @property {(player: import("../config.js").Player, viewer: import("../config.js").Player) => number} [viewAlpha]
 * @property {(viewer: import("../config.js").Player) => number} [xrayRadius] Radius in pixels within which walls do not block sight.
 * @property {(viewer: import("../config.js").Player, target: import("../config.js").Player, game: Object) => boolean} [senses]
 * @property {(ctx: ClassContext, moveDefault: (ctx: ClassContext) => void) => void} [move] Replaces default movement integration.
 * @property {Ability} [primary]
 * @property {Ability} [secondary]
 */
