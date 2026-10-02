import { moveWithCollision } from "./collision.js";
import { CLASS_DEFS, PlayerClass } from "./classes/index.js";
import { randomFreePosition } from "./map.js";
import {
  BOOST_MULT,
  DEAD_S,
  EntityKind,
  SPAWN_CLEARANCE,
  SPAWN_SAMPLES,
  SPAWN_WARNING_S,
  REMOTE_SNAP_DIST,
  Status,
} from "./config.js";
import deathSound from "./assets/sfx/death.mp3";

export function createPlayer({
  id,
  name,
  classId = PlayerClass.BALANCED,
  x,
  y,
  isDummy = false,
  status = Status.ALIVE,
}) {
  const player = {
    id,
    name,
    classId,
    kind: EntityKind.PLAYER,
    radius: CLASS_DEFS[classId].radius,
    collides: true,
    solid: true,
    get interactive() {
      return this.status === Status.ALIVE;
    },
    status,
    x,
    y,
    tx: x,
    ty: y,
    vx: 0,
    vy: 0,
    aim: 0,
    score: 0,
    scoredAt: Date.now(),
    boostLeft: 0,
    stateTimer: 0,
    lastSeen: performance.now(),
    isDummy,
    classState: null,
    cooldowns: { primary: 0, secondary: 0 },
  };
  return player;
}

export function setPlayerClass(player, classId) {
  player.classId = classId;
  player.radius = CLASS_DEFS[classId].radius;
}

export function respawn(player, players, world) {
  const spawn = pickSpawn(players, player.id, world);
  player.x = spawn.x;
  player.y = spawn.y;
  player.tx = spawn.x;
  player.ty = spawn.y;
  player.status = Status.SPAWNING;
  player.stateTimer = SPAWN_WARNING_S;
}

function updateDead(player, dt, players, world) {
  player.stateTimer -= dt;
  if (player.stateTimer > 0) return;
  respawn(player, players, world);
}

function resetAbilities(player) {
  const def = CLASS_DEFS[player.classId];
  player.cooldowns = { primary: 0, secondary: 0 };
  player.classState = def.createState ? def.createState() : null;
}

function updateSpawning(player, dt) {
  player.stateTimer -= dt;
  if (player.stateTimer <= 0) {
    player.status = Status.ALIVE;
    resetAbilities(player);
  }
}

function applyMovement(ctx) {
  const { self, controls, dt, game } = ctx;
  const def = CLASS_DEFS[self.classId];
  const boost = self.boostLeft > 0 ? BOOST_MULT : 1;
  const intent = {
    moveX: controls.move.x,
    moveY: controls.move.y,
    accel: def.accel,
    friction: def.friction,
    maxSpeed: def.maxSpeed,
  };
  def.adjustIntent?.(ctx, intent);

  self.vx += intent.moveX * intent.accel * boost * dt;
  self.vy += intent.moveY * intent.accel * boost * dt;

  const damp = Math.exp(-intent.friction * dt);
  self.vx *= damp;
  self.vy *= damp;

  const maxSpeed = intent.maxSpeed * boost;
  const speed = Math.hypot(self.vx, self.vy);
  if (speed > maxSpeed) {
    self.vx = (self.vx / speed) * maxSpeed;
    self.vy = (self.vy / speed) * maxSpeed;
  }

  moveWithCollision(self, self.radius, dt, game.world.map);
}

function useAbility(player, ctx, def, slot, pressed) {
  const ability = def[slot];
  if (!pressed || !ability || player.cooldowns[slot] > 0) return;
  ability.use(ctx);
  player.cooldowns[slot] = ability.cooldown;
}

export function updateOwned(player, controls, dt, game) {
  if (player.boostLeft > 0) player.boostLeft = Math.max(0, player.boostLeft - dt);
  player.cooldowns.primary = Math.max(0, player.cooldowns.primary - dt);
  player.cooldowns.secondary = Math.max(0, player.cooldowns.secondary - dt);

  if (player.status === Status.DEAD) {
    updateDead(player, dt, game.players, game.world);
    return;
  }

  if (player.status === Status.SPAWNING) {
    updateSpawning(player, dt);
    return;
  }

  player.aim = Math.atan2(controls.aim.y - player.y, controls.aim.x - player.x);
  const ctx = { self: player, controls, dt, game };
  const def = CLASS_DEFS[player.classId];
  def.update?.(ctx);
  useAbility(player, ctx, def, "primary", controls.primaryPressed);
  useAbility(player, ctx, def, "secondary", controls.secondaryPressed);
  applyMovement(ctx);
}

export function kill(game, player) {
  player.status = Status.DEAD;
  player.stateTimer = DEAD_S;
  player.vx = 0;
  player.vy = 0;
  game.sfx.play(deathSound, player, player);
}

export function startRound(player, players, world) {
  player.score = 0;
  player.scoredAt = Date.now();
  player.boostLeft = 0;
  player.vx = 0;
  player.vy = 0;
  respawn(player, players, world);
}

export function addScore(player, points) {
  player.score += points;
  player.scoredAt = Date.now();
}

export function pickSpawn(players, selfId, world) {
  const others = [];
  for (const player of players.values()) {
    if (player.id !== selfId && player.status !== Status.DEAD) others.push(player);
  }

  let best = randomFreePosition(world, SPAWN_CLEARANCE);
  let bestDistance = -1;

  for (let i = 0; i < SPAWN_SAMPLES; i++) {
    const candidate = randomFreePosition(world, SPAWN_CLEARANCE);
    let nearest = Infinity;

    for (const other of others) {
      nearest = Math.min(nearest, Math.hypot(other.x - candidate.x, other.y - candidate.y));
    }

    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = candidate;
    }
  }

  return best;
}

export function smoothRemote(player, dt) {
  const t = Math.min(1, dt * 12);
  player.x += (player.tx - player.x) * t;
  player.y += (player.ty - player.y) * t;
}

export function toStatePayload(player) {
  return {
    id: player.id,
    name: player.name,
    classId: player.classId,
    status: player.status,
    x: player.x,
    y: player.y,
    aim: player.aim,
    score: player.score,
    scoredAt: player.scoredAt,
  };
}

export function applyStatePayload(player, payload) {
  const wasAlive = player.status === Status.ALIVE;
  const shouldSnap =
    Math.hypot(payload.x - player.x, payload.y - player.y) > REMOTE_SNAP_DIST;

  player.name = payload.name;
  setPlayerClass(player, payload.classId);
  player.status = payload.status;
  player.aim = payload.aim;
  player.score = payload.score;
  player.scoredAt = payload.scoredAt;
  player.tx = payload.x;
  player.ty = payload.y;
  player.lastSeen = performance.now();

  if (!wasAlive || payload.status !== Status.ALIVE || shouldSnap) {
    player.x = payload.x;
    player.y = payload.y;
  }
}
