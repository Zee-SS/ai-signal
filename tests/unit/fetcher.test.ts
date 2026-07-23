import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithPolicy } from "../../worker/src/adapters/fetcher";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchWithPolicy", () => {
  it("does not retry a non-retryable HTTP failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithPolicy("https://example.com", {}, {
      retries: 2,
      retryBaseMs: 1,
    })).rejects.toThrow("Source returned HTTP 403");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a transient HTTP failure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithPolicy("https://example.com", {}, {
      retries: 2,
      retryBaseMs: 1,
    })).resolves.toBeInstanceOf(Response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
