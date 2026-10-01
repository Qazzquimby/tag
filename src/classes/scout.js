import { Shape } from "../config.js";

export default Object.freeze({
  name: "Scout",
  shape: Shape.TRIANGLE,
  symbol: "⚡",
  radius: 11,
  accel: 1800,
  maxSpeed: 400,
  friction: 2.5,
  adjustIntent({ self, controls }, intent) {
    if (!controls.primary) return;
    intent.moveX = Math.cos(self.aim);
    intent.moveY = Math.sin(self.aim);
    intent.accel = 3200;
    intent.friction = 0;
  },
});
