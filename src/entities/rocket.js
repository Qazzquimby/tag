import { EntityKind, RELATION_COLORS } from "../config.js";
import { applyBlast } from "../blast.js";
import { relationTo } from "../ranking.js";
import { createEntity } from "./entity.js";
import explosionSound from "../assets/sfx/demoman/sticky_detonate.mp3";

const ROCKET_RADIUS = 6;
const EXPLODE_SPEED = 80;
const ROCKET_SPRITE = "🚀";
const ROCKET_FONT_SIZE = 16;
const BLAST = Object.freeze({ radius: 130, impulse: 1100, stun: 0.25 });

export const ROCKET_FRICTION = 2;

export function createRocket(owner, id, vx, vy) {
  return createEntity({
    id,
    kind: EntityKind.ROCKET,