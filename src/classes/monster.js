import {AbilitySlot, Shape} from "../config.js";
import {isAreaFree, trailStrength} from "../map.js";
import {topRankedPlayer} from "../ranking.js";
import blinkSound from "../assets/sfx/tracer/blink.mp3";
import {createIllusion, illusionId} from "../entities/monster-illusion.js";

const TRAIL_BOOST = 1.4;

const monster = {
  name: "Monster",
  shape: Shape.TRIANGLE,
  symbol: "👹",
  radius: 13,
  accel: 1000,
  maxSpeed: 170,
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
    sound: blinkSound,
    cooldown: 6,
    use({ self, controls }) {
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.hypot(dx, dy);
      if (!distance) return false;
      self.vx += (dx / distance) * 260;
      self.vy += (dy / distance) * 260;
    },
  },
  secondary: {
    label: "Illusion",
    sound: blinkSound,
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