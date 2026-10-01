import {Shape} from "../config.js";
import {cloneId, createClone} from "../entities/clone.js";
import clonePopSound from "../assets/sfx/clone/vanish.mp3";


export function popClone(game, entity) {
  game.entities.delete(entity.id);
  game.sfx.play(clonePopSound, entity, game.players.get(game.localId));
}

export default Object.freeze({
  name: "Clone",
  shape: Shape.CIRCLE,
  symbol: "👥",
  radius: 13,
  accel: 1400,
  maxSpeed: 250,
  friction: 6,
  primary: {
    cooldown: 3,
    label: "Clone",
    use({ self, game }) {
      const clone = createClone(self);
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
      self.x = clone.x;
      self.y = clone.y;
      clone.x = x;
      clone.y = y;
    },
  },
});