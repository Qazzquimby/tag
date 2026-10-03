import tracer from "./tracer.js";
import clone from "./clone.js";
import demoman from "./demoman.js";
import wallRunner from "./wall-runner.js";
import monster from "./monster.js";
import ghost from "./ghost.js";


export const PlayerClass = Object.freeze({
  TRACER: 0,
  CLONE: 1,
  DEMOMAN: 2,
  WALL_RUNNER: 3,
  MONSTER: 4,
  GHOST: 5,
});

export const CLASS_DEFS = Object.freeze({
  [PlayerClass.TRACER]: tracer,
  [PlayerClass.CLONE]: clone,
  [PlayerClass.DEMOMAN]: demoman,
  [PlayerClass.WALL_RUNNER]: wallRunner,
  [PlayerClass.MONSTER]: monster,
  [PlayerClass.GHOST]: ghost,
});
