import { WALL_BOUNCE } from "./config.js";
import { isAreaFree, isSolid } from "./map.js";

const EPSILON = 1e-6;

function cellRange(min, max, cell) {
  return [
    Math.floor(min / cell + EPSILON),
    Math.floor(max / cell - EPSILON),
  ];
}

function resolveX(player, half, map) {
  const [minRow, maxRow] = cellRange(player.y - half, player.y + half, map.cell);
  const [minCol, maxCol] = cellRange(player.x - half, player.x + half, map.cell);
  let collisionFace = player.vx > 0 ? Infinity : -Infinity;

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isSolid(map, col, row)) continue;
      if (player.vx > 0) collisionFace = Math.min(collisionFace, col * map.cell - half);
      if (player.vx < 0) collisionFace = Math.max(collisionFace, (col + 1) * map.cell + half);
    }
  }

  if (collisionFace !== Infinity && collisionFace !== -Infinity) {
    player.x = collisionFace;
    player.vx = -player.vx * WALL_BOUNCE;
  }
}

function resolveY(player, half, map) {
  const [minRow, maxRow] = cellRange(player.y - half, player.y + half, map.cell);
  const [minCol, maxCol] = cellRange(player.x - half, player.x + half, map.cell);
  let collisionFace = player.vy > 0 ? Infinity : -Infinity;

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isSolid(map, col, row)) continue;
      if (player.vy > 0) collisionFace = Math.min(collisionFace, row * map.cell - half);
      if (player.vy < 0) collisionFace = Math.max(collisionFace, (row + 1) * map.cell + half);
    }
  }

  if (collisionFace !== Infinity && collisionFace !== -Infinity) {
    player.y = collisionFace;
    player.vy = -player.vy * WALL_BOUNCE;
  }
}

export function lastFreePointAlong(map, half, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.ceil(distance / 4);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const point = { x: from.x + dx * t, y: from.y + dy * t };
    if (!isAreaFree(map, point.x, point.y, half)) {
      const previousT = (i - 1) / steps;
      return { x: from.x + dx * previousT, y: from.y + dy * previousT };
    }
  }

  return { x: to.x, y: to.y };
}

export function moveWithCollision(player, half, dt, map) {
  player.x += player.vx * dt;
  resolveX(player, half, map);
  player.y += player.vy * dt;
  resolveY(player, half, map);
}
