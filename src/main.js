import { createClient } from "@supabase/supabase-js";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const roomInput = document.querySelector("#room");
const createBtn = document.querySelector("#create");
const joinBtn = document.querySelector("#join");
const copyBtn = document.querySelector("#copy");

const W = canvas.width;
const H = canvas.height;
const SPEED = 360;
const SEND_HZ = 10;

let supabase = null;
let channel = null;
let roomCode = null;
let playerId = crypto.randomUUID();
let myPlayer = null;
let lastSent = 0;
let lastFrame = performance.now();

const players = new Map();
const mouse = { x: W / 2, y: H / 2 };

function setStatus(text) {
  statusEl.textContent = text;
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function randomSpawn() {
  return {
    x: 100 + Math.random() * (W - 200),
    y: 100 + Math.random() * (H - 200),
  };
}

function ensureSupabase() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.");
  }
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

async function leaveRoom() {
  if (channel && supabase) {
    await supabase.removeChannel(channel);
  }
  channel = null;
  roomCode = null;
  myPlayer = null;
  players.clear();
  copyBtn.hidden = true;
}

async function enterRoom(code) {
  ensureSupabase();
  await leaveRoom();

  roomCode = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(roomCode)) {
    throw new Error("Room code must be 3–8 letters/numbers.");
  }

  const spawn = randomSpawn();
  myPlayer = {
    id: playerId,
    x: spawn.x,
    y: spawn.y,
    tx: spawn.x,
    ty: spawn.y,
  };
  players.set(playerId, myPlayer);

  channel = supabase.channel(`dot-duel:${roomCode}`, {
    config: { broadcast: { self: true } }
  });

  channel
    .on("broadcast", { event: "state" }, ({ payload }) => {
      if (!payload || payload.id === playerId) return;

      const existing = players.get(payload.id);
      if (existing) {
        existing.tx = payload.x;
        existing.ty = payload.y;
      } else {
        players.set(payload.id, {
          id: payload.id,
          x: payload.x,
          y: payload.y,
          tx: payload.x,
          ty: payload.y,
        });
      }
    })
    .on("broadcast", { event: "hello" }, async ({ payload }) => {
      if (payload?.id === playerId) return;
      await broadcastState();
    })
    .on("broadcast", { event: "bye" }, ({ payload }) => {
      if (payload?.id) players.delete(payload.id);
    });

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      setStatus(`Room ${roomCode} — share the link. ${players.size === 1 ? "Waiting for another player…" : ""}`);
      copyBtn.hidden = false;
      await channel.send({
        type: "broadcast",
        event: "hello",
        payload: { id: playerId }
      });
    }
  });

  history.replaceState({}, "", `${location.pathname}?room=${roomCode}`);
}

async function broadcastState() {
  if (!channel || !myPlayer) return;
  await channel.send({
    type: "broadcast",
    event: "state",
    payload: {
      id: playerId,
      x: myPlayer.x,
      y: myPlayer.y,
    }
  });
}

function update(dt) {
  if (!myPlayer) return;

  const dx = mouse.x - myPlayer.x;
  const dy = mouse.y - myPlayer.y;
  const distance = Math.hypot(dx, dy);

  if (distance > 1) {
    const step = Math.min(distance, SPEED * dt);
    myPlayer.x += (dx / distance) * step;
    myPlayer.y += (dy / distance) * step;
    myPlayer.x = Math.max(16, Math.min(W - 16, myPlayer.x));
    myPlayer.y = Math.max(16, Math.min(H - 16, myPlayer.y));
  }

  const now = performance.now();
  if (now - lastSent >= 1000 / SEND_HZ) {
    lastSent = now;
    broadcastState();
  }

  // Smooth remote dots toward their latest network position.
  for (const [id, p] of players) {
    if (id === playerId) continue;
    const t = Math.min(1, dt * 12);
    p.x += (p.tx - p.x) * t;
    p.y += (p.ty - p.y) * t;
  }

  statusEl.textContent =
    roomCode
      ? `Room ${roomCode} · ${players.size} player${players.size === 1 ? "" : "s"}`
      : "Create a room to start.";
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Subtle grid.
  ctx.strokeStyle = "#242424";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  for (const [id, p] of players) {
    const mine = id === playerId;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = mine ? "#fff" : "#888";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 19, 0, Math.PI * 2);
    ctx.strokeStyle = mine ? "#fff" : "#666";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#aaa";
    ctx.fillText(mine ? "YOU" : "PLAYER", p.x, p.y - 28);
  }
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function updateMouse(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (event.clientX - rect.left) * (W / rect.width);
  mouse.y = (event.clientY - rect.top) * (H / rect.height);
}

canvas.addEventListener("mousemove", updateMouse);

createBtn.addEventListener("click", async () => {
  try {
    const code = makeRoomCode();
    roomInput.value = code;
    await enterRoom(code);
  } catch (err) {
    setStatus(err.message);
  }
});

joinBtn.addEventListener("click", async () => {
  try {
    await enterRoom(roomInput.value);
  } catch (err) {
    setStatus(err.message);
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy link"), 1200);
});

window.addEventListener("beforeunload", () => {
  if (channel) {
    channel.send({
      type: "broadcast",
      event: "bye",
      payload: { id: playerId }
    });
  }
});

const initialRoom = new URLSearchParams(location.search).get("room");
if (initialRoom) {
  roomInput.value = initialRoom;
  enterRoom(initialRoom).catch((err) => setStatus(err.message));
}

requestAnimationFrame(frame);
