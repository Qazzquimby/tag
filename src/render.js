import {
  CLASS_DEFS,
  FOOD_COLOR,
  FOOD_RADIUS,
  MAP_CELL,
  RELATION_COLORS,
  Shape,
  Status,
} from "./config.js";
import { isSolid } from "./map.js";
import { relationTo } from "./ranking.js";
import { hasLineOfSight, visibilityPolygon } from "./vision.js";

export function draw(ctx, world, game, now) {
  const me = game.players.get(game.localId);
  ctx.clearRect(0, 0, world.W, world.H);
  drawGrid(ctx, world);
  drawWalls(ctx, world);

  for (const food of game.foods.values()) {
    if (hasLineOfSight(world.map, me, food)) drawFood(ctx, food, now);
  }

  for (const player of game.players.values()) {
    if (player.status === Status.CHOOSING) continue;
    if (player.id === game.localId || hasLineOfSight(world.map, me, player)) {
      drawPlayer(ctx, player, me, now);
    }
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

function drawFood(ctx, food, now) {
  if (food.warningLeft > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 120);
    ctx.beginPath();
    ctx.arc(food.x, food.y, FOOD_RADIUS + 6, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = FOOD_COLOR;
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    return;
  }

  ctx.beginPath();
  ctx.arc(food.x, food.y, FOOD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = FOOD_COLOR;
  ctx.fill();
}

function drawPlayer(ctx, player, viewer, now) {
  if (player.status === Status.DEAD) return;

  const def = CLASS_DEFS[player.classId];
  const color = RELATION_COLORS[relationTo(viewer, player)];

  if (player.status === Status.SPAWNING) {
    drawSpawnWarning(ctx, player, def, color, now);
    return;
  }

  drawShape(ctx, player, def, color, player.id === viewer.id);
  drawSymbol(ctx, player, def);
  drawAimArrow(ctx, player, def, color);
  drawLabel(ctx, player, def);
}

function drawShape(ctx, player, def, color, isSelf) {
  ctx.beginPath();
  if (def.shape === Shape.CIRCLE) {
    ctx.arc(player.x, player.y, def.radius, 0, Math.PI * 2);
  } else if (def.shape === Shape.SQUARE) {
    ctx.rect(player.x - def.radius, player.y - def.radius, def.radius * 2, def.radius * 2);
  } else {
    const r = def.radius;
    ctx.moveTo(player.x, player.y - r);
    ctx.lineTo(player.x + r * 0.866, player.y + r * 0.5);
    ctx.lineTo(player.x - r * 0.866, player.y + r * 0.5);
    ctx.closePath();
  }

  ctx.fillStyle = color;
  ctx.fill();

  if (isSelf) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawSymbol(ctx, player, def) {
  ctx.font = `${Math.round(def.radius * 1.3)}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(def.symbol, player.x, player.y);
  ctx.textBaseline = "alphabetic";
}

function drawAimArrow(ctx, player, def, color) {
  const start = def.radius + 4;
  const end = def.radius + 16;
  const cos = Math.cos(player.aim);
  const sin = Math.sin(player.aim);

  ctx.beginPath();
  ctx.moveTo(player.x + cos * start, player.y + sin * start);
  ctx.lineTo(player.x + cos * end, player.y + sin * end);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpawnWarning(ctx, player, def, color, now) {
  const pulse = 0.5 + 0.5 * Math.sin(now / 100);
  ctx.beginPath();
  ctx.arc(player.x, player.y, def.radius + 8, 0, Math.PI * 2);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4 + 0.6 * pulse;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}

function drawLabel(ctx, player, def) {
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ddd";
  ctx.fillText(player.name, player.x, player.y - def.radius - 10);
}


function drawOverlay(ctx, world, game) {
  const me = game.players.get(game.localId);

  if (me && me.status === Status.CHOOSING) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("Choose a class (1-3)", world.W / 2, world.H / 2);
  } else if (me && me.status === Status.DEAD) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.fillText("Caught! Respawning…", world.W / 2, world.H / 2);
  }
}
