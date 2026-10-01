import {EntityKind, NetEvent} from "../config.js";
import { PLAYER_DEF } from "./player-entity.js";
import { createEntity } from "./entity.js";
import {popClone} from "../classes/clone.js";

export function cloneId(ownerId) {
  return `clone:${ownerId}`;
}

export function createClone(owner) {
  return createEntity({
    id: cloneId(owner.id),
    kind: EntityKind.CLONE,
    x: owner.x,
    y: owner.y,
    vx: owner.vx,
    vy: owner.vy,
    radius: owner.radius,
    friction: 0,
    collides: true,
    solid: false,
    interactive: true,
    grantsVision: true,
    ownerId: owner.id,
  });
}

export const CLONE_DEF = Object.freeze({
  despawnWithOwner: true,
  replicated: true,
  create: createClone,
  draw(ctx, entity, viewer, now, game) {
    const owner = game.players.get(entity.ownerId);
    PLAYER_DEF.draw(ctx, { ...owner, x: entity.x, y: entity.y }, viewer, now);
  },
  onTouch(entity, toucher, game, net) {
    if (toucher.id === entity.ownerId) return;
    popClone(game, entity);
    net.send(NetEvent.CLONE_POPPED, { id: entity.id });
  },
});
