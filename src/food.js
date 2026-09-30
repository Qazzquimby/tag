import { FOOD_WARNING_S } from "./config.js";

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
  return {
    x: 60 + Math.random() * (world.W - 120),
    y: 60 + Math.random() * (world.H - 120),
  };
}
