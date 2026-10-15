import { AbilitySlot, Shape } from "../config.js";
import { bodies } from "../collision.js";
import { castRay } from "../vision.js";
import { createHook, hookId } from "../entities/hook.js";

const RANGE = 450;
const PULL_ACCEL = 1600;
const PULL_MAX_SPEED = 550;
const ATTACH_MARGIN = 6;
const HOOK_COOLDOWN = 0.3;

function rayCircleDistance(origin, dir, circle) {
  const toX = circle.x - origin.x;
  const toY = circle.y - origin.y;
  const along = toX * dir.x + toY * dir.y;
  if (along < 0) return null;

  const offsetSq = toX * toX + toY * toY - along * along;
  if (offsetSq > circle.radius * circle.radius) return null;
  return Math.max(0, along - Math.sqrt(circle.radius * circle.radius - offsetSq));
}

function findHit(game, self, dir) {
  let hit = {
    distance: castRay(game.world.map, self.x, self.y, dir.x, dir.y, RANGE),
    targetId: null,
  };
  for (const body of bodies(game)) {
    if (body.id === self.id || !body.collides || !body.interactive) continue;
    const distance = rayCircleDistance(self, dir, body);
    if (distance !== null && distance < hit.distance) hit = { distance, targetId: body.id };
  }
  return hit;
}

function fire(slot) {
  return ({ self, controls, game }) => {
    const dx = controls.aim.x - self.x;
    const dy = controls.aim.y - self.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return false;

    const dir = { x: dx / length, y: dy / length };
    const hit = findHit(game, self, dir);
    if (!hit.targetId && hit.distance >= RANGE) return false;

    const id = hookId(self.id, slot);
    const x = self.x + dir.x * hit.distance;
    const y = self.y + dir.y * hit.distance;
    game.entities.set(id, createHook(self, id, x, y, hit.targetId));
  };
}

function pull(self, hook, dt) {
  const dx = hook.x - self.x;
  const dy = hook.y - self.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= self.radius + ATTACH_MARGIN) return;

  self.vx += (dx / distance) * PULL_ACCEL * dt;
  self.vy += (dy / distance) * PULL_ACCEL * dt;
  const speed = Math.hypot(self.vx, self.vy);
  if (speed > PULL_MAX_SPEED) {
    self.vx = (self.vx / speed) * PULL_MAX_SPEED;
    self.vy = (self.vy / speed) * PULL_MAX_SPEED;
  }
}

const grapple = {
  name: "Grapple",
  shape: Shape.CIRCLE,
  symbol: "🪝",
  radius: 11,
  accel: 1400,
  maxSpeed: 210,
  friction: 3,
  update({ self, controls, dt, game }) {
    for (const slot of Object.values(AbilitySlot)) {
      const id = hookId(self.id, slot);
      const hook = game.entities.get(id);
      if (!hook) continue;
      if (!controls[slot]) {
        game.entities.delete(id);
        continue;
      }
      pull(self, hook, dt);
    }
  },
  primary: {
    label: "Hook L",
    cooldown: HOOK_COOLDOWN,
    use: fire(AbilitySlot.PRIMARY),
  },
  secondary: {
    label: "Hook R",
    cooldown: HOOK_COOLDOWN,
    use: fire(AbilitySlot.SECONDARY),
  },
};

export default Object.freeze(grapple);
