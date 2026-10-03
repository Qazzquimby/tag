import { AbilitySlot } from "./config.js";
import { CLASS_DEFS } from "./classes/index.js";

const SLOTS = Object.values(AbilitySlot);

export function createAbilityUseDetector() {
  let previous = { [AbilitySlot.PRIMARY]: 0, [AbilitySlot.SECONDARY]: 0 };
  let previousClassId = null;

  return function detectAbilityUse(player) {
    if (!player || player.classId !== previousClassId) {
      previousClassId = player?.classId ?? null;
      previous = Object.fromEntries(
        SLOTS.map((slot) => [slot, player?.cooldowns[slot] ?? 0]),
      );
      return [];
    }

    const used = [];
    const definition = CLASS_DEFS[player.classId];

    for (const slot of SLOTS) {
      const cooldown = player.cooldowns[slot];
      if (definition[slot] && cooldown > previous[slot]) used.push(slot);
      previous[slot] = cooldown;
    }

    return used;
  };
}

function spatialMix(origin, listener) {
  return { volume: 1, pan: 0 };
}

export function createSfx() {
  let audioContext = null;
  const buffers = new Map();

  function getAudioContext() {
    if (!audioContext) audioContext = new AudioContext();
    return audioContext;
  }

  function loadBuffer(url) {
    if (!buffers.has(url)) {
      const context = getAudioContext();
      buffers.set(
        url,
        fetch(url)
          .then((response) => response.arrayBuffer())
          .then((data) => context.decodeAudioData(data)),
      );
    }

    return buffers.get(url);
  }

  async function play(url, origin, listener, { volume = 1 } = {}) {
    const context = getAudioContext();
    const buffer = await loadBuffer(url);
    await context.resume();

    const mix = spatialMix(origin, listener);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    source.buffer = buffer;
    gain.gain.value = mix.volume * volume;
    panner.pan.value = mix.pan;

    source.connect(gain);
    gain.connect(panner);
    panner.connect(context.destination);
    source.start();
  }

  async function playAbility(event, listener) {
    const ability = CLASS_DEFS[event.classId][event.slot];
    if (!ability?.sound) return;
    await play(ability.sound, event, listener, { volume: ability.volume });
  }

  return { playAbility, play };
}
