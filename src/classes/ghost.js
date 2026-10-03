import {NetEvent, Relation, Shape, Status} from "../config.js";
import {isAreaFree} from "../map.js";
import {relationTo} from "../ranking.js";

const GHOST_CHARGE_S = 5;
const GHOST_RECHARGE_RATE = 2;
const FEAR_S = 2;
const FEAR_RADIUS = 180;

function applyFear(player, payload) {
  player.fearLeft = payload.duration;
  player.fearX = payload.x;
  player.fearY = payload.y;
  player.vx = 0;
  player.vy = 0;
}

const ghost = {
  name: "Ghost",
  shape: Shape.CIRCLE,
  symbol: "👻",
  radius: 12,
  accel: 800,
  maxSpeed: 155,
  friction: 5,
  createState() {
    return {charge: GHOST_CHARGE_S, disguiseLeft: 0, phasing: false};
  },
  update({self, dt, controls, game}) {
    const state = self.classState;
    state.disguiseLeft = Math.max(0, state.disguiseLeft - dt);
    const wantsPhase = controls.secondary && state.charge > 0;
    const insideWall = !isAreaFree(game.world.map, self.x, self.y, self.radius);
    state.phasing = wantsPhase || (state.phasing && insideWall);

    if (wantsPhase) {
      state.charge = Math.max(0, state.charge - dt);
    } else if (!controls.secondary) {
      state.charge = Math.min(GHOST_CHARGE_S, state.charge + dt * GHOST_RECHARGE_RATE);
    }
  },
  adjustIntent({self}, intent) {
    if (!self.classState.phasing) return;
    intent.phase = true;
    intent.maxSpeed *= 0.5;
    intent.accel *= 0.5;
  },
  netState(player) {
    const state = player.classState;
    return {
      disguised: state?.disguiseLeft > 0,
      phasing: Boolean(state?.phasing),
    };
  },
  seesThroughWalls(viewer) {
    return Boolean(viewer.classNet.phasing);
  },
  viewAlpha(player, viewer) {
    const distance = Math.hypot(player.x - viewer.x, player.y - viewer.y);
    const alpha = player.id === viewer.id ? 1 : Math.max(0.15, Math.min(1, 1 - distance / 500));
    return alpha * (player.classNet?.phasing ? 0.5 : 1);
  },
  primary: {
    label: "Fear",
    sound: "../assets/sfx/clone/vanish.mp3",
    cooldown: 8,
    use({self, game, net}) {
      self.classState.disguiseLeft = 3;
      for (const target of game.players.values()) {
        if (target.id === self.id || target.status !== Status.ALIVE) continue;
        if (relationTo(self, target) !== Relation.ABOVE) continue;
        if (Math.hypot(target.x - self.x, target.y - self.y) > FEAR_RADIUS) continue;
        const payload = {victim: target.id, x: self.x, y: self.y, duration: FEAR_S};
        if (target.isDummy) applyFear(target, payload.x, payload.y, payload.duration);
        else net.send(NetEvent.FEAR, payload);
      }
    },
  },
  secondary: {
    label: "Phase",
    sound: "../assets/sfx/wall_runner/slide.wav",
    cooldown: 0.3,
    meter(player) {
      return (player.classState?.charge ?? 0) / GHOST_CHARGE_S;
    },
    use({self}) {
      return self.classState.charge > 0 ? undefined : false;
    },
  }
};

export default Object.freeze(ghost);

