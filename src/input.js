import { PlayerClass } from "./config.js";

const CLASS_ORDER = Object.values(PlayerClass);

export function createInput(canvas, world, actions) {
  const keys = new Set();
  const mouse = { x: world.W / 2, y: world.H / 2 };
  const move = { x: 0, y: 0 };
  const controls = { move, aim: mouse, primary: false };

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

  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) controls.primary = true;
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button === 0) controls.primary = false;
  });

  window.addEventListener("keydown", (event) => {
    if (isTyping(event)) return;
    keys.add(event.code);
    if (event.repeat) return;

    if (event.code.startsWith("Digit")) {
      const index = Number(event.code.slice(5)) - 1;
      if (index >= 0 && index < CLASS_ORDER.length) actions.selectClass(CLASS_ORDER[index]);
    } else if (event.code === "KeyB") {
      actions.toggleDummy();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  window.addEventListener("blur", () => {
    keys.clear();
    controls.primary = false;
  });

  function getControls() {
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
    return controls;
  }

  return { getControls };
}
