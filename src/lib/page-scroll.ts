const SPRING_STIFFNESS = 82;
const SPRING_DAMPING = 14.6;
const REST_DISTANCE = 0.2;
const REST_SPEED = 0.5;
const MAX_FRAME_SECONDS = 1 / 30;
const PHYSICS_STEP_SECONDS = 1 / 120;

export interface ScrollSpringState {
  position: number;
  velocity: number;
}

export function advanceScrollSpring(state: ScrollSpringState, target: number, deltaSeconds: number): ScrollSpringState {
  const acceleration = (target - state.position) * SPRING_STIFFNESS - state.velocity * SPRING_DAMPING;
  return {
    position: state.position + state.velocity * deltaSeconds,
    velocity: state.velocity + acceleration * deltaSeconds,
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

function installSpringWheelScroll(): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const root = document.documentElement;
  const spring: ScrollSpringState = { position: window.scrollY, velocity: 0 };
  let target = spring.position;
  let animationFrame = 0;
  let lastFrameAt = 0;

  const motionEnabled = (): boolean => finePointer.matches && !reducedMotion.matches;

  const stop = (): void => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameAt = 0;
    spring.position = window.scrollY;
    spring.velocity = 0;
    target = spring.position;
    delete root.dataset.scrollMotion;
  };

  const tick = (frameAt: number): void => {
    const maximum = scrollMaximum();
    target = clamp(target, 0, maximum);
    let remaining = lastFrameAt ? Math.min((frameAt - lastFrameAt) / 1000, MAX_FRAME_SECONDS) : 1 / 60;
    lastFrameAt = frameAt;

    while (remaining > 0) {
      const step = Math.min(remaining, PHYSICS_STEP_SECONDS);
      const next = advanceScrollSpring(spring, target, step);
      spring.position = next.position;
      spring.velocity = next.velocity;
      remaining -= step;
    }

    const constrainedPosition = clamp(spring.position, 0, maximum);
    if (constrainedPosition !== spring.position) {
      spring.position = constrainedPosition;
      spring.velocity = 0;
    }
    window.scrollTo(0, spring.position);

    if (Math.abs(target - spring.position) <= REST_DISTANCE && Math.abs(spring.velocity) <= REST_SPEED) {
      spring.position = target;
      spring.velocity = 0;
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
    spring.position = window.scrollY;
    root.dataset.scrollMotion = "active";
    animationFrame = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent): void => {
    if (!motionEnabled() || event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const rawDelta = normalizedWheelDelta(event);
    if (!rawDelta || nestedScrollerCanMove(event.target, rawDelta)) return;

    if (!animationFrame) {
      spring.position = window.scrollY;
      spring.velocity = 0;
      target = spring.position;
    }
    const maximumDelta = Math.max(120, window.innerHeight * 0.65);
    const nextTarget = clamp(target + clamp(rawDelta, -maximumDelta, maximumDelta), 0, scrollMaximum());
    if (nextTarget === target && Math.abs(target - spring.position) <= REST_DISTANCE) return;

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

  const disposeSpringScroll = installSpringWheelScroll();
  return () => {
    if (firstResetFrame) cancelAnimationFrame(firstResetFrame);
    if (secondResetFrame) cancelAnimationFrame(secondResetFrame);
    disposeSpringScroll();
  };
}
