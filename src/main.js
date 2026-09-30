import "./style.css";
import { NetEvent, Role } from "./config.js";
import {
  createGame,
  handleBye,
  handleCatch,
  handleFoodEaten,
  handleFoodSpawn,
  handleFoodSync,
  handleHello,
  handleState,
  toggleDummy,
  updateGame,
} from "./game.js";
import { createInput } from "./input.js";
import { getRoomCode, joinRoom, leaveRoom, send } from "./net.js";
import { computeStandings, createRankTracker } from "./scoreboard.js";
import { draw } from "./render.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const roomInput = document.querySelector("#room");
const createBtn = document.querySelector("#create");
const joinBtn = document.querySelector("#join");
const copyBtn = document.querySelector("#copy");

const world = { W: canvas.width, H: canvas.height };
const playerId = crypto.randomUUID();
const tracker = createRankTracker();
const net = { send };

let game = null;
let errorText = "";
let lastFrame = performance.now();

const NAME_KEY = "dot-duel:name";

function loadName() {
  return localStorage.getItem(NAME_KEY) || playerId.slice(0, 4).toUpperCase();
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const input = createInput(canvas, world, {
  selectClass(classId) {
    if (game) game.players.get(game.localId).classId = classId;
  },
  toggleDummy() {
    if (game) toggleDummy(game);
  },
  rename() {
    if (!game) return;
    const me = game.players.get(game.localId);
    const next = window.prompt("Display name (max 8 characters)", me.name);
    if (next === null) return;
    const trimmed = next.trim().slice(0, 8);
    if (!trimmed) return;
    me.name = trimmed;
    localStorage.setItem(NAME_KEY, trimmed);
  },
});

function updateStatus() {
  if (errorText) {
    statusEl.textContent = errorText;
    return;
  }
  if (!game) {
    statusEl.textContent = "Create a room to start.";
    return;
  }

  const me = game.players.get(game.localId);
  const role = me.role === Role.PREDATOR ? "Predator" : "Prey";
  const count = game.players.size;
  const waiting = count === 1 ? " · Waiting for another player…" : "";
  statusEl.textContent = `Room ${getRoomCode()} · ${role} · ${count} player${count === 1 ? "" : "s"}${waiting}`;
}

async function enterRoom(code) {
  errorText = "";
  await leaveRoom();
  game = createGame(playerId, world, loadName());

  await joinRoom(
    code,
    playerId,
    {
      [NetEvent.STATE]: (payload) => handleState(game, payload),
      [NetEvent.HELLO]: () => handleHello(game, net),
      [NetEvent.BYE]: (payload) => handleBye(game, payload),
      [NetEvent.CATCH]: (payload) => handleCatch(game, payload),
      [NetEvent.FOOD_SPAWN]: (payload) => handleFoodSpawn(game, payload),
      [NetEvent.FOOD_EATEN]: (payload) => handleFoodEaten(game, payload),
      [NetEvent.FOOD_SYNC]: (payload) => handleFoodSync(game, payload),
    },
    () => {
      copyBtn.hidden = false;
      send(NetEvent.HELLO, { id: playerId });
    },
  );
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (game) {
    updateGame(game, input, dt, net);
    const standings = computeStandings(game.players, tracker, game.localId, now);
    draw(ctx, world, game, standings, now);
  }

  updateStatus();
  requestAnimationFrame(frame);
}

createBtn.addEventListener("click", async () => {
  try {
    const code = makeRoomCode();
    roomInput.value = code;
    await enterRoom(code);
  } catch (err) {
    errorText = err.message;
  }
});

joinBtn.addEventListener("click", async () => {
  try {
    await enterRoom(roomInput.value);
  } catch (err) {
    errorText = err.message;
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy link"), 1200);
});

const initialRoom = new URLSearchParams(location.search).get("room");
if (initialRoom) {
  roomInput.value = initialRoom;
  enterRoom(initialRoom).catch((err) => (errorText = err.message));
}

requestAnimationFrame(frame);
