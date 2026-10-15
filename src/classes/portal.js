import { EntityKind, Shape } from "../config.js";
import { isSolid } from "../map.js";
import { createPortal } from "../entities/portal.js";

const PLACE_COOLDOWN = 0.5;

function placePortal(kind) {
  return ({ self, controls, game }) => {
    const map = game.world.map;
    const col = Math.floor(controls.aim.x / map.cell);
    const row = Math.floor(controls.aim.y / map.cell);
    if (isSolid(map, col, row)) return false;

    const portal = createPortal(self, kind, (col + 0.5) * map.cell, (row + 0.5) * map.cell);
    game.entities.set(portal.id, portal);
  };
}

const portal = {
  name: "Portal",
  shape: Shape.CIRCLE,
  symbol: "🌀",
  radius: 12,
  accel: 1300,
  maxSpeed: 210,
  friction: 4,
  primary: {
    label: "Blue",
    cooldown: PLACE_COOLDOWN,
    use: placePortal(EntityKind.PORTAL_BLUE),
  },
  secondary: {
    label: "Orange",
    cooldown: PLACE_COOLDOWN,
    use: placePortal(EntityKind.PORTAL_ORANGE),
  },
};

export default Object.freeze(portal);
