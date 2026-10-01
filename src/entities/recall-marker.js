import { EntityKind, RELATION_COLORS, Relation } from "../config.js";
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
    ownerId: owner.id,
    name: owner.name,
    appearance,
  });
}

export const RECALL_MARKER_DEF = Object.freeze({
  despawnWithOwner: true,
  isVisible(entity, viewer) {
    return entity.ownerId === viewer.id;
  },
  draw(ctx, entity) {
    ctx.globalAlpha = 0.4;
    drawShape(
      ctx,
      entity,
      entity.appearance,
      RELATION_COLORS[Relation.SELF],
      false,
    );
    drawSymbol(ctx, entity, entity.appearance);
    drawLabel(ctx, entity, entity.appearance);
    ctx.globalAlpha = 1;
  },
});
