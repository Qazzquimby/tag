import { Shape } from "../config.js";
import { createRocket, EXPLODE_SPEED, ROCKET_FRICTION } from "../entities/rocket.js";
import launchSound from "../assets/sfx/demoman/sticky_launch.mp3";

const LAUNCH_COOLDOWN = 1.2;
const MIN_LAUNCH_SPEED = 400;
const MAX_LAUNCH_DISTANCE = 500;

const rocketJumper = {
  name: "Rocket Jumper",
  shape: Shape.CIRCLE,
  symbol: "🚀",
  radius: 12,
  accel: 1300,
  maxSpeed: 210,
  friction: 4,
  primary: {
    label: "Rocket",
    sound: launchSound,
    volume: 0.3,
    cooldown: LAUNCH_COOLDOWN,
    use({ self, controls, game }) {
      const aimDistance = Math.hypot(controls.aim.x - self.x, controls.aim.y - self.y);
      const distance = Math.min(aimDistance, MAX_LAUNCH_DISTANCE);
      const speed = Math.max(MIN_LAUNCH_SPEED, distance * ROCKET_FRICTION + EXPLODE_SPEED);
      const id = `rocket:${game.localId}:${game.nextEntityId++}`;
      game.entities.set(
        id,
        createRocket(self, id, Math.cos(self.aim) * speed, Math.sin(self.aim) * speed),
      );
    },
  },
};

export default Object.freeze(rocketJumper);
