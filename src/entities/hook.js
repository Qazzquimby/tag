import { EntityKind, RELATION_COLORS } from "../config.js";
import { relationTo } from "../ranking.js";
import { canSee } from "../vision.js";
import { createEntity } from "./entity.js";

const HOOK_RADIUS = 3;

export function hookId(ownerId, slot) {
  return `hook:${ownerId}:${slot}`;
}

export function findBody(game, id) {
  return game.entities.get(id) ?? game.players.get(id);
}

export function createHook(owner, id, x, y, targetId = null) {
  return createEntity({
    id,
    kind: EntityKind.HOOK,
    x,
    y,
    radius: HOOK_RADIUS,
    collides: false,
    interactive: false,
    ownerId: owner.id,
    targetId,
  });
}

export const HOOK_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner, id) {
    return createHook(owner, id, owner.x, owner.y);
  },
  update(hook, dt, game) {
    if (hook.isRemote || !hook.targetId) return;
    const target = findBody(game, hook.targetId);
    if (!target?.interactive) {
      game.entities.delete(hook.id);
      return;
    }
    hook.x = target.x;
    hook.y = target.y;
  },
  isVisible(hook, viewer, game) {
    const owner = game.players.get(hook.ownerId);
    return hook.ownerId === viewer.id || canSee(game, viewer, owner);
  },
  draw(ctx, hook, viewer, now, game) {
    const owner = game.players.get(hook.ownerId);
    const color = RELATION_COLORS[relationTo(viewer, owner)];

    ctx.beginPath();
    ctx.moveTo(owner.x, owner.y);
    ctx.lineTo(hook.x, hook.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(hook.x, hook.y, hook.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  },
});
