import { MAP_CELL, Status } from "./config.js";
import { isSolid } from "./map.js";
import { hasLineOfSight, visibilityPolygon } from "./vision.js";
import { bodies } from "./bodies.js";
import { ENTITY_DEFS } from "./entities/index.js";

export function draw(ctx, world, game, now) {
  const me = game.players.get(game.localId);
  ctx.clearRect(0, 0, world.W, world.H);
  drawGrid(ctx, world);
  drawWalls(ctx, world);

  for (const body of bodies(game)) {
    const def = ENTITY_DEFS[body.kind];
    const visible = def.isVisible
      ? def.isVisible(body, me, game)
      : hasLineOfSight(world.map, me, body);
    if (visible) def.draw(ctx, body, me, now);
  }

  drawVisionShade(ctx, world, me);
  drawOverlay(ctx, world, game);
}

function drawGrid(ctx, world) {
  ctx.strokeStyle = "#242424";
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.W; x += MAP_CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.H);
    ctx.stroke();
  }
  for (let y = 0; y <= world.H; y += MAP_CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.W, y);
    ctx.stroke();
  }
}

function drawWalls(ctx, world) {
  for (let row = 0; row < world.map.rows; row++) {
    for (let col = 0; col < world.map.cols; col++) {
      if (!isSolid(world.map, col, row)) continue;
      ctx.fillStyle = "#343434";
      ctx.fillRect(col * world.map.cell, row * world.map.cell, world.map.cell, world.map.cell);
    }
  }
}

function drawVisionShade(ctx, world, origin) {
  const points = visibilityPolygon(world.map, origin);
  ctx.beginPath();
  ctx.rect(0, 0, world.W, world.H);
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fill("evenodd");
}


function drawOverlay(ctx, world, game) {
  const me = game.players.get(game.localId);

  if (me && me.status === Status.CHOOSING) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(
      `Choose a class (1-${Object.keys(CLASS_DEFS).length})`,
      world.W / 2,
      world.H / 2,
    );
  } else if (me && me.status === Status.DEAD) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.fillText("Caught! Respawning…", world.W / 2, world.H / 2);
  }
}
