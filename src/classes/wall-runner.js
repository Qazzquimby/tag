import { Shape } from "../config.js";
import { lastFreePointAlong, moveWithCollision } from "../collision.js";
import { isAreaFree } from "../map.js";
import slideSound from "../assets/sfx/wall_runner/slide.wav";
import jumpSound from "../assets/sfx/wall_runner/jump.wav";

const GRIND_SPEED = 350; // speed along the wall while attached
const JUMP_SPEED = 800; //speed of dash toward wall and jump off
const STICK_SPEED = 20; // velocity toward the wall to prevent drifting off
const WALL_PROBE = 2; // range to search for wall
const MAX_DISTANCE_FROM_WALL_TO_GRIND = 20; // maximum distance to search for a wall when grinding
const SEEK_MIN_SPEED = 120; // under this speed give up seeking wall
const BLOCKED_TOLERANCE = 1e-3; // if speed is this much less than expected then youre blocked
const WRAP_CLEARANCE = 0.5; // extra pixels on corner to check when wrapping

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
  self.vx = dir.x * GRIND_SPEED;
  self.vy = dir.y * GRIND_SPEED;
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
    attach(self, state, contactNormal, state.hint);
    game.sfx.play(slideSound, self, game.players.get(game.localId), {volume:0.2});
  }
}

function wrapConvexCorner(self, state, oldDir, oldNormal, map) {
  const positionAlongWall = dot(self, oldDir);
  const corner =
    Math.floor((positionAlongWall - self.radius) / map.cell + 1e-6) *
    map.cell;
  const target = corner + self.radius + WRAP_CLEARANCE;
  const offset = target - positionAlongWall;

  self.x += oldDir.x * offset;
  self.y += oldDir.y * offset;
  state.dir = { x: -oldNormal.x, y: -oldNormal.y };
  state.normal = { x: oldDir.x, y: oldDir.y };
}

function runAlongWall(ctx) {
  const { self, dt, game } = ctx;
  const state = self.classState;
  const oldDir = state.dir;
  const oldNormal = state.normal;
  const startAlong = self.x * oldDir.x + self.y * oldDir.y;

  self.vx = oldDir.x * GRIND_SPEED - oldNormal.x * STICK_SPEED;
  self.vy = oldDir.y * GRIND_SPEED - oldNormal.y * STICK_SPEED;
  moveWithCollision(self, self.radius, dt, game.world.map);

  const endAlong = self.x * oldDir.x + self.y * oldDir.y;
  const progress = endAlong - startAlong;
  if (progress < GRIND_SPEED * dt - BLOCKED_TOLERANCE) {
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
    if (state.grinding) {
      wrapConvexCorner(self, state, oldDir, oldNormal, game.world.map);
    } else {
      state.attached = false;
    }
  }

  self.vx = state.dir.x * GRIND_SPEED;
  self.vy = state.dir.y * GRIND_SPEED;
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
      grinding: false,
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
    if (state.grinding && !ctx.controls.primary) {
      state.grinding = false;
      state.attached = false;
      state.seeking = false;
    }
    if (state.attached && self.stunLeft > 0) state.attached = false;

    if (state.attached) {
      runAlongWall(ctx);
      return;
    }
    fly(ctx, moveDefault);
  },
  primary: {
    label: "Grind",
    cooldown: 0.1,
    use({ self, game }) {
      const state = self.classState;
      if (state.attached) {
        state.grinding = true;
        return false;
      }

      const map = game.world.map;
      const from = { x: self.x, y: self.y };
      let nearestDirection = null;
      let nearestDistance = Infinity;

      for (const direction of DIRECTIONS) {
        const target = {
          x: self.x + direction.x * MAX_DISTANCE_FROM_WALL_TO_GRIND,
          y: self.y + direction.y * MAX_DISTANCE_FROM_WALL_TO_GRIND,
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

      state.hint = { x: self.vx, y: self.vy };
      self.vx = nearestDirection.x * JUMP_SPEED;
      self.vy = nearestDirection.y * JUMP_SPEED;
      state.seeking = true;
      state.grinding = true;
    },
  },
  secondary: {
    label: "Jump Off",
    sound: jumpSound,
    cooldown: 0.1,
    use({ self }) {
      const state = self.classState;
      if (!state.attached) return false;

      state.attached = false;
      state.seeking = true;
      state.hint = { x: self.vx, y: self.vy };
      self.vx += state.normal.x * JUMP_SPEED;
      self.vy += state.normal.y * JUMP_SPEED;
    },
  },
};

export default Object.freeze(wallRunner);
