export type NavigationState = { playing: boolean; waiting: boolean };
export type NavigationEnvironment = {
  now: () => number;
  frame: (callback: (time: number) => void) => number;
  cancelFrame: (id: number) => void;
  delay: (callback: () => void, milliseconds: number) => number;
  cancelDelay: (id: number) => void;
  readY: () => number;
  writeY: (top: number) => void;
  maxY: () => number;
  reducedMotion: () => boolean;
  canTour: () => boolean;
  nextTourTarget: () => number | null;
  setNativeSnap?: (enabled: boolean) => void;
  onState: (state: NavigationState) => void;
  tourDelay: number;
};

/** One owner for all timed and requested page movement. Native input always wins. */
export function createNavigationController(env: NavigationEnvironment) {
  let frame: number | null = null, timer: number | null = null;
  let generation = 0, playing = false, waiting = false, disposed = false;
  const emit = () => env.onState({ playing, waiting });
  const cancelWork = () => {
    generation++;
    if (frame !== null) env.cancelFrame(frame);
    if (timer !== null) env.cancelDelay(timer);
    frame = timer = null;
  };
  const pause = () => {
    cancelWork();
    if (playing || waiting) { playing = waiting = false; emit(); }
  };
  const clamp = (top: number) => Math.max(0, Math.min(top, env.maxY()));
  const scheduleTour = () => {
    if (!playing || disposed) return;
    if (!env.canTour() || env.nextTourTarget() === null) { pause(); return; }
    waiting = true; emit();
    const token = generation;
    timer = env.delay(() => {
      timer = null;
      if (token !== generation || !playing || disposed) return;
      if (!env.canTour()) { pause(); return; }
      const top = env.nextTourTarget();
      if (top === null) { pause(); return; }
      move(() => top, true);
    }, env.tourDelay);
  };
  const move = (destination: () => number | null, automatic = false) => {
    cancelWork();
    // Browser snapping and requested RAF movement never own scrolling together.
    env.setNativeSnap?.(false);
    waiting = false; emit();
    const token = generation;
    // Measure after the selection's React commit, not against the outgoing panel.
    frame = env.frame(() => {
      frame = null;
      if (token !== generation || disposed) return;
      const requested = destination();
      if (requested === null) { if (automatic) pause(); return; }
      const from = env.readY(), to = clamp(requested), distance = to - from;
      if (env.reducedMotion() || Math.abs(distance) < 2) {
        if (Math.abs(distance) >= 2) env.writeY(to);
        if (automatic) scheduleTour();
        return;
      }
      const start = env.now();
      const duration = Math.min(520, Math.max(220, Math.abs(distance) * .35));
      const tick = (time: number) => {
        frame = null;
        if (token !== generation || disposed) return;
        const progress = Math.min(1, Math.max(0, (time - start) / duration));
        const eased = 1 - (1 - progress) ** 3;
        env.writeY(clamp(from + distance * eased));
        if (progress < 1) frame = env.frame(tick);
        else if (automatic) scheduleTour();
      };
      frame = env.frame(tick);
    });
  };
  return {
    navigate(destination: () => number | null) { pause(); if (!disposed) move(destination); },
    nativeInput() { pause(); if (!disposed) env.setNativeSnap?.(true); },
    play() {
      pause();
      if (disposed || !env.canTour() || env.reducedMotion()) return;
      playing = true; scheduleTour();
    },
    pause,
    dispose() { pause(); env.setNativeSnap?.(true); disposed = true; },
  };
}
