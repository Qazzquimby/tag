import { RELATION_COLORS } from "./config.js";
import { CLASS_DEFS } from "./classes/index.js";

function deltaArrow(delta) {
  if (delta > 0) return "▲";
  if (delta < 0) return "▼";
  return "";
}

export function renderScoreboard(listEl, standings) {
  const rows = standings.map((row) => {
    const item = document.createElement("li");
    item.className = "score-row";
    item.style.backgroundColor = RELATION_COLORS[row.relation];

    const identity = document.createElement("span");
    identity.textContent = `${row.rank}. ${row.name}`;

    const score = document.createElement("span");
    score.textContent = `${row.score} ${deltaArrow(row.delta)}`.trim();

    item.append(identity, score);
    return item;
  });

  listEl.replaceChildren(...rows);
}

export function renderRoundTimer(element, secondsLeft) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  element.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function renderRoundResult(element, result, now) {
  if (!result || now >= result.until) {
    element.hidden = true;
    return;
  }

  element.textContent = result.winnerName
    ? `${result.winnerName} wins with ${result.winnerScore}`
    : "Round over – no winner";
  element.hidden = false;
}

export function createClassPicker(container, onSelect) {
  const buttons = new Map();

  Object.entries(CLASS_DEFS).forEach(([classId, definition], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${index + 1} ${definition.name}`;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => onSelect(Number(classId)));
    container.append(button);
    buttons.set(Number(classId), button);
  });

  return function updateClassPicker(enabled, selectedId) {
    for (const [classId, button] of buttons) {
      button.disabled = !enabled;
      button.setAttribute("aria-pressed", String(classId === selectedId));
    }
  };
}
