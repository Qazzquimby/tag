import { EntityKind, Status } from "../config.js";
import { moveWithCollision } from "../collision.js";
import { bodies } from "../bodies.js";
import { FOOD_DEF } from "./food.js";
import { PLAYER_DEF } from "./player-entity.js";
import { RECALL_MARKER_DEF } from "./recall-marker.js";

export const ENTITY_DEFS = Object.freeze({
  [EntityKind.PLAYER]: PLAYER_DEF,
  [EntityKind.FOOD]: FOOD_DEF,
  [EntityKind.RECALL_MARKER]: RECALL_MARKER_DEF,
});

export function updateEntities(game, dt) {
  for (const [id, entity] of game.entities) {
    const def = ENTITY_DEFS[entity.kind];
    if (def.despawnWithOwner) {
      const owner = game.players.get(entity.ownerId);
      if (!owner || owner.status !== Status.ALIVE) {
        game.entities.delete(id);
        continue;
      }
    }

    def.update?.(entity, dt, game);
    if (entity.vx === 0 && entity.vy === 0) continue;

    entity.vx *= Math.exp(-entity.friction * dt);
    entity.vy *= Math.exp(-entity.friction * dt);
    if (entity.collides) {
      moveWithCollision(entity, entity.radius, dt, game.world.map);
    } else {
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
    }
  }
}

export function touchEntities(game, toucher, net) {
  for (const body of bodies(game)) {
    if (body === toucher || !body.interactive) continue;
    const def = ENTITY_DEFS[body.kind];
    if (!def.onTouch) continue;
    if (Math.hypot(body.x - toucher.x, body.y - toucher.y) > toucher.radius + body.radius) continue;
    def.onTouch(body, toucher, game, net);
  }
}
