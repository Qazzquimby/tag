import {
  CLASS_DEFS,
  FOOD_RADIUS,
  RELATION_COLORS,
  ROLE_COLORS,
  Role,
  Shape,
  Status,
} from "./config.js";

export function draw(ctx, world, game, standings, now) {
  ctx.clearRect(0, 0, world.W, world.H);
  drawGrid(ctx, world);

  for (const food of game.foods.values()) drawFood(ctx, food, now);
  for (const player of game.players.values()) drawPlayer(ctx, player, game.localId, now);

  drawScoreboard(ctx, world, standings);
  drawOverlay(ctx, world, game);
}

function drawGrid(ctx, world) {
  ctx.strokeStyle = "#242424";
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.W; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.H);
    ctx.stroke();
  }
  for (let y = 0; y <= world.H; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.W, y);
    ctx.stroke();
  }
}

function drawFood(ctx, food, now) {
  if (food.warningLeft > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 120);
    ctx.beginPath();
    ctx.arc(food.x, food.y, FOOD_RADIUS + 6, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = ROLE_COLORS[Role.PREY];
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    return;
  }

  ctx.beginPath();
  ctx.arc(food.x, food.y, FOOD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = ROLE_COLORS[Role.PREY];
  ctx.fill();
}

function drawPlayer(ctx, player, localId, now) {
  if (player.status === Status.DEAD) return;

  const def = CLASS_DEFS[player.classId];
  const color = ROLE_COLORS[player.role];

  if (player.status === Status.SPAWNING) {
    drawSpawnWarning(ctx, player, def, color, now);
    return;
  }

  drawShape(ctx, player, def, color, player.id === localId);
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

function drawScoreboard(ctx, world, standings) {
  const x = world.W - 16;
  let y = 24;

  ctx.font = "13px system-ui";
  ctx.textAlign = "right";

  for (const row of standings) {
    ctx.fillStyle = RELATION_COLORS[row.relation];
    ctx.fillText(`${row.rank}. ${row.name} ${row.score}`, x - 16, y);

    if (row.delta !== 0) {
      ctx.fillStyle = row.delta > 0 ? "#3ddc84" : "#ff4d4d";
      ctx.fillText(row.delta > 0 ? "▲" : "▼", x, y);
    }

    y += 18;
  }
}

function drawOverlay(ctx, world, game) {
  const me = game.players.get(game.localId);

  if (me && me.status === Status.DEAD) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4d4d";
    ctx.fillText("Caught! Respawning…", world.W / 2, world.H / 2);
  }

  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillStyle = "#777";
  ctx.fillText("WASD move · 1-3 class · N rename · B dummy", world.W / 2, world.H - 12);
}
