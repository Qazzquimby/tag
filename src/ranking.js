import { Relation } from "./config.js";

export function compareRank(a, b) {
  if (a.score !== b.score) return b.score - a.score;
  if (a.scoredAt !== b.scoredAt) return a.scoredAt - b.scoredAt;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function relationTo(viewer, other) {
  if (viewer.id === other.id) return Relation.SELF;
  if (other.isDummy) return Relation.ABOVE;
  return compareRank(other, viewer) < 0 ? Relation.ABOVE : Relation.BELOW;
}
