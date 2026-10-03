import tracer from "./tracer.js";
import clone from "./clone.js";
import demoman from "./demoman.js";
import wallRunner from "./wall-runner.js";

export const PlayerClass = Object.freeze({
  TRACER: 0,
  CLONE: 1,
  DEMOMAN: 2,
  WALL_RUNNER: 3,
});

export const CLASS_DEFS = Object.freeze({
  [PlayerClass.TRACER]: tracer,
  [PlayerClass.CLONE]: clone,
  [PlayerClass.DEMOMAN]: demoman,
  [PlayerClass.WALL_RUNNER]: wallRunner,
});
