/**
 * @param {Object} game
 */
export function* bodies(game) {
  yield* game.entities.values();
  yield* game.players.values();
}

export function queryBodies(game, origin, range) {
  const result = [];
  for (const body of bodies(game)) {
    if (body.interactive && Math.hypot(body.x - origin.x, body.y - origin.y) <= range) {
      result.push(body);
    }
  }
  return result;
}

export function applyImpulse(body, ix, iy) {
  body.vx += ix;
  body.vy += iy;
}
