import { moveWithCollision } from "./collision.js";
import { randomFreePosition } from "./map.js";
import {
  BOOST_MULT,
  CLASS_DEFS,
  DEAD_S,
  PlayerClass,
  SPAWN_CLEARANCE,
  SPAWN_SAMPLES,
  SPAWN_WARNING_S,
  Status,
} from "./config.js";

export function createPlayer({
  id,
  name,
  classId = PlayerClass.BALANCED,
  x,
  y,
  isDummy = false,
}) {
  return {
    id,
    name,
    classId,
    status: Status.ALIVE,
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
  };
}

function updateDead(player, dt, players, world) {
  player.stateTimer -= dt;
  if (player.stateTimer > 0) return;

  const spawn = pickSpawn(players, player.id, world);
  player.x = spawn.x;
  player.y = spawn.y;
  player.tx = spawn.x;
  player.ty = spawn.y;
  player.status = Status.SPAWNING;
  player.stateTimer = SPAWN_WARNING_S;
}

function updateSpawning(player, dt) {
  player.stateTimer -= dt;
  if (player.stateTimer <= 0) player.status = Status.ALIVE;
}

function applyMovement(player, controls, dt, world) {
  const def = CLASS_DEFS[player.classId];
  const boost = player.boostLeft > 0 ? BOOST_MULT : 1;
  player.aim = Math.atan2(controls.aim.y - player.y, controls.aim.x - player.x);

  if (player.isDummy) return;

  const thrusting = controls.primary && def.primaryAccel > 0;
  const accel = thrusting ? def.primaryAccel : def.accel;
  const friction = thrusting ? 0 : def.friction;
  const moveX = thrusting ? Math.cos(player.aim) : controls.move.x;
  const moveY = thrusting ? Math.sin(player.aim) : controls.move.y;

  player.vx += moveX * accel * boost * dt;
  player.vy += moveY * accel * boost * dt;

  const damp = Math.exp(-friction * dt);
  player.vx *= damp;
  player.vy *= damp;

  const maxSpeed = def.maxSpeed * boost;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }

  moveWithCollision(player, def.radius, dt, world.map);
}

export function updateOwned(player, controls, dt, players, world) {
  if (player.boostLeft > 0) player.boostLeft = Math.max(0, player.boostLeft - dt);

  if (player.status === Status.DEAD) {
    updateDead(player, dt, players, world);
    return;
  }

  if (player.status === Status.SPAWNING) {
    updateSpawning(player, dt);
    return;
  }

  applyMovement(player, controls, dt, world);
}

export function kill(player) {
  player.status = Status.DEAD;
  player.stateTimer = DEAD_S;
  player.vx = 0;
  player.vy = 0;
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

  player.name = payload.name;
  player.classId = payload.classId;
  player.status = payload.status;
  player.aim = payload.aim;
  player.score = payload.score;
  player.scoredAt = payload.scoredAt;
  player.tx = payload.x;
  player.ty = payload.y;
  player.lastSeen = performance.now();

  if (!wasAlive || payload.status !== Status.ALIVE) {
    player.x = payload.x;
    player.y = payload.y;
  }
}
