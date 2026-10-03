import {createEntity} from "./entity.js";
import {EntityKind, Relation, RELATION_COLORS, Status} from "../config.js";
import {CLASS_DEFS} from "../classes/index.js";
import {relationTo} from "../ranking.js";
import {drawLabel, drawShape, drawSymbol} from "../render-shapes.js";

export function illusionId(ownerId) {
  return `illusion:${ownerId}`;
}

export function createIllusion(owner, appearance) {
  return createEntity({
    id: illusionId(owner.id),
    kind: EntityKind.ILLUSION,
    x: owner.x,
    y: owner.y,
    radius: appearance.radius,
    interactive: false,
    collides: true,
    solid: false,
    grantsVision: true,
    ownerId: owner.id,
    name: owner.name,
    appearance,
    lifeLeft: 3,
  });
}

export const ILLUSION_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner) {
    return createIllusion(owner, CLASS_DEFS[owner.classId]);
  },
  update(entity, dt, game) {
    if (entity.isRemote) return;
    entity.lifeLeft -= dt;
    if (entity.lifeLeft <= 0) {
      game.entities.delete(entity.id);
      return;
    }

    const owner = game.players.get(entity.ownerId);
    if (!owner) return;
    const prey = [...game.players.values()]
      .filter((player) => player.id !== owner.id && player.status === Status.ALIVE &&
        relationTo(owner, player) === Relation.ABOVE)
      .sort((a, b) => Math.hypot(a.x - entity.x, a.y - entity.y) -
        Math.hypot(b.x - entity.x, b.y - entity.y))[0];
    if (!prey) return;

    const dx = prey.x - entity.x;
    const dy = prey.y - entity.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      entity.vx += (dx / distance) * 400 * dt;
      entity.vy += (dy / distance) * 400 * dt;
    }
  },
  draw(ctx, entity, viewer, now, game) {
    const owner = game.players.get(entity.ownerId);
    if (!owner) return;
    ctx.globalAlpha = 0.65;
    drawShape(ctx, entity, entity.appearance, RELATION_COLORS[relationTo(viewer, owner)], false);
    drawSymbol(ctx, entity, entity.appearance);
    drawLabel(ctx, entity, entity.appearance);
    ctx.globalAlpha = 1;
  },
});