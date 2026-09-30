import { PlayerClass } from "./config.js";

const CLASS_ORDER = Object.values(PlayerClass);

export function createInput(canvas, world, actions) {
  const keys = new Set();
  const mouse = { x: world.W / 2, y: world.H / 2 };
  const move = { x: 0, y: 0 };

  function isTyping(event) {
    const target = event.target;
    return (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
    );
  }

  function updateMouse(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (world.W / rect.width);
    mouse.y = (event.clientY - rect.top) * (world.H / rect.height);
  }

  canvas.addEventListener("mousemove", updateMouse);

  window.addEventListener("keydown", (event) => {
    if (isTyping(event)) return;
    keys.add(event.code);
    if (event.repeat) return;

    if (event.code.startsWith("Digit")) {
      const index = Number(event.code.slice(5)) - 1;
      if (index >= 0 && index < CLASS_ORDER.length) actions.selectClass(CLASS_ORDER[index]);
    } else if (event.code === "KeyB") {
      actions.toggleDummy();
    } else if (event.code === "KeyN") {
      actions.rename();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  window.addEventListener("blur", () => {
    keys.clear();
  });

  function getMove() {
    let x = 0;
    let y = 0;
    if (keys.has("KeyA")) x -= 1;
    if (keys.has("KeyD")) x += 1;
    if (keys.has("KeyW")) y -= 1;
    if (keys.has("KeyS")) y += 1;
    const length = Math.hypot(x, y);
    if (length > 0) {
      x /= length;
      y /= length;
    }
    move.x = x;
    move.y = y;
    return move;
  }

  return { getMove, mouse };
}
