import { AbilitySlot, Shape } from "../config.js";
import { createHook, hookId } from "../entities/hook.js";

const PULL_ACCEL = 1600;
const PULL_MAX_SPEED = 550;
const ATTACH_MARGIN = 6;
const HOOK_COOLDOWN = 0.3;

function fire(slot) {
  return ({ self, controls, game }) => {
    const dx = controls.aim.x - self.x;
    const dy = controls.aim.y - self.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return false;

    const id = hookId(self.id, slot);
    const dir = { x: dx / length, y: dy / length };
    game.entities.set(id, createHook(self, id, self.x, self.y, dir));
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
  accel: 500,
  maxSpeed: 180,
  friction: 1,
  update({ self, controls, dt, game }) {
    for (const slot of Object.values(AbilitySlot)) {
      const id = hookId(self.id, slot);
      const hook = game.entities.get(id);
      if (!hook) continue;
      if (!controls[slot]) {
        game.entities.delete(id);
        continue;
      }
      if (!hook.flying) pull(self, hook, dt);
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
