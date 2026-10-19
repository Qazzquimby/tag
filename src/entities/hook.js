import { EntityKind, RELATION_COLORS } from "../config.js";
import { bodies } from "../collision.js";
import { relationTo } from "../ranking.js";
import { canSee, castRay } from "../vision.js";
import { createEntity } from "./entity.js";

const HOOK_RADIUS = 3;
const HOOK_SPEED = 1400;
const HOOK_RANGE = 450;

export function hookId(ownerId, slot) {
  return `hook:${ownerId}:${slot}`;
}

export function findBody(game, id) {
  return game.entities.get(id) ?? game.players.get(id);
}

export function createHook(owner, id, x, y, dir = null) {
  return createEntity({
    id,
    kind: EntityKind.HOOK,
    x,
    y,
    vx: dir ? dir.x * HOOK_SPEED : 0,
    vy: dir ? dir.y * HOOK_SPEED : 0,
    friction: 0,
    radius: HOOK_RADIUS,
    collides: false,
    interactive: false,
    ownerId: owner.id,
    targetId: null,
    flying: dir !== null,
    travelled: 0,
  });
}

function rayCircleDistance(origin, dir, circle) {
  const toX = circle.x - origin.x;
  const toY = circle.y - origin.y;
  const along = toX * dir.x + toY * dir.y;
  if (along < 0) return null;

  const offsetSq = toX * toX + toY * toY - along * along;
  if (offsetSq > circle.radius * circle.radius) return null;
  return Math.max(0, along - Math.sqrt(circle.radius * circle.radius - offsetSq));
}

function findHit(game, hook, dir, range) {
  let hit = {
    distance: castRay(game.world.map, hook.x, hook.y, dir.x, dir.y, range),
    targetId: null,
  };
  for (const body of bodies(game)) {
    if (body.id === hook.ownerId || !body.collides || !body.interactive) continue;
    const distance = rayCircleDistance(hook, dir, body);
    if (distance !== null && distance < hit.distance) hit = { distance, targetId: body.id };
  }
  return hit;
}

function fly(hook, dt, game) {
  const dir = { x: hook.vx / HOOK_SPEED, y: hook.vy / HOOK_SPEED };
  const step = Math.min(HOOK_SPEED * dt, HOOK_RANGE - hook.travelled);
  const hit = findHit(game, hook, dir, step);

  if (!hit.targetId && hit.distance >= step) {
    hook.travelled += step;
    if (hook.travelled >= HOOK_RANGE) game.entities.delete(hook.id);
    return;
  }

  hook.x += dir.x * hit.distance;
  hook.y += dir.y * hit.distance;
  hook.vx = 0;
  hook.vy = 0;
  hook.flying = false;
  hook.targetId = hit.targetId;
}

export const HOOK_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner, id) {
    return createHook(owner, id, owner.x, owner.y);
  },
  update(hook, dt, game) {
    if (hook.isRemote) return;
    if (hook.flying) {
      fly(hook, dt, game);
      return;
    }
    if (!hook.targetId) return;
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
