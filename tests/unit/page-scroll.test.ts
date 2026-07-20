import { describe, expect, it } from "vitest";
import { advanceScrollGlide, type ScrollGlideState } from "../../src/lib/page-scroll";

describe("page scroll glide", () => {
  it("settles monotonically without crossing its target", () => {
    const target = 600;
    let state: ScrollGlideState = { position: 0, velocity: 0 };
    const positions: number[] = [];

    for (let frame = 0; frame < 600; frame += 1) {
      state = advanceScrollGlide(state, target, 1 / 120);
      positions.push(state.position);
    }

    expect(positions.every((position) => position <= target)).toBe(true);
    expect(positions.every((position, index) => index === 0 || position >= (positions[index - 1] ?? position))).toBe(true);
    expect(state.position).toBeCloseTo(target, 4);
    expect(state.velocity).toBeCloseTo(0, 4);
  });

  it("glides upward monotonically when the target is above the current position", () => {
    const target = 200;
    let state: ScrollGlideState = { position: 800, velocity: 0 };
    const positions: number[] = [];

    for (let frame = 0; frame < 600; frame += 1) {
      state = advanceScrollGlide(state, target, 1 / 120);
      positions.push(state.position);
    }

    expect(positions.every((position) => position >= target)).toBe(true);
    expect(positions.every((position, index) => index === 0 || position <= (positions[index - 1] ?? position))).toBe(true);
    expect(state.position).toBeCloseTo(target, 4);
  });
});
