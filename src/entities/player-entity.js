import {
  BOOST_S,
  EntityKind,
  NetEvent,
  RELATION_COLORS,
  Relation,
  SCORE_PLAYER,
  Status,
  Shape,
} from "../config.js";
import { CLASS_DEFS } from "../classes/index.js";
import { addScore, kill } from "../player.js";
import { relationTo } from "../ranking.js";
import { hasLineOfSight } from "../vision.js";
import { drawShape, drawSymbol, drawLabel } from "../render-shapes.js";

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

export const PLAYER_DEF = Object.freeze({
  isVisible(player, viewer, game) {
    if (player.status === Status.CHOOSING) return false;
    return player.id === viewer.id || hasLineOfSight(game.world.map, viewer, player);
  },
  draw(ctx, player, viewer, now) {
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
  },
  onTouch(other, catcher, game, net) {
    if (relationTo(catcher, other) !== Relation.ABOVE) return;

    addScore(catcher, SCORE_PLAYER);
    catcher.boostLeft = BOOST_S;
    kill(other);
    if (!other.isDummy) net.send(NetEvent.CATCH, { victim: other.id });
  },
});
