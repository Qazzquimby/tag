import {AbilitySlot, Shape} from "../config.js";
import {isAreaFree, trailStrength} from "../map.js";
import {topRankedPlayer} from "../ranking.js";
import leapSound from "../assets/sfx/monster/leap.ogg";
import {createIllusion, illusionId} from "../entities/monster-illusion.js";

const TRAIL_BOOST = 1.4;
const LUNGE_STRENGTH = 1200;

const monster = {
  name: "Monster",
  shape: Shape.CIRCLE,
  symbol: "👹",
  radius: 18,
  accel: 1000,
  maxSpeed: 190,
  friction: 5,
  adjustIntent({ self, game }, intent) {
    const strength = trailStrength(game.trails, game.world.map, self.x, self.y, performance.now());
    if (strength > 0) {
      intent.maxSpeed *= TRAIL_BOOST;
      intent.accel *= TRAIL_BOOST;
    }
  },
  senses(viewer, target, game) {
    return topRankedPlayer(game.players)?.id === target.id;
  },
  onScore(player) {
    player.cooldowns[AbilitySlot.PRIMARY] = 0;
  },
  netState(player) {
    return { illusion: player.classState?.illusion ?? null };
  },
  primary: {
    label: "Lunge",
    sound: leapSound,
    cooldown: 6,
    use({ self, controls }) {
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.hypot(dx, dy);
      if (!distance) return false;
      self.vx += (dx / distance) * LUNGE_STRENGTH;
      self.vy += (dy / distance) * LUNGE_STRENGTH;
    },
  },
  secondary: {
    label: "Illusion",
    sound: leapSound,
    cooldown: 8,
    use({ self, controls, game }) {
      const appearance = monster;
      if (!isAreaFree(game.world.map, controls.aim.x, controls.aim.y, appearance.radius)) return false;
      const id = illusionId(self.id);
      game.entities.delete(id);
      const illusion = createIllusion(self, appearance);
      illusion.x = controls.aim.x;
      illusion.y = controls.aim.y;
      game.entities.set(id, illusion);
    },
  },
};

export default Object.freeze(monster);

// todo shouldnt see trail through walls