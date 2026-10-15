import { Shape, Status } from "../config.js";
import { isSolid } from "../map.js";
import { requestWallEdit } from "../wall-edits.js";

const DASH_SPEED = 900;
const WALL_EDIT_S = 1;

function isCellOccupied(game, col, row) {
  const { cell } = game.world.map;
  for (const player of game.players.values()) {
    if (player.status !== Status.ALIVE) continue;
    const nearestX = Math.max(col * cell, Math.min(player.x, (col + 1) * cell));
    const nearestY = Math.max(row * cell, Math.min(player.y, (row + 1) * cell));
    if (Math.hypot(player.x - nearestX, player.y - nearestY) < player.radius) return true;
  }
  return false;
}

const ricochet = {
  name: "Ricochet",
  shape: Shape.CIRCLE,
  symbol: "🎱",
  radius: 11,
  accel: 250,
  maxSpeed: 140,
  friction: 0.8,
  bounce: 0.95,
  primary: {
    label: "Dash",
    cooldown: 1.5,
    use({ self, controls }) {
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.hypot(dx, dy);
      if (distance === 0) return false;
      self.vx = (dx / distance) * DASH_SPEED;
      self.vy = (dy / distance) * DASH_SPEED;
    },
  },
  secondary: {
    label: "Wall",
    cooldown: 1,
    use({ self, controls, game, net }) {
      const map = game.world.map;
      const col = Math.floor(controls.aim.x / map.cell);
      const row = Math.floor(controls.aim.y / map.cell);
      if (col < 0 || row < 0 || col >= map.cols || row >= map.rows) return false;

      const solid = !isSolid(map, col, row);
      if (solid && isCellOccupied(game, col, row)) return false;
      requestWallEdit(game, net, { col, row, solid, duration: WALL_EDIT_S });
    },
  },
};

export default Object.freeze(ricochet);
