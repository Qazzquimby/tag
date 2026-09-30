import {
  BOOST_MULT,
  CLASS_DEFS,
  DEAD_S,
  PlayerClass,
  Role,
  SPAWN_SAMPLES,
  SPAWN_WARNING_S,
  Status,
} from "./config.js";

export function createPlayer({
  id,
  name,
  classId = PlayerClass.BALANCED,
  role = Role.PREY,
  x,
  y,
  isDummy = false,
}) {
  return {
    id,
    name,
    classId,
    role,
    status: Status.ALIVE,
    x,
    y,
    tx: x,
    ty: y,
    vx: 0,
    vy: 0,
    aim: 0,
    score: 0,
    boostLeft: 0,
    stateTimer: 0,
    lastSeen: performance.now(),
    isDummy,
  };
}

export function updateOwned(player, moveDir, aimTarget, dt, players, world) {
  if (player.boostLeft > 0) player.boostLeft = Math.max(0, player.boostLeft - dt);

  if (player.status === Status.DEAD) {
    player.stateTimer -= dt;
    if (player.stateTimer <= 0) {
      const spawn = pickSpawn(players, player.id, world);
      player.x = spawn.x;
      player.y = spawn.y;
      player.tx = spawn.x;
      player.ty = spawn.y;
      player.status = Status.SPAWNING;
      player.stateTimer = SPAWN_WARNING_S;
    }
    return;
  }

  if (player.status === Status.SPAWNING) {
    player.stateTimer -= dt;
    if (player.stateTimer <= 0) player.status = Status.ALIVE;
    return;
  }

  if (player.isDummy) return;

  const def = CLASS_DEFS[player.classId];
  const boost = player.boostLeft > 0 ? BOOST_MULT : 1;

  player.vx += moveDir.x * def.accel * boost * dt;
  player.vy += moveDir.y * def.accel * boost * dt;

  const damp = Math.exp(-def.friction * dt);
  player.vx *= damp;
  player.vy *= damp;

  const maxSpeed = def.maxSpeed * boost;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  const min = def.radius;
  if (player.x < min) {
    player.x = min;
    player.vx = 0;
  }
  if (player.x > world.W - min) {
    player.x = world.W - min;
    player.vx = 0;
  }
  if (player.y < min) {
    player.y = min;
    player.vy = 0;
  }
  if (player.y > world.H - min) {
    player.y = world.H - min;
    player.vy = 0;
  }

  player.aim = Math.atan2(aimTarget.y - player.y, aimTarget.x - player.x);
}

export function kill(player) {
  player.status = Status.DEAD;
  player.stateTimer = DEAD_S;
  player.vx = 0;
  player.vy = 0;
  player.role = player.isDummy ? Role.PREY : Role.PREDATOR;
}

export function pickSpawn(players, selfId, world) {
  const others = [];
  for (const p of players.values()) {
    if (p.id === selfId || p.status === Status.DEAD) continue;
    others.push(p);
  }

  let best = { x: world.W / 2, y: world.H / 2 };
  let bestDistance = -1;

  for (let i = 0; i < SPAWN_SAMPLES; i++) {
    const x = 60 + Math.random() * (world.W - 120);
    const y = 60 + Math.random() * (world.H - 120);
    let nearest = Infinity;
    for (const other of others) {
      nearest = Math.min(nearest, Math.hypot(other.x - x, other.y - y));
    }
    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = { x, y };
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
    role: player.role,
    status: player.status,
    x: player.x,
    y: player.y,
    aim: player.aim,
    score: player.score,
  };
}

export function applyStatePayload(player, payload) {
  const wasAlive = player.status === Status.ALIVE;

  player.name = payload.name;
  player.classId = payload.classId;
  player.role = payload.role;
  player.status = payload.status;
  player.aim = payload.aim;
  player.score = payload.score;
  player.tx = payload.x;
  player.ty = payload.y;
  player.lastSeen = performance.now();

  if (!wasAlive || payload.status !== Status.ALIVE) {
    player.x = payload.x;
    player.y = payload.y;
  }
}
