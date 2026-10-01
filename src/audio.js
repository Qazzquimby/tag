import { AbilitySlot } from "./config.js";
import { CLASS_DEFS } from "./classes/index.js";

const SOUND_TONES = new Map([
  ["tracer-blink", { frequency: 880, duration: 0.12 }],
  ["tracer-rewind", { frequency: 440, duration: 0.2 }],
]);

export function createAbilitySfx() {
  const sounds = new Map();
  let audioContext = null;
  let previous = { [AbilitySlot.PRIMARY]: 0, [AbilitySlot.SECONDARY]: 0 };
  let previousClassId = null;

  function play(sound) {
    if (!audioContext) audioContext = new AudioContext();

    const tone = sounds.get(sound);
    if (!tone) return;

    audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.frequency.value = tone.frequency;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tone.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + tone.duration);
  }

  for (const [sound, tone] of SOUND_TONES) sounds.set(sound, tone);

  return function updateAbilitySfx(player) {
    if (!player || player.classId !== previousClassId) {
      previousClassId = player?.classId ?? null;
      previous = { [AbilitySlot.PRIMARY]: 0, [AbilitySlot.SECONDARY]: 0 };
      return;
    }

    const definition = CLASS_DEFS[player.classId];
    for (const slot of Object.values(AbilitySlot)) {
      const ability = definition[slot];
      const cooldown = player.cooldowns[slot];
      if (ability?.sound && cooldown > previous[slot]) play(ability.sound);
      previous[slot] = cooldown;
    }
  };
}
