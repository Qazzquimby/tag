import { Shape } from "../config.js";
import { lastFreePointAlong } from "../collision.js";
import blinkSound from "../assets/sfx/tracer/blink.mp3";
import recallSound from "../assets/sfx/tracer/recall.mp3";

const BLINK_DISTANCE = 150;
const BLINK_COOLDOWN = 3;
const RECALL_S = 2;
const RECALL_COOLDOWN = 8;

export default Object.freeze({
  name: "Tracer",
  shape: Shape.CIRCLE,
  symbol: "⏱️",
  radius: 12,
  accel: 9999999,
  maxSpeed: 220,
  friction: 8,
  createState() {
    return { elapsed: 0, history: [] };
  },
  update({ self, dt }) {
    const state = self.classState;
    state.elapsed += dt;
    state.history.push({ t: state.elapsed, x: self.x, y: self.y });
    while (
      state.history.length > 1 &&
      state.history[1].t <= state.elapsed - RECALL_S
    ) {
      state.history.shift();
    }
  },
  primary: {
    label: "Blink",
    sound: blinkSound,
    cooldown: BLINK_COOLDOWN,
    use({ self, controls, game }) {
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.hypot(dx, dy);
      if (distance === 0) return;

      const travel = Math.min(BLINK_DISTANCE, distance);
      const from = { x: self.x, y: self.y };
      const to = {
        x: self.x + (dx / distance) * travel,
        y: self.y + (dy / distance) * travel,
      };
      const destination = lastFreePointAlong(game.world.map, self.radius, from, to);
      self.x = destination.x;
      self.y = destination.y;
    },
  },
  secondary: {
    label: "RECALL",
    sound: recallSound,
    cooldown: RECALL_COOLDOWN,
    use({ self }) {
      const state = self.classState;
      const destination = state.history[0];
      if (!destination) return;
      self.x = destination.x;
      self.y = destination.y;
      state.history = [{ t: state.elapsed, x: self.x, y: self.y }];
    },
  },
});


// Todo show recall location as an object. Get vision from recall location.
//  Recall cd 12.
