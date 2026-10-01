import {
  BOOST_S,
  FOOD_INTERVAL_S,
  FOOD_MAX,
  FOOD_RADIUS,
  NetEvent,
  Relation,
  ROUND_RESULT_S,
  ROUND_S,
  SCORE_FOOD,
  SCORE_PLAYER,
  SEND_HZ,
  STALE_S,
  Status,
} from "./config.js";
import { CLASS_DEFS, PlayerClass } from "./classes/index.js";
import { createFood, isEdible, randomFoodPosition, updateFoods } from "./food.js";
import {
  addScore,
  applyStatePayload,
  createPlayer,
  kill,
  pickSpawn,
  respawn,
  smoothRemote,
  startRound,
  toStatePayload,
  updateOwned,
} from "./player.js";
import { compareRank, relationTo } from "./ranking.js";

export const DUMMY_ID = "dummy";

const NO_CONTROLS = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  primary: false,
  secondary: false,
  primaryPressed: false,
  secondaryPressed: false,
};

export function createGame(localId, world, name) {
  const game = {
    localId,
    world,
    players: new Map(),
    foods: new Map(),
    foodTimer: FOOD_INTERVAL_S,
    lastSent: 0,
    nextFoodId: 1,
    roundStartedAt: Date.now(),
    roundResult: null,
  };

  const spawn = pickSpawn(game.players, localId, world);
  game.players.set(
    localId,
    createPlayer({
      id: localId,
      name,
      status: Status.CHOOSING,
      x: spawn.x,
      y: spawn.y,
    }),
  );

  return game;
}

export function selectClass(game, classId) {
  const me = game.players.get(game.localId);
  if (me.status === Status.ALIVE) return;

  me.classId = classId;
  if (me.status === Status.CHOOSING) respawn(me, game.players, game.world);
}

function sendState(game, net) {
  const me = game.players.get(game.localId);
  if (me.status === Status.CHOOSING) return;
  net.send(NetEvent.STATE, toStatePayload(me));
}

export function roundSecondsLeft(game) {
  return Math.max(
    0,
    Math.ceil((ROUND_S * 1000 - (Date.now() - game.roundStartedAt)) / 1000),
  );
}

function updateRound(game) {
  const elapsed = Date.now() - game.roundStartedAt;
  const roundMs = ROUND_S * 1000;
  if (elapsed < roundMs) return;

  const winner = [...game.players.values()].sort(compareRank)[0];
  game.roundResult = {
    winnerName: winner && winner.score > 0 ? winner.name : null,
    winnerScore: winner?.score ?? 0,
    until: performance.now() + ROUND_RESULT_S * 1000,
  };
  game.roundStartedAt += Math.floor(elapsed / roundMs) * roundMs;

  for (const player of [game.players.get(game.localId), game.players.get(DUMMY_ID)]) {
    if (player && player.status !== Status.CHOOSING) {
      startRound(player, game.players, game.world);
    }
  }
}

export function updateGame(game, input, dt, net) {
  const me = game.players.get(game.localId);
  const controls = input.getControls();
  updateOwned(me, controls, dt, game);

  const dummy = game.players.get(DUMMY_ID);
  if (dummy) updateOwned(dummy, NO_CONTROLS, dt, game);
  updateRound(game);

  const now = performance.now();
  for (const [id, player] of game.players) {
    if (id === game.localId || player.isDummy) continue;
    smoothRemote(player, dt);
    if (now - player.lastSeen > STALE_S * 1000) game.players.delete(id);
  }

  for (const player of [me, dummy]) {
    if (!player || player.status !== Status.ALIVE) continue;
    catchPlayers(game, player, net);
    catchFood(game, player, net);
  }

  updateFoods(game.foods, dt);
  if (isHost(game)) spawnFood(game, dt, net);

  if (now - game.lastSent >= 1000 / SEND_HZ) {
    game.lastSent = now;
    sendState(game, net);
  }
}

function catchPlayers(game, catcher, net) {
  const myRadius = CLASS_DEFS[catcher.classId].radius;

  for (const other of game.players.values()) {
    if (other === catcher) continue;
    if (other.status !== Status.ALIVE) continue;
    if (relationTo(catcher, other) !== Relation.ABOVE) continue;

    const reach = myRadius + CLASS_DEFS[other.classId].radius;
    if (Math.hypot(other.x - catcher.x, other.y - catcher.y) > reach) continue;

    addScore(catcher, SCORE_PLAYER);
    catcher.boostLeft = BOOST_S;
    kill(other);

    if (!other.isDummy) net.send(NetEvent.CATCH, { victim: other.id });
  }
}

function catchFood(game, catcher, net) {
  const myRadius = CLASS_DEFS[catcher.classId].radius;

  for (const [id, food] of game.foods) {
    if (!isEdible(food)) continue;
    if (Math.hypot(food.x - catcher.x, food.y - catcher.y) > myRadius + FOOD_RADIUS) continue;

    game.foods.delete(id);
    addScore(catcher, SCORE_FOOD);
    catcher.boostLeft = BOOST_S;
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
  game.roundStartedAt = payload.roundStartedAt;
  for (const food of payload.foods) {
    if (game.foods.has(food.id)) continue;
    game.foods.set(food.id, createFood(food.id, food.x, food.y, 0));
  }
}

export function handleHello(game, net) {
  sendState(game, net);
  if (!isHost(game)) return;

  net.send(NetEvent.FOOD_SYNC, {
    roundStartedAt: game.roundStartedAt,
    foods: [...game.foods.values()].map((food) => ({ id: food.id, x: food.x, y: food.y })),
  });
}
