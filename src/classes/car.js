import { Shape } from "../config.js";
import { moveWithCollision } from "../collision.js";

const ENGINE_ACCEL = 700;
const MAX_SPEED = 420;
const REVERSE_SPEED = 150;
const STEER_RATE = 3.0;
const FULL_STEER_SPEED = 120;
const ROLL_FRICTION = 0.6;
const GRIP = 10;
const DRIFT_GRIP = 1.2;

function accelerate(along, throttle, dt) {
  if (throttle > 0) return Math.min(along + ENGINE_ACCEL * dt, Math.max(along, MAX_SPEED));
  if (throttle < 0) return Math.max(along - ENGINE_ACCEL * dt, Math.min(along, -REVERSE_SPEED));
  return along;
}

const car = {
  name: "Car",
  shape: Shape.SQUARE,
  symbol: "🚗",
  radius: 13,
  accel: ENGINE_ACCEL,
  maxSpeed: MAX_SPEED,
  friction: ROLL_FRICTION,
  bounce: 0.4,
  createState() {
    return { heading: 0 };
  },
  move({ self, controls, dt, game }) {
    const state = self.classState;
    const throttle = -Math.sign(controls.move.y);
    const steer = Math.sign(controls.move.x);

    const speed = self.vx * Math.cos(state.heading) + self.vy * Math.sin(state.heading);
    const steerScale = Math.max(-1, Math.min(1, speed / FULL_STEER_SPEED));
    state.heading += steer * STEER_RATE * steerScale * dt;

    const forward = { x: Math.cos(state.heading), y: Math.sin(state.heading) };
    const side = { x: -forward.y, y: forward.x };
    let along = self.vx * forward.x + self.vy * forward.y;
    let across = self.vx * side.x + self.vy * side.y;
    along = accelerate(along, throttle, dt) * Math.exp(-ROLL_FRICTION * dt);
    across *= Math.exp(-(controls.secondary ? DRIFT_GRIP : GRIP) * dt);

    self.vx = forward.x * along + side.x * across;
    self.vy = forward.y * along + side.y * across;
    self.aim = state.heading;
    moveWithCollision(self, self.radius, dt, game.world.map, car.bounce);
  },
  primary: {
    label: "Horn",
    cooldown: 0.3,
    repeatWhileHeld: true,
    use() {},
  },
  secondary: {
    label: "Drift",
    cooldown: 0,
    meter: () => 1,
    use() {},
  },
};

export default Object.freeze(car);
