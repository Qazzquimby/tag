import {
  BOOST_S,
  FOOD_COLOR,
  FOOD_RADIUS,
  FOOD_WARNING_S,
  NetEvent,
  SCORE_FOOD,
  EntityKind,
} from "../config.js";
import { addScore } from "../player.js";
import { randomFreePosition } from "../map.js";
import { createEntity } from "./entity.js";
import clonePopSound from "../assets/sfx/clone/vanish.mp3";

export function createFood(id, x, y, warningLeft = FOOD_WARNING_S) {
  return createEntity({
    id,
    kind: EntityKind.FOOD,
    x,
    y,
    radius: FOOD_RADIUS,
    warningLeft,
    interactive: warningLeft <= 0,
    collides: false,
  });
}

export function randomFoodPosition(world) {
  return randomFreePosition(world, FOOD_RADIUS);
}

export const FOOD_DEF = Object.freeze({
  update(food, dt) {
    food.warningLeft = Math.max(0, food.warningLeft - dt);
    food.interactive = food.warningLeft <= 0;
  },
  draw(ctx, food, viewer, now) {
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
  },
  onTouch(food, toucher, game, net) {
    game.sfx.play(eatFoodSound, entity, game.players.get(game.localId));
    game.entities.delete(food.id);
    addScore(toucher, SCORE_FOOD);
    toucher.boostLeft = BOOST_S;
    net.send(NetEvent.FOOD_EATEN, { id: food.id });
  },
});
