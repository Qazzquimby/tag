import { MAP_CELL } from "./config.js";

const WALL_RECTS = [
  { col: 3, row: 2, cols: 1, rows: 4 },
  { col: 14, row: 6, cols: 1, rows: 4 },
  { col: 7, row: 4, cols: 4, rows: 1 },
  { col: 7, row: 7, cols: 4, rows: 1 },
  { col: 2, row: 9, cols: 4, rows: 1 },
  { col: 12, row: 1, cols: 4, rows: 1 },
];

const EPSILON = 1e-6;

export function createMap(W, H) {
  const cols = Math.ceil(W / MAP_CELL);
  const rows = Math.ceil(H / MAP_CELL);
  const solid = new Uint8Array(cols * rows);

  for (const rect of WALL_RECTS) {
    for (let row = rect.row; row < rect.row + rect.rows; row++) {
      for (let col = rect.col; col < rect.col + rect.cols; col++) {
        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          solid[row * cols + col] = 1;
        }
      }
    }
  }

  return { cell: MAP_CELL, cols, rows, solid };
}

export function isSolid(map, col, row) {
  if (col < 0 || row < 0 || col >= map.cols || row >= map.rows) return true;
  return map.solid[row * map.cols + col] === 1;
}

export function isAreaFree(map, x, y, half) {
  const minCol = Math.floor((x - half) / map.cell + EPSILON);
  const maxCol = Math.floor((x + half) / map.cell - EPSILON);
  const minRow = Math.floor((y - half) / map.cell + EPSILON);
  const maxRow = Math.floor((y + half) / map.cell - EPSILON);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (isSolid(map, col, row)) return false;
    }
  }

  return true;
}

export function randomFreePosition(world, clearance) {
  const { W, H, map } = world;

  while (true) {
    const x = clearance + Math.random() * (W - clearance * 2);
    const y = clearance + Math.random() * (H - clearance * 2);
    if (isAreaFree(map, x, y, clearance)) return { x, y };
  }
}
