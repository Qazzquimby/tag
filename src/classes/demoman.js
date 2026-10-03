import { EntityKind, ENTITY_FRICTION, NetEvent, Shape, Status } from "../config.js";
import {createStickyBomb, STICKY_BOMB_FRICTION} from "../entities/sticky-bomb.js";
import { applyKnockback } from "../player.js";
import stickyDetonateSound from "../assets/sfx/demoman/sticky_detonate.mp3";
import stickyLaunchSound from "../assets/sfx/demoman/sticky_launch.mp3";

const THROW_COOLDOWN = 1;
const DETONATE_COOLDOWN = 0.5;
const THROW_MAX_DISTANCE = 450;
const BLAST_RADIUS = 150;
const BLAST_IMPULSE = 1200;
const BLAST_STUN_S = 0.25;

function armedBombs(self, game) {
  return [...game.entities.values()].filter(
    (entity) =>
      entity.kind === EntityKind.STICKY_BOMB &&
      entity.ownerId === self.id &&
      entity.armLeft <= 0,
  );
}

function blastImpulses(players, bombs) {
  const impulses = new Map();

  for (const player of players) {
    if (player.status !== Status.ALIVE) continue;

    let dvx = 0;
    let dvy = 0;
    for (const bomb of bombs) {
      const dx = player.x - bomb.x;
      const dy = player.y - bomb.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= BLAST_RADIUS) continue;

      const impulse = BLAST_IMPULSE * (1 - distance / BLAST_RADIUS);
      const divisor = Math.max(distance, 1);
      dvx += (dx / divisor) * impulse;
      dvy += (dy / divisor) * impulse;
    }

    if (dvx !== 0 || dvy !== 0) impulses.set(player, { dvx, dvy });
  }

  return impulses;
}

const demoman = {
  name: "Demoman",
  shape: Shape.CIRCLE,
  symbol: "💣",
  radius: 13,
  accel: 1200,
  maxSpeed: 200,
  friction: 4,
  primary: {
    label: "Launch",
    sound: stickyLaunchSound,
    volume: 0.3,
    cooldown: THROW_COOLDOWN,
    use({ self, controls, game }) {
      const dx = controls.aim.x - self.x;
      const dy = controls.aim.y - self.y;
      const distance = Math.min(Math.hypot(dx, dy), THROW_MAX_DISTANCE);
      if (distance === 0) return;

      const speed = distance * STICKY_BOMB_FRICTION;
      const id = `sticky:${game.localId}:${game.nextEntityId++}`;
      const bomb = createStickyBomb(
        self,
        id,
        Math.cos(self.aim) * speed,
        Math.sin(self.aim) * speed,
      );
      game.entities.set(id, bomb);
    },
  },
  secondary: {
    label: "Detonate",
    cooldown: DETONATE_COOLDOWN,
    use({ self, game, net }) {
      const bombs = armedBombs(self, game);
      if (bombs.length === 0) return;

      for (const [player, impulse] of blastImpulses(game.players.values(), bombs)) {
        const stun = player.id === self.id ? 0 : BLAST_STUN_S;
        if (player.id === self.id || player.isDummy) {
          applyKnockback(player, impulse.dvx, impulse.dvy, stun);
        } else {
          net.send(NetEvent.IMPULSE, {
            target: player.id,
            dvx: impulse.dvx,
            dvy: impulse.dvy,
            stun,
          });
        }
      }

      for (const bomb of bombs) {
        game.sfx.play(
          stickyDetonateSound,
          bomb,
          game.players.get(game.localId),
        );
        game.entities.delete(bomb.id);
      }
    },
  },
};

export default Object.freeze(demoman);

