import { EntityKind, RELATION_COLORS } from "../config.js";
import { CLASS_DEFS } from "../classes/index.js";
import { relationTo } from "../ranking.js";
import { drawShape, drawSymbol, drawLabel } from "../render-shapes.js";
import { createEntity } from "./entity.js";

export function recallMarkerId(ownerId) {
  return `recall:${ownerId}`;
}

export function createRecallMarker(owner, appearance) {
  return createEntity({
    id: recallMarkerId(owner.id),
    kind: EntityKind.RECALL_MARKER,
    x: owner.x,
    y: owner.y,
    radius: appearance.radius,
    interactive: false,
    collides: false,
    solid: false,
    grantsVision: true,
    ownerId: owner.id,
    name: owner.name,
    appearance,
  });
}

export const RECALL_MARKER_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner) {
    return createRecallMarker(owner, CLASS_DEFS[owner.classId]);
  },
  draw(ctx, entity, viewer, now, game) {
    const owner = game.players.get(entity.ownerId);
    ctx.globalAlpha = 0.4;
    drawShape(
      ctx,
      entity,
      entity.appearance,
      RELATION_COLORS[relationTo(viewer, owner)],
      false,
    );
    drawSymbol(ctx, entity, entity.appearance);
    drawLabel(ctx, entity, entity.appearance);
    ctx.globalAlpha = 1;
  },
});
