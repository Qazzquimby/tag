import { ENTITY_FRICTION } from "../config.js";

/**
 * @param {Object} fields
 * @returns {import("./types.js").Entity}
 */
export function createEntity(fields) {
  return {
    vx: 0,
    vy: 0,
    friction: ENTITY_FRICTION,
    collides: true,
    solid: false,
    interactive: true,
    grantsVision: false,
    isRemote: false,
    ownerId: null,
    ...fields,
  };
}
