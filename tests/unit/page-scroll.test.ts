import { describe, expect, it } from "vitest";
import { advanceScrollSpring, type ScrollSpringState } from "../../src/lib/page-scroll";

describe("page scroll spring", () => {
  it("settles with a restrained overshoot", () => {
    const target = 600;
    let state: ScrollSpringState = { position: 0, velocity: 0 };
    let maximum = 0;

    for (let frame = 0; frame < 600; frame += 1) {
      state = advanceScrollSpring(state, target, 1 / 120);
      maximum = Math.max(maximum, state.position);
    }

    const overshootRatio = (maximum - target) / target;
    expect(overshootRatio).toBeGreaterThan(0.01);
    expect(overshootRatio).toBeLessThan(0.025);
    expect(state.position).toBeCloseTo(target, 4);
    expect(state.velocity).toBeCloseTo(0, 4);
  });
});
