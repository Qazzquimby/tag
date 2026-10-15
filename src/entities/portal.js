import { EntityKind, MAP_CELL, Status } from "../config.js";
import { bodies } from "../collision.js";
import { createEntity } from "./entity.js";

const PORTALS = Object.freeze({
  [EntityKind.PORTAL_BLUE]: { color: "#3aa0ff", partner: EntityKind.PORTAL_ORANGE },
  [EntityKind.PORTAL_ORANGE]: { color: "#ff9a2e", partner: EntityKind.PORTAL_BLUE },
});

export function portalId(kind, ownerId) {
  return `portal:${kind}:${ownerId}`;
}

export function createPortal(owner, kind, x, y) {
  return createEntity({
    id: portalId(kind, owner.id),
    kind,
    x,
    y,
    radius: MAP_CELL / 2,
    collides: false,
    interactive: false,
    ownerId: owner.id,
    inside: new Set(),
  });
}

function isSimulatedHere(body, game) {
  if (body.kind === EntityKind.PLAYER) {
    return body.status === Status.ALIVE && (body.id === game.localId || body.isDummy);
  }
  return !body.isRemote;
}

function portalDef(kind) {
  const { color, partner } = PORTALS[kind];

  return Object.freeze({
    despawnWithOwner: false,
    replicated: true,
    create(owner) {
      return createPortal(owner, kind, owner.x, owner.y);
    },
    update(portal, dt, game) {
      if (portal.isRemote) {
        portal.x = portal.tx;
        portal.y = portal.ty;
      }

      const other = game.entities.get(portalId(partner, portal.ownerId));
      const inside = new Set();
      for (const body of bodies(game)) {
        if (!body.collides || !isSimulatedHere(body, game)) continue;
        if (Math.abs(body.x - portal.x) > portal.radius) continue;
        if (Math.abs(body.y - portal.y) > portal.radius) continue;

        inside.add(body.id);
        if (!other || portal.inside.has(body.id)) continue;
        body.x += other.x - portal.x;
        body.y += other.y - portal.y;
        other.inside.add(body.id);
      }
      portal.inside = inside;
    },
    draw(ctx, portal, viewer, now) {
      const size = portal.radius * 2;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(now / 200);
      ctx.fillRect(portal.x - portal.radius, portal.y - portal.radius, size, size);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(portal.x - portal.radius, portal.y - portal.radius, size, size);
      ctx.restore();
    },
  });
}

export const PORTAL_BLUE_DEF = portalDef(EntityKind.PORTAL_BLUE);
export const PORTAL_ORANGE_DEF = portalDef(EntityKind.PORTAL_ORANGE);
