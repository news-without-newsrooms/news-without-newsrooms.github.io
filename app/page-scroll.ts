type ScrollRequest = (destination: () => number | null) => void;
let navigate: ScrollRequest | null = null;

export function connectPageScroll(handler: ScrollRequest) {
  navigate = handler;
  return () => { if (navigate === handler) navigate = null; };
}

export function headerOffset() {
  return (document.querySelector('.site-header')?.getBoundingClientRect().height ?? 76) + 12;
}

/** Used only after an explicit selection; re-taps and rapid changes share one queue. */
export function revealSelection(element: () => HTMLElement | null) {
  if (!window.matchMedia('(max-width: 800px)').matches) return;
  navigate?.(() => {
    const target = element();
    return target?.isConnected ? target.getBoundingClientRect().top + window.scrollY - headerOffset() : null;
  });
}
