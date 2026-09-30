import { FOOD_RADIUS, FOOD_WARNING_S } from "./config.js";
import { randomFreePosition } from "./map.js";

export function createFood(id, x, y, warningLeft = FOOD_WARNING_S) {
  return { id, x, y, warningLeft };
}

export function updateFoods(foods, dt) {
  for (const food of foods.values()) {
    if (food.warningLeft > 0) food.warningLeft = Math.max(0, food.warningLeft - dt);
  }
}

export function isEdible(food) {
  return food.warningLeft <= 0;
}

export function randomFoodPosition(world) {
  return randomFreePosition(world, FOOD_RADIUS);
}
