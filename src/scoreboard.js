import { RANK_FLASH_S, Relation } from "./config.js";

export function createRankTracker() {
  return new Map();
}

export function computeStandings(players, tracker, localId, now) {
  const sorted = [...players.values()].sort(
    (a, b) => b.score - a.score || (a.id < b.id ? -1 : 1),
  );

  const rows = [];
  let myRank = 0;

  sorted.forEach((player, index) => {
    const rank = index + 1;
    if (player.id === localId) myRank = rank;
    rows.push({
      id: player.id,
      name: player.name,
      score: player.score,
      rank,
      delta: 0,
      relation: Relation.SELF,
    });
  });

  for (const row of rows) {
    const previous = tracker.get(row.id);
    if (!previous) {
      tracker.set(row.id, { rank: row.rank, delta: 0, flashUntil: 0 });
    } else if (previous.rank !== row.rank) {
      tracker.set(row.id, {
        rank: row.rank,
        delta: previous.rank - row.rank,
        flashUntil: now + RANK_FLASH_S * 1000,
      });
    }

    const entry = tracker.get(row.id);
    if (entry.flashUntil > now) row.delta = entry.delta;
    row.relation =
      row.id === localId ? Relation.SELF : row.rank < myRank ? Relation.ABOVE : Relation.BELOW;
  }

  for (const id of tracker.keys()) {
    if (!players.has(id)) tracker.delete(id);
  }

  return rows;
}
