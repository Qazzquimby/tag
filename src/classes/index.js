import balanced from "./balanced.js";
import scout from "./scout.js";
import tank from "./tank.js";
import tracer from "./tracer.js";

export const PlayerClass = Object.freeze({
  BALANCED: 0,
  SCOUT: 1,
  TANK: 2,
  TRACER: 3,
});

export const CLASS_DEFS = Object.freeze({
  [PlayerClass.BALANCED]: balanced,
  [PlayerClass.SCOUT]: scout,
  [PlayerClass.TANK]: tank,
  [PlayerClass.TRACER]: tracer,
});
