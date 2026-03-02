/**
 * Sound Design Layer — Antigravity Chat
 * Generates subtle sounds via Web Audio API (no audio files needed).
 * All sounds are synthesized programmatically.
 */

let audioCtx = null;
let lastPlayTime = 0;
const DEBOUNCE_MS = 300;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
};

const playTone = ({ freq = 880, freq2 = null, duration = 0.12, gainVal = 0.12, type = 'sine', delay = 0 }) => {
    const now = performance.now();
    if (now - lastPlayTime < DEBOUNCE_MS) return;
    lastPlayTime = now;

    try {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        if (freq2) {
            osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + delay + duration * 0.6);
        }

        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
        // Ignore — audio APIs may fail in some contexts
    }
};

/** Soft ascending chime — sent message */
export const playSendSound = () => {
    playTone({ freq: 660, freq2: 880, duration: 0.18, gainVal: 0.1, type: 'sine' });
};

/** Soft double-pop — received message */
export const playReceiveSound = () => {
    playTone({ freq: 440, freq2: 520, duration: 0.14, gainVal: 0.09, type: 'sine' });
    playTone({ freq: 600, freq2: 700, duration: 0.12, gainVal: 0.07, type: 'sine', delay: 0.08 });
};

/** Higher-pitched pop — private message */
export const playPrivateSound = () => {
    playTone({ freq: 780, freq2: 1000, duration: 0.16, gainVal: 0.1, type: 'sine' });
};

/** Returns sound utility functions gated by soundEnabled */
export const useSoundPlayer = (soundEnabled) => ({
    playSend: () => soundEnabled && playSendSound(),
    playReceive: () => soundEnabled && playReceiveSound(),
    playPrivate: () => soundEnabled && playPrivateSound(),
});
