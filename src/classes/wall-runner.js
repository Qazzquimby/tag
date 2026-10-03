import { Shape } from "../config.js";
import { lastFreePointAlong, moveWithCollision } from "../collision.js";
import { isAreaFree } from "../map.js";

const RUN_SPEED = 350;
const JUMP_SPEED = 800;
const STICK_SPEED = 20;
const WALL_PROBE = 2;
const JUMP_RANGE = 20;
const SEEK_MIN_SPEED = 120;
const BLOCKED_TOLERANCE = 1e-3;

const DIRECTIONS = Object.freeze([
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: 0, y: -1 }),
]);

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function attach(self, state, normal, hint) {
  const firstTangent = { x: -normal.y, y: normal.x };
  const secondTangent = { x: normal.y, y: -normal.x };
  const dir =
    dot(secondTangent, hint) > dot(firstTangent, hint)
      ? secondTangent
      : firstTangent;

  state.attached = true;
  state.seeking = false;
  state.normal = normal;
  state.dir = dir;
  state.hint = null;
  self.vx = dir.x * RUN_SPEED;
  self.vy = dir.y * RUN_SPEED;
}

function fly(ctx, moveDefault) {
  const { self, dt, game } = ctx;
  const state = self.classState;
  const entryVelocity = { x: self.vx, y: self.vy };
  moveDefault(ctx);

  if (!state.seeking) return;
  if (Math.hypot(entryVelocity.x, entryVelocity.y) < SEEK_MIN_SPEED) {
    state.seeking = false;
    return;
  }

  let bestInto = 0;
  let contactNormal = null;
  for (const direction of DIRECTIONS) {
    const into = dot(entryVelocity, direction);
    if (into <= bestInto) continue;
    if (
      isAreaFree(
        game.world.map,
        self.x + direction.x * WALL_PROBE,
        self.y + direction.y * WALL_PROBE,
        self.radius,
      )
    ) {
      continue;
    }
    bestInto = into;
    contactNormal = { x: -direction.x, y: -direction.y };
  }

  if (contactNormal) {
    attach(self, state, contactNormal, state.hint ?? entryVelocity);
  }
}

function runAlongWall(ctx) {
  const { self, dt, game } = ctx;
  const state = self.classState;
  const oldDir = state.dir;
  const oldNormal = state.normal;
  const startAlong = self.x * oldDir.x + self.y * oldDir.y;

  self.vx = oldDir.x * RUN_SPEED - oldNormal.x * STICK_SPEED;
  self.vy = oldDir.y * RUN_SPEED - oldNormal.y * STICK_SPEED;
  moveWithCollision(self, self.radius, dt, game.world.map);

  const endAlong = self.x * oldDir.x + self.y * oldDir.y;
  const progress = endAlong - startAlong;
  if (progress < RUN_SPEED * dt - BLOCKED_TOLERANCE) {
    state.dir = oldNormal;
    state.normal = { x: -oldDir.x, y: -oldDir.y };
  } else if (
    isAreaFree(
      game.world.map,
      self.x - oldNormal.x * WALL_PROBE,
      self.y - oldNormal.y * WALL_PROBE,
      self.radius,
    )
  ) {
    state.attached = false;
  }

  self.vx = state.dir.x * RUN_SPEED;
  self.vy = state.dir.y * RUN_SPEED;
}

const wallRunner = {
  name: "Wall Runner",
  shape: Shape.CIRCLE,
  symbol: "🧗",
  radius: 11,
  accel: 1600,
  maxSpeed: 260,
  friction: 3,
  createState() {
    return {
      attached: false,
      seeking: false,
      hint: null,
      normal: null,
      dir: null,
    };
  },
  adjustIntent({ self }, intent) {
    if (!self.classState.seeking) return;
    intent.moveX = 0;
    intent.moveY = 0;
  },
  move(ctx, moveDefault) {
    const { self } = ctx;
    const state = self.classState;
    if (state.attached && self.stunLeft > 0) state.attached = false;

    if (state.attached) {
      runAlongWall(ctx);
      return;
    }
    fly(ctx, moveDefault);
  },
  primary: {
    label: "Leap",
    cooldown: 0.4,
    use({ self, controls, game }) {
      const state = self.classState;
      if (state.attached) {
        state.attached = false;
        state.seeking = false;
        return;
      }

      const map = game.world.map;
      const from = { x: self.x, y: self.y };
      let nearestDirection = null;
      let nearestDistance = Infinity;

      for (const direction of DIRECTIONS) {
        const target = {
          x: self.x + direction.x * JUMP_RANGE,
          y: self.y + direction.y * JUMP_RANGE,
        };
        const lastFree = lastFreePointAlong(map, self.radius, from, target);
        if (lastFree.x === target.x && lastFree.y === target.y) continue;

        const distance = Math.hypot(lastFree.x - self.x, lastFree.y - self.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestDirection = direction;
        }
      }

      if (!nearestDirection) return false;

      self.vx = nearestDirection.x * JUMP_SPEED;
      self.vy = nearestDirection.y * JUMP_SPEED;
      state.seeking = true;
      state.hint = {
        x: controls.aim.x - self.x,
        y: controls.aim.y - self.y,
      };
    },
  },
  secondary: {
    label: "Launch",
    cooldown: 0.4,
    use({ self, controls }) {
      const state = self.classState;
      if (!state.attached) return false;

      // const dx = controls.aim.x - self.x;
      // const dy = controls.aim.y - self.y;
      // const distance = Math.hypot(dx, dy);
      // if (distance === 0) return false;
      //
      // let direction = { x: dx / distance, y: dy / distance };
      // if (dot(direction, state.normal) < 0) {
      //   direction = {
      //     x: direction.x - state.normal.x * dot(direction, state.normal),
      //     y: direction.y - state.normal.y * dot(direction, state.normal),
      //   };
      //   const tangentLength = Math.hypot(direction.x, direction.y);
      //   direction =
      //     tangentLength === 0
      //       ? state.normal
      //       : { x: direction.x / tangentLength, y: direction.y / tangentLength };
      // }

      state.attached = false;
      state.seeking = true;
      state.hint = null;
      self.vx += state.normal.x * JUMP_SPEED;
      self.vy += state.normal.y * JUMP_SPEED;
    },
  },
};

export default Object.freeze(wallRunner);
