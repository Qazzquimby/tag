import "./style.css";
import { NetEvent, PlayerClass, Status } from "./config.js";
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
import { createMap } from "./map.js";
import { createClassPicker, renderScoreboard } from "./hud.js";
import { getRoomCode, joinRoom, leaveRoom, send } from "./net.js";
import { computeStandings, createRankTracker } from "./scoreboard.js";
import { draw } from "./render.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const nameInput = document.querySelector("#name");
const roomInput = document.querySelector("#room");
const createBtn = document.querySelector("#create");
const joinBtn = document.querySelector("#join");
const copyBtn = document.querySelector("#copy");
const scoreboardEl = document.querySelector("#scoreboard");
const classPickerEl = document.querySelector("#class-picker");

const world = {
  W: canvas.width,
  H: canvas.height,
  map: createMap(canvas.width, canvas.height),
};
const playerId = crypto.randomUUID();
const tracker = createRankTracker();
const net = { send };

let game = null;
let errorText = "";
let lastFrame = performance.now();
let selectedClass = PlayerClass.BALANCED;

const NAME_KEY = "dot-duel:name";

function loadName() {
  return localStorage.getItem(NAME_KEY) || playerId.slice(0, 4).toUpperCase();
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function chooseClass(classId) {
  if (game) {
    const me = game.players.get(game.localId);
    if (me.status === Status.ALIVE) return;
    me.classId = classId;
  }
  selectedClass = classId;
}

const input = createInput(canvas, world, {
  selectClass: chooseClass,
  toggleDummy() {
    if (game) toggleDummy(game);
  },
});

const updateClassPicker = createClassPicker(classPickerEl, chooseClass);

function updateStatus() {
  if (errorText) {
    statusEl.textContent = errorText;
    return;
  }
  if (!game) {
    statusEl.textContent = "Create a room to start.";
    return;
  }

  const count = game.players.size;
  const waiting = count === 1 ? " · Waiting for another player…" : "";
  statusEl.textContent = `Room ${getRoomCode()} · ${count} player${count === 1 ? "" : "s"}${waiting}`;
}

async function enterRoom(code) {
  errorText = "";
  await leaveRoom();

  const name = (nameInput.value.trim().slice(0, 8) || loadName().trim().slice(0, 8));
  nameInput.value = name;
  localStorage.setItem(NAME_KEY, name);
  game = createGame(playerId, world, name, selectedClass);

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
    renderScoreboard(scoreboardEl, standings);
    draw(ctx, world, game, now);
  }

  const me = game ? game.players.get(game.localId) : null;
  updateClassPicker(!me || me.status !== Status.ALIVE, selectedClass);
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

nameInput.value = loadName();

const initialRoom = new URLSearchParams(location.search).get("room");
if (initialRoom) {
  roomInput.value = initialRoom;
  enterRoom(initialRoom).catch((err) => (errorText = err.message));
}

requestAnimationFrame(frame);
