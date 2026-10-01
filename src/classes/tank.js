import { Shape } from "../config.js";

export default Object.freeze({
  name: "Tank",
  shape: Shape.SQUARE,
  symbol: "🛡",
  radius: 16,
  accel: 900,
  maxSpeed: 250,
  friction: 6,
});
