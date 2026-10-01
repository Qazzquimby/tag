/**
 * @typedef {import("../config.js").Entity} Entity
 */

/**
 * @typedef {Object} EntityDef
 * @property {(ctx: CanvasRenderingContext2D, entity: Entity, viewer: Entity, now: number) => void} draw
 * @property {(entity: Entity, dt: number, game: Object) => void} [update]
 * @property {(entity: Entity, viewer: Entity, game: Object) => boolean} [isVisible]
 * @property {(entity: Entity, toucher: Entity, game: Object, net: Object) => void} [onTouch]
 * @property {boolean} [despawnWithOwner]
 */
