const GLIDE_RESPONSE_PER_SECOND = 8.5;
const GLIDE_DISTANCE_MULTIPLIER = 1.0125;
const REST_DISTANCE = 0.12;
const REST_SPEED = 0.75;
const MAX_FRAME_SECONDS = 1 / 30;

export interface ScrollGlideState {
  position: number;
  velocity: number;
}

export function advanceScrollGlide(state: ScrollGlideState, target: number, deltaSeconds: number): ScrollGlideState {
  if (deltaSeconds <= 0 || state.position === target) return { position: state.position, velocity: 0 };

  const blend = 1 - Math.exp(-GLIDE_RESPONSE_PER_SECOND * deltaSeconds);
  const movement = (target - state.position) * blend;
  return {
    position: state.position + movement,
    velocity: movement / deltaSeconds,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function scrollMaximum(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function normalizedWheelDelta(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight * 0.9;
  return event.deltaY;
}

function nestedScrollerCanMove(target: EventTarget | null, deltaY: number): boolean {
  let element = target instanceof Element ? target : null;
  while (element && element !== document.body && element !== document.documentElement) {
    const { overflowY } = getComputedStyle(element);
    const isScrollable = /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight + 1;
    if (isScrollable) {
      const canMoveUp = deltaY < 0 && element.scrollTop > 0;
      const canMoveDown = deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      if (canMoveUp || canMoveDown) return true;
    }
    element = element.parentElement;
  }
  return false;
}

function scrollToTopImmediately(): void {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousBehavior;
}

function removeLocationHash(): void {
  if (!window.location.hash) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
}

export function reloadPageFromTop(): void {
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  removeLocationHash();
  scrollToTopImmediately();
  window.location.reload();
}

function installGlideWheelScroll(): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const root = document.documentElement;
  const glide: ScrollGlideState = { position: window.scrollY, velocity: 0 };
  let target = glide.position;
  let animationFrame = 0;
  let lastFrameAt = 0;

  const motionEnabled = (): boolean => finePointer.matches && !reducedMotion.matches;

  const stop = (): void => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameAt = 0;
    glide.position = window.scrollY;
    glide.velocity = 0;
    target = glide.position;
    delete root.dataset.scrollMotion;
  };

  const tick = (frameAt: number): void => {
    const maximum = scrollMaximum();
    target = clamp(target, 0, maximum);
    const elapsed = lastFrameAt ? Math.min((frameAt - lastFrameAt) / 1000, MAX_FRAME_SECONDS) : 1 / 60;
    lastFrameAt = frameAt;

    const next = advanceScrollGlide(glide, target, elapsed);
    glide.position = next.position;
    glide.velocity = next.velocity;

    const constrainedPosition = clamp(glide.position, 0, maximum);
    if (constrainedPosition !== glide.position) {
      glide.position = constrainedPosition;
      glide.velocity = 0;
    }
    window.scrollTo(0, glide.position);

    if (Math.abs(target - glide.position) <= REST_DISTANCE && Math.abs(glide.velocity) <= REST_SPEED) {
      glide.position = target;
      glide.velocity = 0;
      window.scrollTo(0, target);
      animationFrame = 0;
      lastFrameAt = 0;
      delete root.dataset.scrollMotion;
      return;
    }

    animationFrame = requestAnimationFrame(tick);
  };

  const start = (): void => {
    if (animationFrame) return;
    glide.position = window.scrollY;
    root.dataset.scrollMotion = "active";
    animationFrame = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent): void => {
    if (!motionEnabled() || event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const rawDelta = normalizedWheelDelta(event);
    if (!rawDelta || nestedScrollerCanMove(event.target, rawDelta)) return;

    if (!animationFrame) {
      glide.position = window.scrollY;
      glide.velocity = 0;
      target = glide.position;
    }
    const maximumDelta = Math.max(120, window.innerHeight * 0.65);
    const glidingDelta = clamp(rawDelta, -maximumDelta, maximumDelta) * GLIDE_DISTANCE_MULTIPLIER;
    const nextTarget = clamp(target + glidingDelta, 0, scrollMaximum());
    if (nextTarget === target && Math.abs(target - glide.position) <= REST_DISTANCE) return;

    event.preventDefault();
    target = nextTarget;
    start();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(event.key)) stop();
  };
  const onPreferenceChange = (): void => {
    if (!motionEnabled()) stop();
  };
  const onVisibilityChange = (): void => {
    if (document.hidden) stop();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("pointerdown", stop, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener("change", onPreferenceChange);
  finePointer.addEventListener("change", onPreferenceChange);

  return () => {
    stop();
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointerdown", stop);
    window.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.removeEventListener("change", onPreferenceChange);
    finePointer.removeEventListener("change", onPreferenceChange);
  };
}

export function initializePageScroll(): () => void {
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const resetToTop = navigation?.type === "reload" || !window.location.hash;
  if (navigation?.type === "reload") removeLocationHash();

  let firstResetFrame = 0;
  let secondResetFrame = 0;
  if (resetToTop) {
    scrollToTopImmediately();
    firstResetFrame = requestAnimationFrame(() => {
      scrollToTopImmediately();
      secondResetFrame = requestAnimationFrame(scrollToTopImmediately);
    });
  }

  const disposeGlideScroll = installGlideWheelScroll();
  return () => {
    if (firstResetFrame) cancelAnimationFrame(firstResetFrame);
    if (secondResetFrame) cancelAnimationFrame(secondResetFrame);
    disposeGlideScroll();
  };
}
