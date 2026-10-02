import {Shape} from "../config.js";
import {cloneId, createClone} from "../entities/clone.js";
import clonePopSound from "../assets/sfx/clone/vanish.mp3";

const CLONE_IMPULSE = 180;

export function popClone(game, entity) {
  game.entities.delete(entity.id);
  game.sfx.play(clonePopSound, entity, game.players.get(game.localId));
}

export default Object.freeze({
  name: "Clone",
  shape: Shape.CIRCLE,
  symbol: "👥",
  radius: 13,
  accel: 1200,
  maxSpeed: 220,
  friction: 5,
  primary: {
    cooldown: 6,
    label: "Clone",
    use({ self, controls, game }) {
      const clone = createClone(self);
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        clone.vx = (dx / distance) * CLONE_IMPULSE;
        clone.vy = (dy / distance) * CLONE_IMPULSE;
      }
      game.entities.set(cloneId(self.id), clone);
    },
  },
  secondary: {
    cooldown: 1,
    label: "Swap",
    use({ self, game }) {
      const clone = game.entities.get(cloneId(self.id));
      if (!clone) return;

      const x = self.x;
      const y = self.y;
      const vx = self.vx;
      const vy = self.vy;
      self.x = clone.x;
      self.y = clone.y;
      self.vx = clone.vx;
      self.vy = clone.vy;
      clone.x = x;
      clone.y = y;
      clone.vx = vx;
      clone.vy = vy;
    },
  },
});
