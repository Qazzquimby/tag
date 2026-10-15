import { EntityKind, RELATION_COLORS } from "../config.js";
import { applyBlast } from "../blast.js";
import { relationTo } from "../ranking.js";
import { canSee } from "../vision.js";
import { createEntity } from "./entity.js";
import explosionSound from "../assets/sfx/demoman/sticky_detonate.mp3";

const ROCKET_RADIUS = 6;
const ROCKET_SPRITE = "🚀";
const ROCKET_FONT_SIZE = 16;
const BLAST = Object.freeze({ radius: 130, impulse: 1100, stun: 0.25 });

export const EXPLODE_SPEED = 80;
export const ROCKET_FRICTION = 5;

export function createRocket(owner, id, vx, vy) {
  return createEntity({
    id,
    kind: EntityKind.ROCKET,
    x: owner.x,
    y: owner.y,
    vx,
    vy,
    radius: ROCKET_RADIUS,
    friction: ROCKET_FRICTION,
    collides: true,
    interactive: false,
    ownerId: owner.id,
  });
}

function explode(rocket, game, net) {
  applyBlast(game, net, rocket.ownerId, [rocket], BLAST);
  game.sfx.play(explosionSound, rocket, game.players.get(game.localId));
  game.entities.delete(rocket.id);
}

export const ROCKET_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create(owner, id) {
    return createRocket(owner, id, 0, 0);
  },
  update(rocket, dt, game, net) {
    if (rocket.isRemote) return;
    if (Math.hypot(rocket.vx, rocket.vy) <= EXPLODE_SPEED) explode(rocket, game, net);
  },
  isVisible(rocket, viewer, game) {
    return rocket.ownerId === viewer.id || canSee(game, viewer, rocket);
  },
  draw(ctx, rocket, viewer, now, game) {
    const owner = game.players.get(rocket.ownerId);

    ctx.save();
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, rocket.radius, 0, Math.PI * 2);
    ctx.strokeStyle = RELATION_COLORS[relationTo(viewer, owner)];
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${ROCKET_FONT_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ROCKET_SPRITE, rocket.x, rocket.y);
    ctx.restore();
  },
});
