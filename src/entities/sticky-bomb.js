import { EntityKind, RELATION_COLORS } from "../config.js";
import { canSee } from "../vision.js";
import { relationTo } from "../ranking.js";
import { createEntity } from "./entity.js";

const ARM_S = 0.5;
const BOMB_RADIUS = 6;

export function createStickyBomb(owner, id, vx, vy) {
  return createEntity({
    id,
    kind: EntityKind.STICKY_BOMB,
    x: owner.x,
    y: owner.y,
    vx,
    vy,
    radius: BOMB_RADIUS,
    collides: true,
    solid: false,
    interactive: false,
    grantsVision: false,
    ownerId: owner.id,
    armLeft: ARM_S,
  });
}

export const STICKY_BOMB_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner, id) {
    return createStickyBomb(owner, id, 0, 0);
  },
  update(entity, dt) {
    entity.armLeft = Math.max(0, entity.armLeft - dt);
  },
  isVisible(entity, viewer, game) {
    return entity.ownerId === viewer.id || canSee(game, viewer, entity);
  },
  draw(ctx, entity, viewer, now, game) {
    const owner = game.players.get(entity.ownerId);
    ctx.globalAlpha = entity.armLeft > 0 ? 0.5 : 1;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fillStyle = RELATION_COLORS[relationTo(viewer, owner)];
    ctx.fill();
    if (entity.armLeft <= 0) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
});
