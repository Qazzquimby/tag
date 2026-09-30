import {
  BOOST_S,
  CLASS_DEFS,
  FOOD_INTERVAL_S,
  FOOD_MAX,
  FOOD_RADIUS,
  NetEvent,
  PlayerClass,
  ROLE_GRACE_S,
  Role,
  SCORE_FOOD,
  SCORE_PLAYER,
  SEND_HZ,
  STALE_S,
  Status,
} from "./config.js";
import { createFood, isEdible, randomFoodPosition, updateFoods } from "./food.js";
import {
  applyStatePayload,
  createPlayer,
  kill,
  pickSpawn,
  smoothRemote,
  toStatePayload,
  updateOwned,
} from "./player.js";

export const DUMMY_ID = "dummy";

const NO_MOVE = { x: 0, y: 0 };

export function createGame(localId, world, name) {
  const game = {
    localId,
    world,
    players: new Map(),
    foods: new Map(),
    foodTimer: FOOD_INTERVAL_S,
    noPredatorFor: 0,
    lastSent: 0,
    nextFoodId: 1,
  };

  const spawn = pickSpawn(game.players, localId, world);
  game.players.set(
    localId,
    createPlayer({
      id: localId,
      name,
      classId: PlayerClass.BALANCED,
      role: Role.PREY,
      x: spawn.x,
      y: spawn.y,
    }),
  );

  return game;
}

export function updateGame(game, input, dt, net) {
  const me = game.players.get(game.localId);
  updateOwned(me, input.getMove(), input.mouse, dt, game.players, game.world);

  const dummy = game.players.get(DUMMY_ID);
  if (dummy) updateOwned(dummy, NO_MOVE, input.mouse, dt, game.players, game.world);

  const now = performance.now();
  for (const [id, player] of game.players) {
    if (id === game.localId || player.isDummy) continue;
    smoothRemote(player, dt);
    if (now - player.lastSeen > STALE_S * 1000) game.players.delete(id);
  }

  if (me.status === Status.ALIVE && me.role === Role.PREDATOR) {
    catchPlayers(game, me, net);
    if (me.role === Role.PREDATOR) catchFood(game, me, net);
  }

  updateFoods(game.foods, dt);
  if (isHost(game)) spawnFood(game, dt, net);

  electPredator(game, dt);

  if (now - game.lastSent >= 1000 / SEND_HZ) {
    game.lastSent = now;
    net.send(NetEvent.STATE, toStatePayload(me));
  }
}

function catchPlayers(game, me, net) {
  const myRadius = CLASS_DEFS[me.classId].radius;

  for (const [id, other] of game.players) {
    if (id === game.localId) continue;
    if (other.status !== Status.ALIVE) continue;

    const reach = myRadius + CLASS_DEFS[other.classId].radius;
    if (Math.hypot(other.x - me.x, other.y - me.y) > reach) continue;

    me.score += SCORE_PLAYER;
    me.boostLeft = BOOST_S;
    kill(other);

    if (other.isDummy) continue;

    me.role = Role.PREY;
    net.send(NetEvent.CATCH, { victim: other.id });
    return;
  }
}

function catchFood(game, me, net) {
  const myRadius = CLASS_DEFS[me.classId].radius;

  for (const [id, food] of game.foods) {
    if (!isEdible(food)) continue;
    if (Math.hypot(food.x - me.x, food.y - me.y) > myRadius + FOOD_RADIUS) continue;

    game.foods.delete(id);
    me.score += SCORE_FOOD;
    me.boostLeft = BOOST_S;
    net.send(NetEvent.FOOD_EATEN, { id });
  }
}

function isHost(game) {
  let host = null;
  for (const [id, player] of game.players) {
    if (player.isDummy) continue;
    if (host === null || id < host) host = id;
  }
  return host === game.localId;
}

function spawnFood(game, dt, net) {
  game.foodTimer -= dt;
  if (game.foodTimer > 0) return;
  game.foodTimer = FOOD_INTERVAL_S;
  if (game.foods.size >= FOOD_MAX) return;

  const position = randomFoodPosition(game.world);
  const id = `${game.localId}:${game.nextFoodId++}`;
  game.foods.set(id, createFood(id, position.x, position.y));
  net.send(NetEvent.FOOD_SPAWN, { id, x: position.x, y: position.y });
}

function electPredator(game, dt) {
  for (const player of game.players.values()) {
    if (player.role === Role.PREDATOR) {
      game.noPredatorFor = 0;
      return;
    }
  }

  game.noPredatorFor += dt;
  if (game.noPredatorFor < ROLE_GRACE_S) return;
  if (!isHost(game)) return;

  const me = game.players.get(game.localId);
  if (me.status === Status.ALIVE) me.role = Role.PREDATOR;
}

export function toggleDummy(game) {
  if (game.players.has(DUMMY_ID)) {
    game.players.delete(DUMMY_ID);
    return;
  }

  const spawn = pickSpawn(game.players, DUMMY_ID, game.world);
  game.players.set(
    DUMMY_ID,
    createPlayer({
      id: DUMMY_ID,
      name: "DUMMY",
      classId: PlayerClass.BALANCED,
      role: Role.PREY,
      x: spawn.x,
      y: spawn.y,
      isDummy: true,
    }),
  );
}

export function handleState(game, payload) {
  if (payload.id === game.localId) return;

  let player = game.players.get(payload.id);
  if (!player) {
    player = createPlayer({
      id: payload.id,
      name: payload.name,
      classId: payload.classId,
      role: payload.role,
      x: payload.x,
      y: payload.y,
    });
    game.players.set(payload.id, player);
  }

  applyStatePayload(player, payload);
}

export function handleCatch(game, payload) {
  if (payload.victim !== game.localId) return;

  const me = game.players.get(game.localId);
  if (me.status !== Status.ALIVE) return;
  kill(me);
}

export function handleBye(game, payload) {
  game.players.delete(payload.id);
}

export function handleFoodSpawn(game, payload) {
  if (game.foods.has(payload.id)) return;
  game.foods.set(payload.id, createFood(payload.id, payload.x, payload.y));
}

export function handleFoodEaten(game, payload) {
  game.foods.delete(payload.id);
}

export function handleFoodSync(game, payload) {
  for (const food of payload.foods) {
    if (game.foods.has(food.id)) continue;
    game.foods.set(food.id, createFood(food.id, food.x, food.y, 0));
  }
}

export function handleHello(game, net) {
  net.send(NetEvent.STATE, toStatePayload(game.players.get(game.localId)));
  if (!isHost(game)) return;

  net.send(NetEvent.FOOD_SYNC, {
    foods: [...game.foods.values()].map((food) => ({ id: food.id, x: food.x, y: food.y })),
  });
}
